const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// En producción (Docker) el frontend hace proxy desde nginx, no hay CORS
// En desarrollo permitimos localhost:5173
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? true  // nginx hace proxy, misma origin
    : "http://localhost:5173"
}));
app.use(express.json());

// Rutas
app.use("/api/socios",        require("./routes/socios"));
app.use("/api/usuarios",      require("./routes/usuarios"));
app.use("/api/terapeutas",    require("./routes/terapeutas"));
app.use("/api/servicios",     require("./routes/servicios"));
app.use("/api/sesiones",      require("./routes/sesiones"));
app.use("/api/facturas",      require("./routes/facturas"));
app.use("/api/estadisticas",  require("./routes/estadisticas"));
app.use("/api/importar",      require("./routes/importar"));
app.use("/api/sepa",         require("./routes/sepa"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API Nora funcionando" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
