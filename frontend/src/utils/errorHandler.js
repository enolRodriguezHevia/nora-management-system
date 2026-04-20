// Nombres legibles para los campos técnicos
const CAMPO_LABELS = {
  numSocio:               "Nº de socio",
  nombre:                 "Nombre",
  apellidos:              "Apellidos",
  dni:                    "DNI",
  email:                  "Email",
  telefono:               "Teléfono",
  telefono2:              "Teléfono 2",
  cp:                     "Código postal",
  iban:                   "IBAN",
  tipologia:              "Tipología",
  notificaciones:         "Notificaciones",
  grado:                  "Grado",
  especialidad:           "Especialidad",
  porcentajeDiscapacidad: "% Discapacidad",
  cadencia:               "Cadencia",
  cuota:                  "Cuota",
};

/**
 * Extrae un mensaje de error legible de una respuesta de axios.
 */
export function getErrorMessage(err) {
  const data = err.response?.data;
  if (!data) return err.message;

  if (data.errores && Array.isArray(data.errores)) {
    return data.errores
      .map(e => {
        const label = CAMPO_LABELS[e.campo] || e.campo;
        return `• ${label}: ${e.mensaje}`;
      })
      .join("\n");
  }

  return data.error || err.message;
}
