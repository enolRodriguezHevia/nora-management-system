const router = require("express").Router();
const prisma = require("../lib/prisma");
const { SesionSchema, validate } = require("../lib/schemas");

const NO_COBRABLES = ["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"];

// GET /api/sesiones/programadas-count?mes=4&anio=2026
router.get("/programadas-count", async (req, res) => {
  try {
    const { mes, anio } = req.query;
    if (!mes || !anio) return res.json({ count: 0, usuarioIds: [] });

    const fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
    const fechaFin    = new Date(Number(anio), Number(mes), 0, 23, 59, 59);

    const sesiones = await prisma.sesion.findMany({
      where: { estado: "programada", fecha: { gte: fechaInicio, lte: fechaFin } },
      select: { usuarioId: true },
    });

    const usuarioIds = [...new Set(sesiones.map(s => s.usuarioId))];
    res.json({ count: sesiones.length, usuarioIds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sesiones/metricas-terapeuta?terapeutaId=1&mes=4&anio=2026
router.get("/metricas-terapeuta", async (req, res) => {
  try {
    const { terapeutaId, mes, anio } = req.query;
    if (!terapeutaId || !mes || !anio) return res.json({});

    const fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
    const fechaFin    = new Date(Number(anio), Number(mes), 0, 23, 59, 59);

    const sesiones = await prisma.sesion.findMany({
      where: { terapeutaId: Number(terapeutaId), fecha: { gte: fechaInicio, lte: fechaFin } },
      select: { estado: true, cobrable: true },
    });

    const realizadas  = sesiones.filter(s => s.estado !== "programada");
    const asistidas   = sesiones.filter(s => s.estado === "asistio").length;
    const faltas      = sesiones.filter(s => s.estado === "falta").length;
    const cobrables   = sesiones.filter(s => s.cobrable && s.estado !== "programada").length;
    const programadas = sesiones.filter(s => s.estado === "programada").length;
    const pctAsistencia = realizadas.length > 0
      ? Math.round((asistidas / realizadas.length) * 100)
      : 0;

    res.json({
      total: realizadas.length,
      programadas,
      asistidas,
      faltas,
      cobrables,
      pctAsistencia,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sesiones?mes=4&anio=2026&terapeutaId=1
router.get("/", async (req, res) => {
  try {
    const { mes, anio, terapeutaId, usuarioId } = req.query;

    let fechaInicio, fechaFin;
    if (mes && anio) {
      fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
      fechaFin    = new Date(Number(anio), Number(mes), 0, 23, 59, 59);
    }

    const sesiones = await prisma.sesion.findMany({
      where: {
        ...(terapeutaId && { terapeutaId: Number(terapeutaId) }),
        ...(usuarioId   && { usuarioId:   Number(usuarioId) }),
        ...(fechaInicio && fechaFin && { fecha: { gte: fechaInicio, lte: fechaFin } }),
      },
      include: {
        usuario:   { select: { id: true, nombre: true, apellidos: true } },
        terapeuta: { select: { id: true, nombre: true, apellidos: true, especialidad: true } },
        servicio:  { select: { id: true, nombre: true, precio: true } },
      },
      orderBy: { fecha: "asc" },
    });
    res.json(sesiones);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/sesiones
router.post("/", validate(SesionSchema), async (req, res) => {
  try {
    const data = { ...req.body };
    data.cobrable = !NO_COBRABLES.includes(data.estado);

    const existing = await prisma.sesion.findFirst({
      where: { usuarioId: data.usuarioId, terapeutaId: data.terapeutaId, fecha: data.fecha },
    });

    let sesion;
    if (existing) {
      sesion = await prisma.sesion.update({
        where: { id: existing.id },
        data,
        include: { usuario: true, terapeuta: true, servicio: true },
      });
    } else {
      sesion = await prisma.sesion.create({
        data,
        include: { usuario: true, terapeuta: true, servicio: true },
      });
    }
    res.status(existing ? 200 : 201).json(sesion);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/sesiones/:id
router.put("/:id", validate(SesionSchema.partial()), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.estado) data.cobrable = !NO_COBRABLES.includes(data.estado);
    const sesion = await prisma.sesion.update({
      where: { id: Number(req.params.id) },
      data,
      include: { usuario: true, terapeuta: true, servicio: true },
    });
    res.json(sesion);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/sesiones/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.sesion.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Sesión eliminada" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
