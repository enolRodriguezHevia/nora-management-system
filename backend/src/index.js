const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Rutas
app.use("/api/socios",     require("./routes/socios"));
app.use("/api/usuarios",   require("./routes/usuarios"));
app.use("/api/terapeutas", require("./routes/terapeutas"));
app.use("/api/servicios",  require("./routes/servicios"));
app.use("/api/sesiones",   require("./routes/sesiones"));
app.use("/api/facturas",   require("./routes/facturas"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API Nora funcionando" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
