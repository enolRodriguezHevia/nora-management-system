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
      { id: user.id, username: user.username, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, nombre: user.nombre, username: user.username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me — verifica token y devuelve datos del usuario
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// ─── Middleware de autenticación ──────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No autenticado" });

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = { router, requireAuth };
