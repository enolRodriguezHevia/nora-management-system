const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const { router: authRouter, requireAuth } = require("./routes/auth");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173",
}));
app.use(express.json());

// Ruta pública — login
app.use("/api/auth", authRouter);

// Health check público
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Todas las demás rutas requieren autenticación
app.use("/api", requireAuth);

app.use("/api/socios",       require("./routes/socios"));
app.use("/api/usuarios",     require("./routes/usuarios"));
app.use("/api/terapeutas",   require("./routes/terapeutas"));
app.use("/api/servicios",    require("./routes/servicios"));
app.use("/api/sesiones",     require("./routes/sesiones"));
app.use("/api/facturas",     require("./routes/facturas"));
app.use("/api/estadisticas", require("./routes/estadisticas"));
app.use("/api/importar",     require("./routes/importar"));
app.use("/api/sepa",         require("./routes/sepa"));
app.use("/api/avisos",       require("./routes/avisos"));
app.use("/api/horarios",     require("./routes/horarios"));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
