const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const prisma  = require("../lib/prisma");

const JWT_SECRET = process.env.JWT_SECRET || "nora-secret-2026";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });

    const user = await prisma.userSistema.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol, terapeutaId: user.terapeutaId },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, nombre: user.nombre, username: user.username, rol: user.rol, terapeutaId: user.terapeutaId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/usuarios-sistema — lista usuarios del sistema (solo admin)
router.get("/usuarios-sistema", requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuarios = await prisma.userSistema.findMany({
      select: { id: true, username: true, nombre: true, rol: true, terapeutaId: true, createdAt: true },
      orderBy: { rol: "asc" },
    });
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// ─── Middleware: requiere autenticación ───────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autenticado" });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ─── Middleware: requiere rol admin ───────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.rol !== "admin")
    return res.status(403).json({ error: "Acceso restringido a administradores" });
  next();
}

module.exports = { router, requireAuth, requireAdmin };
