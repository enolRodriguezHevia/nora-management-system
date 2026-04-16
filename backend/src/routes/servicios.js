const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { categoria: "asc" },
    });
    res.json(servicios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/servicios
router.post("/", async (req, res) => {
  try {
    const servicio = await prisma.servicio.create({ data: req.body });
    res.status(201).json(servicio);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/servicios/:id
router.put("/:id", async (req, res) => {
  try {
    const servicio = await prisma.servicio.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(servicio);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
