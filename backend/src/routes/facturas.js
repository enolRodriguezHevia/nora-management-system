const router = require("express").Router();
const prisma  = require("../lib/prisma");
const {
  calcularDescuento,
  agruparSesionesEnLineas,
  obtenerSubtotalHermano,
  siguienteNumRecibo,
} = require("../lib/descuento");

// ─── Helpers locales ──────────────────────────────────────────────────────────

function rangoMes(mes, anio) {
  return {
    fechaInicio: new Date(Date.UTC(Number(anio), Number(mes) - 1, 1)),
    fechaFin:    new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59, 999)),
  };
}

async function getSesionesCobrables(usuarioId, mes, anio) {
  const { fechaInicio, fechaFin } = rangoMes(mes, anio);
  return prisma.sesion.findMany({
    where: { usuarioId, cobrable: true, fecha: { gte: fechaInicio, lte: fechaFin } },
    include: { servicio: true },
  });
}

// ─── GET /api/facturas/desactualizadas?mes=X&anio=Y ───────────────────────────
router.get("/desactualizadas", async (req, res) => {
  try {
    const { mes, anio } = req.query;
    if (!mes || !anio) return res.json({ count: 0 });

    const pendientes = await prisma.factura.findMany({
      where: { mes: Number(mes), anio: Number(anio), estado: "pendiente" },
      select: { id: true, usuarioId: true, subtotal: true },
    });

    let count = 0;
    for (const f of pendientes) {
      const sesiones = await getSesionesCobrables(f.usuarioId, mes, anio);
      const subtotalActual = sesiones.reduce((acc, s) => acc + s.servicio.precio, 0);
      if (Math.abs(subtotalActual - f.subtotal) > 0.01) count++;
    }
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/facturas/recalcular-todas ──────────────────────────────────────
router.post("/recalcular-todas", async (req, res) => {
  try {
    const { mes, anio } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: "mes y anio son obligatorios" });

    const pendientes = await prisma.factura.findMany({
      where: { mes, anio, estado: "pendiente" },
      select: { id: true, usuarioId: true },
    });

    let recalculadas = 0;
    const errores = [];

    for (const f of pendientes) {
      try {
        const sesiones = await getSesionesCobrables(f.usuarioId, mes, anio);
        if (sesiones.length === 0) continue;

        const lineas       = agruparSesionesEnLineas(sesiones);
        const subtotal     = lineas.reduce((acc, l) => acc + l.suma, 0);
        const subtotalHerm = await obtenerSubtotalHermano(prisma, f.usuarioId, subtotal, mes, anio);
        const { descuento, total } = calcularDescuento(subtotal, subtotalHerm);

        await prisma.lineaFactura.deleteMany({ where: { facturaId: f.id } });
        await prisma.factura.update({
          where: { id: f.id },
          data: { subtotal, descuento, total, lineas: { create: lineas } },
        });
        recalculadas++;
      } catch (e) {
        errores.push({ facturaId: f.id, error: e.message });
      }
    }
    res.json({ recalculadas, errores: errores.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/facturas ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { mes, anio, usuarioId, estado } = req.query;
    const facturas = await prisma.factura.findMany({
      where: {
        ...(mes       && { mes:       Number(mes) }),
        ...(anio      && { anio:      Number(anio) }),
        ...(usuarioId && { usuarioId: Number(usuarioId) }),
        ...(estado    && { estado }),
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellidos: true, direccion: true, cp: true, poblacion: true, dni: true } },
        lineas:  { include: { servicio: true } },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });
    res.json(facturas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/facturas/:id ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const factura = await prisma.factura.findUnique({
      where: { id: Number(req.params.id) },
      include: { usuario: true, lineas: { include: { servicio: true } } },
    });
    if (!factura) return res.status(404).json({ error: "Factura no encontrada" });
    res.json(factura);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/facturas/generar ───────────────────────────────────────────────
router.post("/generar", async (req, res) => {
  try {
    const { usuarioId, mes, anio } = req.body;

    const existe = await prisma.factura.findFirst({ where: { usuarioId, mes, anio } });
    if (existe) return res.status(400).json({ error: "Ya existe una factura para este usuario y mes" });

    const sesiones = await getSesionesCobrables(usuarioId, mes, anio);
    if (sesiones.length === 0) return res.status(400).json({ error: "No hay sesiones cobrables para este mes" });

    const lineas       = agruparSesionesEnLineas(sesiones);
    const subtotal     = lineas.reduce((acc, l) => acc + l.suma, 0);
    const subtotalHerm = await obtenerSubtotalHermano(prisma, usuarioId, subtotal, mes, anio);
    const { descuento, total } = calcularDescuento(subtotal, subtotalHerm);
    const numRecibo    = await siguienteNumRecibo(prisma, anio);

    const factura = await prisma.factura.create({
      data: { numRecibo, usuarioId, mes, anio, subtotal, descuento, total, lineas: { create: lineas } },
      include: { usuario: true, lineas: { include: { servicio: true } } },
    });
    res.status(201).json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── POST /api/facturas/generar-masivo ────────────────────────────────────────
router.post("/generar-masivo", async (req, res) => {
  try {
    const { mes, anio } = req.body;
    if (!mes || !anio) return res.status(400).json({ error: "Mes y año son requeridos" });

    const { fechaInicio, fechaFin } = rangoMes(mes, anio);
    const todasSesiones = await prisma.sesion.findMany({
      where: { cobrable: true, fecha: { gte: fechaInicio, lte: fechaFin } },
      include: { servicio: true, usuario: { select: { id: true, nombre: true, apellidos: true, baja: true } } },
    });

    // Agrupar por usuario (solo activos)
    const porUsuario = {};
    for (const s of todasSesiones) {
      if (s.usuario.baja) continue;
      if (!porUsuario[s.usuarioId]) porUsuario[s.usuarioId] = { usuario: s.usuario, sesiones: [] };
      porUsuario[s.usuarioId].sesiones.push(s);
    }

    const usuarioIds = Object.keys(porUsuario).map(Number);
    if (usuarioIds.length === 0) return res.status(400).json({ error: "No hay usuarios con sesiones cobrables para este mes" });

    const existentes = await prisma.factura.findMany({
      where: { mes, anio, usuarioId: { in: usuarioIds } },
      select: { usuarioId: true },
    });
    const conFactura  = new Set(existentes.map(f => f.usuarioId));
    const pendientes  = usuarioIds.filter(uid => !conFactura.has(uid));

    if (pendientes.length === 0) {
      return res.status(400).json({ error: "Todos los usuarios ya tienen factura generada para este mes", yaGeneradas: conFactura.size });
    }

    const facturasGeneradas = [];
    const errores = [];

    for (const uid of pendientes) {
      try {
        const lineas       = agruparSesionesEnLineas(porUsuario[uid].sesiones);
        const subtotal     = lineas.reduce((acc, l) => acc + l.suma, 0);
        const subtotalHerm = await obtenerSubtotalHermano(prisma, uid, subtotal, mes, anio);
        const { descuento, total } = calcularDescuento(subtotal, subtotalHerm);
        const numRecibo    = await siguienteNumRecibo(prisma, anio);

        const factura = await prisma.factura.create({
          data: { numRecibo, usuarioId: uid, mes, anio, subtotal, descuento, total, lineas: { create: lineas } },
          include: { usuario: true, lineas: { include: { servicio: true } } },
        });
        facturasGeneradas.push(factura);
      } catch (error) {
        errores.push({
          usuarioId: uid,
          usuario: `${porUsuario[uid].usuario.nombre} ${porUsuario[uid].usuario.apellidos}`,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      generadas: facturasGeneradas.length,
      yaExistian: conFactura.size,
      errores: errores.length,
      detalleErrores: errores,
      facturas: facturasGeneradas,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PUT /api/facturas/:id/estado ─────────────────────────────────────────────
router.put("/:id/estado", async (req, res) => {
  try {
    const factura = await prisma.factura.update({
      where: { id: Number(req.params.id) },
      data: { estado: req.body.estado },
    });
    res.json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── PUT /api/facturas/:id/recalcular ─────────────────────────────────────────
router.put("/:id/recalcular", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const actual = await prisma.factura.findUnique({
      where: { id },
      select: { usuarioId: true, mes: true, anio: true, estado: true },
    });
    if (!actual) return res.status(404).json({ error: "Factura no encontrada" });
    if (actual.estado === "anulada") return res.status(400).json({ error: "No se puede recalcular una factura anulada" });

    const { usuarioId, mes, anio } = actual;
    const sesiones = await getSesionesCobrables(usuarioId, mes, anio);
    if (sesiones.length === 0) return res.status(400).json({ error: "No hay sesiones cobrables para recalcular" });

    const lineas       = agruparSesionesEnLineas(sesiones);
    const subtotal     = lineas.reduce((acc, l) => acc + l.suma, 0);
    const subtotalHerm = await obtenerSubtotalHermano(prisma, usuarioId, subtotal, mes, anio);
    const { descuento, total } = calcularDescuento(subtotal, subtotalHerm);

    await prisma.lineaFactura.deleteMany({ where: { facturaId: id } });
    const factura = await prisma.factura.update({
      where: { id },
      data: { subtotal, descuento, total, lineas: { create: lineas } },
      include: { usuario: true, lineas: { include: { servicio: true } } },
    });
    res.json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
