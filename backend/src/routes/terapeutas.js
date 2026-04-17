const router = require("express").Router();
const prisma = require("../lib/prisma");
const { TerapeutaSchema, validate } = require("../lib/schemas");

// GET /api/terapeutas
router.get("/", async (req, res) => {
  try {
    const terapeutas = await prisma.terapeuta.findMany({
      where: { activo: true },
      orderBy: { especialidad: "asc" },
    });
    res.json(terapeutas);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/terapeutas/:id
router.get("/:id", async (req, res) => {
  try {
    const terapeuta = await prisma.terapeuta.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        sesiones: {
          include: {
            usuario: { select: { id: true, nombre: true, apellidos: true } },
            servicio: true,
          },
          orderBy: { fecha: "desc" },
          take: 50,
        },
      },
    });
    if (!terapeuta) return res.status(404).json({ error: "Terapeuta no encontrado" });
    res.json(terapeuta);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/terapeutas
router.post("/", validate(TerapeutaSchema), async (req, res) => {
  try {
    const terapeuta = await prisma.terapeuta.create({ data: req.body });
    res.status(201).json(terapeuta);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/terapeutas/:id
router.put("/:id", validate(TerapeutaSchema.partial()), async (req, res) => {
  try {
    const terapeuta = await prisma.terapeuta.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(terapeuta);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
