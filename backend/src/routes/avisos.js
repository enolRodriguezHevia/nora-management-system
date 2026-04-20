const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/avisos?usuarioId=1&resuelto=false
router.get("/", async (req, res) => {
  try {
    const { usuarioId, resuelto } = req.query;
    const avisos = await prisma.aviso.findMany({
      where: {
        ...(usuarioId && { usuarioId: Number(usuarioId) }),
        ...(resuelto !== undefined && { resuelto: resuelto === "true" }),
      },
      include: { usuario: { select: { id: true, nombre: true, apellidos: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(avisos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/avisos
router.post("/", async (req, res) => {
  try {
    const { usuarioId, texto } = req.body;
    if (!usuarioId || !texto?.trim()) {
      return res.status(400).json({ error: "usuarioId y texto son obligatorios" });
    }
    const aviso = await prisma.aviso.create({
      data: { usuarioId: Number(usuarioId), texto: texto.trim() },
      include: { usuario: { select: { id: true, nombre: true, apellidos: true } } },
    });
    res.status(201).json(aviso);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/avisos/:id — marcar resuelto/pendiente
router.put("/:id", async (req, res) => {
  try {
    const aviso = await prisma.aviso.update({
      where: { id: Number(req.params.id) },
      data: { resuelto: req.body.resuelto, texto: req.body.texto },
    });
    res.json(aviso);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/avisos/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.aviso.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Aviso eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
