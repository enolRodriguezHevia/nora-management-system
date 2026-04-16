const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/facturas
router.get("/", async (req, res) => {
  try {
    const { mes, anio, usuarioId, estado } = req.query;
    const facturas = await prisma.factura.findMany({
      where: {
        ...(mes      && { mes:       Number(mes) }),
        ...(anio     && { anio:      Number(anio) }),
        ...(usuarioId && { usuarioId: Number(usuarioId) }),
        ...(estado   && { estado }),
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

// GET /api/facturas/:id
router.get("/:id", async (req, res) => {
  try {
    const factura = await prisma.factura.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        usuario: true,
        lineas: { include: { servicio: true } },
      },
    });
    if (!factura) return res.status(404).json({ error: "Factura no encontrada" });
    res.json(factura);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/facturas/generar — genera factura automáticamente desde sesiones del mes
router.post("/generar", async (req, res) => {
  try {
    const { usuarioId, mes, anio } = req.body;

    // Verificar si ya existe
    const existe = await prisma.factura.findFirst({ where: { usuarioId, mes, anio } });
    if (existe) return res.status(400).json({ error: "Ya existe una factura para este usuario y mes" });

    // Obtener sesiones cobrables del mes
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin    = new Date(anio, mes, 0, 23, 59, 59);

    const sesiones = await prisma.sesion.findMany({
      where: { usuarioId, cobrable: true, fecha: { gte: fechaInicio, lte: fechaFin } },
      include: { servicio: true },
    });

    if (sesiones.length === 0) {
      return res.status(400).json({ error: "No hay sesiones cobrables para este mes" });
    }

    // Agrupar por servicio
    const agrupado = {};
    for (const s of sesiones) {
      const key = s.servicioId;
      if (!agrupado[key]) {
        agrupado[key] = { servicio: s.servicio, count: 0 };
      }
      agrupado[key].count++;
    }

    const lineas = Object.values(agrupado).map((g) => ({
      servicioId:   g.servicio.id,
      numSesiones:  g.count,
      precioSesion: g.servicio.precio,
      suma:         g.count * g.servicio.precio,
    }));

    const subtotal = lineas.reduce((acc, l) => acc + l.suma, 0);
    const descuento = subtotal > 120 ? subtotal * 0.1 : 0;
    const total = subtotal - descuento;

    // Número de recibo: MM/YYYY
    const numRecibo = `${String(mes).padStart(2, "0")}/${anio}-${usuarioId}`;

    const factura = await prisma.factura.create({
      data: {
        numRecibo,
        usuarioId,
        mes,
        anio,
        subtotal,
        descuento,
        total,
        lineas: { create: lineas },
      },
      include: { usuario: true, lineas: { include: { servicio: true } } },
    });

    res.status(201).json(factura);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/facturas/:id/estado
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

module.exports = router;
