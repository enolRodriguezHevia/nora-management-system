const router = require("express").Router();
const prisma = require("../lib/prisma");
const { z } = require("zod");
const { validate } = require("../lib/schemas");

const VoluntarioSchema = z.object({
  nombre:          z.string().min(1, "El nombre es obligatorio"),
  apellidos:       z.string().min(1, "Los apellidos son obligatorios"),
  dni:             z.string().optional().nullable(),
  fechaNacimiento: z.coerce.date().optional().nullable(),
  telefono:        z.string().optional().nullable(),
  email:           z.string().email("Email inválido").optional().nullable(),
  direccion:       z.string().optional().nullable(),
  poblacion:       z.string().optional().nullable(),
  cp:              z.string().optional().nullable(),
  provincia:       z.string().optional().nullable(),
  fechaAlta:       z.coerce.date().optional().nullable(),
  baja:            z.boolean().optional(),
  fechaBaja:       z.coerce.date().optional().nullable(),
  observaciones:   z.string().optional().nullable(),
});

const VoluntarioUpdateSchema = VoluntarioSchema.partial();

// GET /api/voluntarios
router.get("/", async (req, res) => {
  try {
    const { search, baja } = req.query;
    const voluntarios = await prisma.voluntario.findMany({
      where: {
        ...(baja !== undefined && { baja: baja === "true" }),
        ...(search && {
          OR: [
            { nombre:    { contains: search } },
            { apellidos: { contains: search } },
            { dni:       { contains: search } },
          ],
        }),
      },
      orderBy: { apellidos: "asc" },
    });
    res.json(voluntarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/voluntarios/:id
router.get("/:id", async (req, res) => {
  try {
    const voluntario = await prisma.voluntario.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!voluntario) return res.status(404).json({ error: "Voluntario no encontrado" });
    res.json(voluntario);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/voluntarios
router.post("/", validate(VoluntarioSchema), async (req, res) => {
  try {
    const voluntario = await prisma.voluntario.create({ data: req.body });
    res.status(201).json(voluntario);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/voluntarios/:id
router.put("/:id", validate(VoluntarioUpdateSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const cleanData = Object.fromEntries(
      Object.entries(req.body).filter(([, v]) => v !== undefined)
    );
    const voluntario = await prisma.voluntario.update({ where: { id }, data: cleanData });
    res.json(voluntario);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/voluntarios/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.voluntario.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Voluntario eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
