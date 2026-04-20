const router = require("express").Router();
const prisma = require("../lib/prisma");
const { z } = require("zod");
const { UsuarioSchema, BancarioSchema, validate } = require("../lib/schemas");

const UsuarioWithBancarioSchema = UsuarioSchema.extend({
  datosBancarios: z.array(BancarioSchema).optional(),
});

// Para PUT: todos los campos opcionales (permite actualizaciones parciales como dar de baja)
const UsuarioUpdateSchema = UsuarioWithBancarioSchema.partial();

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
        socioVinculado:  { select: { id: true, numSocio: true, nombre: true, apellidos: true } },
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
        socioVinculado:  true,
        socioVinculado2: true,
        sesiones: {
          include: { servicio: true, terapeuta: true },
          orderBy: { fecha: "desc" },
          take: 50,
        },
        facturas: {
          include: { lineas: { include: { servicio: true } } },
          orderBy: [{ anio: "desc" }, { mes: "desc" }],
        },
      },
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/usuarios
router.post("/", validate(UsuarioWithBancarioSchema), async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const usuario = await prisma.usuario.create({
      data: {
        ...data,
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
router.put("/:id", validate(UsuarioUpdateSchema), async (req, res) => {
  try {
    const { datosBancarios, ...data } = req.body;
    const id = Number(req.params.id);

    // Eliminar claves undefined para no sobreescribir campos no enviados
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    await prisma.usuario.update({ where: { id }, data: cleanData });

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
    const id = Number(req.params.id);

    // Verificar si tiene sesiones o facturas antes de eliminar
    const [sesiones, facturas] = await Promise.all([
      prisma.sesion.count({ where: { usuarioId: id } }),
      prisma.factura.count({ where: { usuarioId: id } }),
    ]);

    if (sesiones > 0 || facturas > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: el usuario tiene ${sesiones} sesion${sesiones !== 1 ? "es" : ""} y ${facturas} factura${facturas !== 1 ? "s" : ""} asociadas. Usa "Dar de baja" para desactivarlo conservando el historial.`,
      });
    }

    // Eliminar datos bancarios primero (no tienen cascade en schema)
    await prisma.usuarioBancario.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });
    res.json({ message: "Usuario eliminado" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
