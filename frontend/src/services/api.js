import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: añade el token JWT a todas las peticiones
api.interceptors.request.use(config => {
  const token = localStorage.getItem("nora_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: si el servidor devuelve 401, redirige al login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("nora_token");
      localStorage.removeItem("nora_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const sociosService = {
  getAll:   (params)     => api.get("/socios", { params }),
  getById:  (id)         => api.get(`/socios/${id}`),
  nextNum:  ()           => api.get("/socios/next-num"),
  create:   (data)       => api.post("/socios", data),
  update:   (id, data)   => api.put(`/socios/${id}`, data),
  delete:   (id)         => api.delete(`/socios/${id}`),
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
  getAll:            (params)       => api.get("/sesiones", { params }),
  programadasCount:  (mes, anio)    => api.get("/sesiones/programadas-count", { params: { mes, anio } }),
  metricasTerapeuta: (terapeutaId, mes, anio) => api.get("/sesiones/metricas-terapeuta", { params: { terapeutaId, mes, anio } }),
  create:  (data)      => api.post("/sesiones", data),
  update:  (id, data)  => api.put(`/sesiones/${id}`, data),
  delete:  (id)        => api.delete(`/sesiones/${id}`),
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

export const authService = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  me:    () => api.get("/auth/me"),
};

export const horariosService = {
  getAll:      (params) => api.get("/horarios", { params }),
  create:      (data)   => api.post("/horarios", data),
  delete:      (id)     => api.delete(`/horarios/${id}`),
  generarMes:  (data)   => api.post("/horarios/generar-mes", data),
};

export const avisosService = {
  getAll:  (params)    => api.get("/avisos", { params }),
  create:  (data)      => api.post("/avisos", data),
  update:  (id, data)  => api.put(`/avisos/${id}`, data),
  delete:  (id)        => api.delete(`/avisos/${id}`),
};

export default api;
