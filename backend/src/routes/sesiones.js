const router = require("express").Router();
const prisma = require("../lib/prisma");

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
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body, fecha: new Date(req.body.fecha) };
    // cobrable = true si asistió o falta del usuario; false si festivo/vacaciones/hospitalización
    const noCobrables = ["festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"];
    data.cobrable = !noCobrables.includes(data.estado);

    const sesion = await prisma.sesion.create({
      data,
      include: { usuario: true, terapeuta: true, servicio: true },
    });
    res.status(201).json(sesion);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/sesiones/:id
router.put("/:id", async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.fecha) data.fecha = new Date(data.fecha);
    if (data.estado) {
      const noCobrables = ["festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"];
      data.cobrable = !noCobrables.includes(data.estado);
    }
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
