const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /api/usuarios
router.get("/", async (req, res) => {
  try {
    const { search, baja } = req.query;
    const usuarios = await prisma.usuario.findMany({
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
      include: {
        datosBancarios: true,
        socioVinculado: { select: { id: true, numSocio: true, nombre: true, apellidos: true } },
        socioVinculado2: { select: { id: true, numSocio: true, nombre: true, apellidos: true } },
      },
      orderBy: { apellidos: "asc" },
    });
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/usuarios/:id
router.get("/:id", async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        datosBancarios: true,
        socioVinculado: true,
        socioVinculado2: true,
        sesiones: { include: { servicio: true, terapeuta: true }, orderBy: { fecha: "desc" }, take: 20 },
      },
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/usuarios
router.post("/", async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        fechaAlta: data.fechaAlta ? new Date(data.fechaAlta) : null,
        fechaBaja: data.fechaBaja ? new Date(data.fechaBaja) : null,
        datosBancarios: datosBancarios ? { create: datosBancarios } : undefined,
      },
      include: { datosBancarios: true },
    });
    res.status(201).json(usuario);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/usuarios/:id
router.put("/:id", async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const id = Number(req.params.id);

    await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        fechaAlta: data.fechaAlta ? new Date(data.fechaAlta) : null,
        fechaBaja: data.fechaBaja ? new Date(data.fechaBaja) : null,
      },
    });

    // Upsert datos bancarios
    if (datosBancarios && datosBancarios.length > 0) {
      await prisma.usuarioBancario.deleteMany({ where: { usuarioId: id } });
      await prisma.usuarioBancario.createMany({
        data: datosBancarios.map(({ id: _id, usuarioId: _uid, ...db }) => ({ ...db, usuarioId: id })),
      });
    }

    const result = await prisma.usuario.findUnique({
      where: { id },
      include: { datosBancarios: true },
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/usuarios/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Usuario eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
