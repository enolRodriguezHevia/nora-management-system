const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const { router: authRouter, requireAuth, requireAdmin } = require("./routes/auth");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
}));
app.use(express.json());

// Rutas públicas
app.use("/api/auth", authRouter);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Todas las rutas requieren autenticación
app.use("/api", requireAuth);

// Rutas accesibles para terapeutas y admin
app.use("/api/sesiones",     require("./routes/sesiones"));
app.use("/api/usuarios",     require("./routes/usuarios"));   // terapeutas ven fichas de sus usuarios
app.use("/api/terapeutas",   require("./routes/terapeutas")); // para cargar su propio perfil
app.use("/api/servicios",    require("./routes/servicios"));  // para el selector de servicios

// Rutas solo para admin
app.use("/api/socios",       requireAdmin, require("./routes/socios"));
app.use("/api/facturas",     requireAdmin, require("./routes/facturas"));
app.use("/api/estadisticas", requireAdmin, require("./routes/estadisticas"));
app.use("/api/importar",     requireAdmin, require("./routes/importar"));
app.use("/api/sepa",         requireAdmin, require("./routes/sepa"));
app.use("/api/avisos",       requireAdmin, require("./routes/avisos"));
app.use("/api/horarios",     requireAdmin, require("./routes/horarios"));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
