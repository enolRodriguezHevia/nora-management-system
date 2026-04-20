import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const sociosService = {
  getAll:  (params) => api.get("/socios", { params }),
  getById: (id)     => api.get(`/socios/${id}`),
  create:  (data)   => api.post("/socios", data),
  update:  (id, data) => api.put(`/socios/${id}`, data),
  delete:  (id)     => api.delete(`/socios/${id}`),
};

export const usuariosService = {
  getAll:  (params) => api.get("/usuarios", { params }),
  getById: (id)     => api.get(`/usuarios/${id}`),
  create:  (data)   => api.post("/usuarios", data),
  update:  (id, data) => api.put(`/usuarios/${id}`, data),
  delete:  (id)     => api.delete(`/usuarios/${id}`),
};

export const terapeutasService = {
  getAll:  ()       => api.get("/terapeutas"),
  getById: (id)     => api.get(`/terapeutas/${id}`),
  create:  (data)   => api.post("/terapeutas", data),
  update:  (id, data) => api.put(`/terapeutas/${id}`, data),
};

export const serviciosService = {
  getAll:  ()       => api.get("/servicios"),
  create:  (data)   => api.post("/servicios", data),
  update:  (id, data) => api.put(`/servicios/${id}`, data),
};

export const sesionesService = {
  getAll:  (params) => api.get("/sesiones", { params }),
  create:  (data)   => api.post("/sesiones", data),
  update:  (id, data) => api.put(`/sesiones/${id}`, data),
  delete:  (id)     => api.delete(`/sesiones/${id}`),
};

export const facturasService = {
  getAll:   (params) => api.get("/facturas", { params }),
  getById:  (id)     => api.get(`/facturas/${id}`),
  generar:  (data)   => api.post("/facturas/generar", data),
  generarMasivo: (data) => api.post("/facturas/generar-masivo", data),
  updateEstado: (id, estado) => api.put(`/facturas/${id}/estado`, { estado }),
};

export const estadisticasService = {
  get: (params) => api.get("/estadisticas", { params }),
};

export const sepaService = {
  preview: (mes, anio) => api.get("/sepa/preview", { params: { mes, anio } }),
};

export default api;
