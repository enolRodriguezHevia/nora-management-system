const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/socios
router.get("/", async (req, res) => {
  try {
    const { search, baja } = req.query;
    const socios = await prisma.socio.findMany({
      where: {
        ...(baja !== undefined && { baja: baja === "true" }),
        ...(search && {
          OR: [
            { nombre: { contains: search } },
            { apellidos: { contains: search } },
            { dni: { contains: search } },
          ],
        }),
      },
      include: { datosBancarios: true },
      orderBy: { numSocio: "asc" },
    });
    res.json(socios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/socios/:id
router.get("/:id", async (req, res) => {
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: Number(req.params.id) },
      include: { datosBancarios: true, usuariosVinculados: true, usuariosVinculados2: true },
    });
    if (!socio) return res.status(404).json({ error: "Socio no encontrado" });
    res.json(socio);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/socios
router.post("/", async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const socio = await prisma.socio.create({
      data: {
        ...data,
        fechaAlta: data.fechaAlta ? new Date(data.fechaAlta) : null,
        fechaBaja: data.fechaBaja ? new Date(data.fechaBaja) : null,
        datosBancarios: datosBancarios ? { create: datosBancarios } : undefined,
      },
      include: { datosBancarios: true },
    });
    res.status(201).json(socio);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/socios/:id
router.put("/:id", async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const id = Number(req.params.id);

    await prisma.socio.update({
      where: { id },
      data: {
        ...data,
        fechaAlta: data.fechaAlta ? new Date(data.fechaAlta) : null,
        fechaBaja: data.fechaBaja ? new Date(data.fechaBaja) : null,
      },
    });

    // Upsert datos bancarios
    if (datosBancarios && datosBancarios.length > 0) {
      await prisma.socioBancario.deleteMany({ where: { socioId: id } });
      await prisma.socioBancario.createMany({
        data: datosBancarios.map(({ id: _id, socioId: _sid, ...db }) => ({ ...db, socioId: id })),
      });
    }

    const result = await prisma.socio.findUnique({
      where: { id },
      include: { datosBancarios: true },
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/socios/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.socio.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Socio eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
