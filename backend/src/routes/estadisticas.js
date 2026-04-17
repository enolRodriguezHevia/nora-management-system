const { Router } = require("express");
const prisma      = require("../lib/prisma");

const router = Router();

// GET /api/estadisticas
// Devuelve todos los datos necesarios para los gráficos del dashboard
router.get("/", async (req, res) => {
  try {
    const now      = new Date();
    const anio     = parseInt(req.query.anio)     || now.getFullYear();
    const mesDesde = parseInt(req.query.mesDesde) || 1;
    const mesHasta = parseInt(req.query.mesHasta) || 12;

    const fechaDesde = new Date(`${anio}-${String(mesDesde).padStart(2,"0")}-01`);
    // Último día del mes mesHasta
    const fechaHasta = new Date(anio, mesHasta, 0, 23, 59, 59);

    // ── 1. Facturación mensual del año (ingresos por mes) ─────────────────
    const facturasPorMes = await prisma.factura.groupBy({
      by: ["mes"],
      where: { anio, mes: { gte: mesDesde, lte: mesHasta }, estado: { not: "anulada" } },
      _sum: { total: true, subtotal: true, descuento: true },
      _count: { id: true },
      orderBy: { mes: "asc" },
    });

    const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const facturacionMensual = MESES.slice(mesDesde - 1, mesHasta).map((label, i) => {
      const mesNum = mesDesde + i;
      const found  = facturasPorMes.find(f => f.mes === mesNum);
      return {
        mes:       label,
        total:     found?._sum.total     ?? 0,
        subtotal:  found?._sum.subtotal  ?? 0,
        descuento: found?._sum.descuento ?? 0,
        facturas:  found?._count.id      ?? 0,
      };
    });

    // ── 2. Sesiones por estado ────────────────────────────────────────────
    const sesionesPorEstado = await prisma.sesion.groupBy({
      by: ["estado"],
      where: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      _count: { id: true },
    });

    const ESTADO_LABEL = {
      asistio:              "Asistió",
      falta:                "Falta",
      festivo:              "Festivo",
      vacaciones_terapeuta: "Vac. terapeuta",
      permiso:              "Permiso",
      hospitalizacion:      "Hospitalización",
    };
    const estadosSesiones = sesionesPorEstado.map(e => ({
      estado: ESTADO_LABEL[e.estado] || e.estado,
      count:  e._count.id,
    }));

    // ── 3. Sesiones mensuales ─────────────────────────────────────────────
    const todasSesiones = await prisma.sesion.findMany({
      where: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      select: { fecha: true, cobrable: true, estado: true },
    });

    const sesionesMensuales = MESES.slice(mesDesde - 1, mesHasta).map((label, i) => {
      const mesNum  = mesDesde + i;
      const del_mes = todasSesiones.filter(s => new Date(s.fecha).getMonth() === mesNum - 1);
      return {
        mes:        label,
        total:      del_mes.length,
        cobrables:  del_mes.filter(s => s.cobrable).length,
        asistencia: del_mes.filter(s => s.estado === "asistio").length,
      };
    });

    // ── 4. Ingresos por terapeuta ─────────────────────────────────────────
    const sesionesConTerapeuta = await prisma.sesion.findMany({
      where: { cobrable: true, fecha: { gte: fechaDesde, lte: fechaHasta } },
      include: {
        terapeuta: { select: { nombre: true, apellidos: true, especialidad: true } },
        servicio:  { select: { precio: true } },
      },
    });

    const porTerapeuta = {};
    for (const s of sesionesConTerapeuta) {
      const key = `${s.terapeuta.nombre} ${s.terapeuta.apellidos}`;
      if (!porTerapeuta[key]) {
        porTerapeuta[key] = { nombre: key, especialidad: s.terapeuta.especialidad, sesiones: 0, ingresos: 0 };
      }
      porTerapeuta[key].sesiones++;
      porTerapeuta[key].ingresos += s.servicio?.precio ?? 0;
    }
    const ingresosPorTerapeuta = Object.values(porTerapeuta).sort((a, b) => b.ingresos - a.ingresos);

    // ── 5. Top servicios más utilizados ──────────────────────────────────
    const sesionesConServicio = await prisma.sesion.groupBy({
      by: ["servicioId"],
      where: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const serviciosIds  = sesionesConServicio.map(s => s.servicioId).filter(Boolean);
    const serviciosInfo = await prisma.servicio.findMany({
      where: { id: { in: serviciosIds } },
      select: { id: true, nombre: true, precio: true },
    });

    const topServicios = sesionesConServicio.map(s => {
      const info = serviciosInfo.find(sv => sv.id === s.servicioId);
      return {
        nombre:   info?.nombre ?? "Desconocido",
        sesiones: s._count.id,
        ingresos: (info?.precio ?? 0) * s._count.id,
      };
    });

    // ── 6. Estado de facturas ─────────────────────────────────────────────
    const facturasPorEstado = await prisma.factura.groupBy({
      by: ["estado"],
      where: { anio, mes: { gte: mesDesde, lte: mesHasta } },
      _count: { id: true },
      _sum:   { total: true },
    });

    const estadosFacturas = facturasPorEstado.map(f => ({
      estado: f.estado.charAt(0).toUpperCase() + f.estado.slice(1),
      count:  f._count.id,
      total:  f._sum.total ?? 0,
    }));

    // ── 7. KPIs resumen ───────────────────────────────────────────────────
    const [totalUsuarios, totalSocios, totalSesionesAnio, totalFacturadoAnio] = await Promise.all([
      prisma.usuario.count({ where: { baja: false } }),
      prisma.socio.count({ where: { baja: false } }),
      prisma.sesion.count({ where: { fecha: { gte: fechaDesde, lte: fechaHasta } } }),
      prisma.factura.aggregate({
        where: { anio, mes: { gte: mesDesde, lte: mesHasta }, estado: { not: "anulada" } },
        _sum: { total: true },
      }),
    ]);

    res.json({
      anio,
      kpis: {
        totalUsuarios,
        totalSocios,
        totalSesionesAnio,
        totalFacturadoAnio: totalFacturadoAnio._sum.total ?? 0,
      },
      facturacionMensual,
      sesionesMensuales,
      estadosSesiones,
      ingresosPorTerapeuta,
      topServicios,
      estadosFacturas,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
