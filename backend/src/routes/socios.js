const router = require("express").Router();
const prisma = require("../lib/prisma");
const { z } = require("zod");
const { SocioCreateSchema, SocioSchema, BancarioSchema, validate } = require("../lib/schemas");

const SocioWithBancarioSchema = SocioCreateSchema.extend({
  datosBancarios: z.array(BancarioSchema).optional(),
});
// Para PUT: todos los campos opcionales (permite actualizaciones parciales como dar de baja)
const SocioUpdateWithBancarioSchema = SocioSchema.partial().extend({
  datosBancarios: z.array(BancarioSchema).optional(),
});

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
router.post("/", validate(SocioWithBancarioSchema), async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const socio = await prisma.socio.create({
      data: {
        ...data,
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
router.put("/:id", validate(SocioUpdateWithBancarioSchema), async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const id = Number(req.params.id);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    await prisma.socio.update({ where: { id }, data: cleanData });

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
    const id = Number(req.params.id);

    // Verificar si tiene usuarios vinculados
    const usuarios = await prisma.usuario.count({
      where: { OR: [{ socioVinculadoId: id }, { socioVinculado2Id: id }] },
    });

    if (usuarios > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: el socio tiene ${usuarios} usuario${usuarios !== 1 ? "s" : ""} vinculado${usuarios !== 1 ? "s" : ""}. Desvincula primero los usuarios o usa "Dar de baja".`,
      });
    }

    await prisma.socioBancario.deleteMany({ where: { socioId: id } });
    await prisma.socio.delete({ where: { id } });
    res.json({ message: "Socio eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
