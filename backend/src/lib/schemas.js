const { z } = require("zod");

// ─── Validadores reutilizables ────────────────────────────────────────────────

const dniRegex    = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-Z]\d{7}[A-Z0-9])$/i;
const telefonoRegex = /^[0-9\s\+\-\.]{7,15}$/;
const ibanRegex   = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const cpRegex     = /^\d{5}$/;

const IBAN_LONGITUDES = { ES: 24, DE: 22, FR: 27, GB: 22, IT: 27, PT: 25, NL: 18 };

function validarIBAN(iban) {
  if (!iban) return true;
  const clean = iban.replace(/\s/g, "").toUpperCase();
  const longEsperada = IBAN_LONGITUDES[clean.slice(0, 2)];
  if (longEsperada && clean.length !== longEsperada) return false;
  if (!ibanRegex.test(clean)) return false;
  const reordenado = clean.slice(4) + clean.slice(0, 4);
  const numerico = reordenado.split("").map(c => isNaN(c) ? (c.charCodeAt(0) - 55).toString() : c).join("");
  let resto = 0;
  for (const chunk of numerico.match(/.{1,9}/g)) {
    resto = parseInt(resto + chunk) % 97;
  }
  return resto === 1;
}

// Campos opcionales con formato — string vacío se trata como "no informado" (null)
const optionalString  = z.string().nullable().optional().transform(v => v || null);
const optionalEmail   = z.union([z.literal(""), z.string().email("Email no válido")])
                         .nullable().optional().transform(v => v || null);
const optionalTel     = z.union([z.literal(""), z.string().regex(telefonoRegex, "Teléfono no válido (7-15 dígitos)")])
                         .nullable().optional().transform(v => v || null);
const optionalCP      = z.union([z.literal(""), z.string().regex(cpRegex, "Código postal debe tener 5 dígitos")])
                         .nullable().optional().transform(v => v || null);
const optionalDNI     = z.union([z.literal(""), z.string().regex(dniRegex, "DNI/NIE/CIF no válido")])
                         .nullable().optional().transform(v => v || null);
const optionalIBAN    = z.string().nullable().optional()
  .transform(v => v ? v.replace(/\s/g, "").toUpperCase() : null)
  .refine(validarIBAN, "IBAN no válido — comprueba longitud y dígitos de control");

// ─── Schema Socio ─────────────────────────────────────────────────────────────

const SocioSchema = z.object({
  numSocio:       z.number({ required_error: "numSocio es obligatorio", invalid_type_error: "numSocio debe ser un número" })
                   .int("numSocio debe ser entero").positive("numSocio debe ser mayor que 0"),
  nombre:         z.string({ required_error: "nombre es obligatorio" }).min(1, "nombre no puede estar vacío"),
  apellidos:      z.string({ required_error: "apellidos es obligatorio" }).min(1, "apellidos no puede estar vacío"),
  dni:            optionalDNI,
  direccion:      optionalString,
  poblacion:      optionalString,
  cp:             optionalCP,
  provincia:      optionalString,
  telefono:       optionalTel,
  telefono2:      optionalTel,
  email:          optionalEmail,
  tipologia:      z.union([z.literal(""), z.enum(["Afectado", "Colaborador"])]).nullable().optional().transform(v => v || null),
  notificaciones: z.union([z.literal(""), z.enum(["Email", "Correo Postal"])]).nullable().optional().transform(v => v || null),
  referencias:    optionalString,
  observaciones:  optionalString,
  empresa:        z.boolean().optional().default(false),
  baja:           z.boolean().optional().default(false),
  fechaAlta:      z.coerce.date().nullable().optional(),
  fechaBaja:      z.coerce.date().nullable().optional(),
}).partial({ numSocio: true }); // numSocio opcional en PUT (ya viene en la URL)

const SocioCreateSchema = SocioSchema.required({ numSocio: true });

// ─── Schema DatosBancarios ────────────────────────────────────────────────────

const BancarioSchema = z.object({
  entidadBancaria: optionalString,
  iban:            optionalIBAN,
  codigoEntidad:   optionalString,
  codigoSucursal:  optionalString,
  dc:              optionalString,
  numeroCuenta:    optionalString,
  cadencia:        z.union([z.literal(""), z.enum(["Mensual", "Trimestral", "Anual"])]).nullable().optional().transform(v => v || null),
  cuota:           z.number().positive("La cuota debe ser mayor que 0").nullable().optional(),
  observaciones:   optionalString,
});

// ─── Schema Usuario ───────────────────────────────────────────────────────────

const UsuarioSchema = z.object({
  nombre:                 z.string({ required_error: "nombre es obligatorio" }).min(1, "nombre no puede estar vacío"),
  apellidos:              z.string({ required_error: "apellidos es obligatorio" }).min(1, "apellidos no puede estar vacío"),
  dni:                    optionalDNI,
  fechaNacimiento:        z.coerce.date().nullable().optional(),
  direccion:              optionalString,
  poblacion:              optionalString,
  cp:                     optionalCP,
  provincia:              optionalString,
  telefono:               optionalTel,
  telefono2:              optionalTel,
  email:                  optionalEmail,
  diagnostico:            optionalString,
  porcentajeDiscapacidad: z.number().min(0, "Mínimo 0%").max(100, "Máximo 100%").nullable().optional(),
  grado:                  z.union([z.literal(""), z.enum(["Grado I", "Grado II", "Grado III"])]).nullable().optional().transform(v => v || null),
  centroAlQueAcude:       optionalString,
  socioVinculadoId:       z.number().int().positive().nullable().optional(),
  socioVinculado2Id:      z.number().int().positive().nullable().optional(),
  observaciones:          optionalString,
  baja:                   z.boolean().optional().default(false),
  fechaAlta:              z.coerce.date().nullable().optional(),
  fechaBaja:              z.coerce.date().nullable().optional(),
});

// ─── Schema Terapeuta ─────────────────────────────────────────────────────────

const TerapeutaSchema = z.object({
  nombre:      z.string({ required_error: "nombre es obligatorio" }).min(1),
  apellidos:   z.string({ required_error: "apellidos es obligatorio" }).min(1),
  especialidad: z.enum(
    ["Logopedia", "Psicología", "Fisioterapia", "Terapia Ocupacional"],
    { message: 'especialidad debe ser "Logopedia", "Psicología", "Fisioterapia" o "Terapia Ocupacional"' }
  ),
  email:    optionalEmail,
  telefono: optionalTel,
  activo:   z.boolean().optional().default(true),
});

// ─── Schema Sesion ────────────────────────────────────────────────────────────

const SesionSchema = z.object({
  usuarioId:   z.number({ required_error: "usuarioId es obligatorio" }).int().positive(),
  terapeutaId: z.number({ required_error: "terapeutaId es obligatorio" }).int().positive(),
  servicioId:  z.number({ required_error: "servicioId es obligatorio" }).int().positive(),
  fecha:       z.coerce.date({ required_error: "fecha es obligatoria" }),
  estado:      z.enum(
    ["programada", "asistio", "falta", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"],
    { message: "estado no válido" }
  ).optional().default("programada"),
  actividadRealizada: optionalString,
  motivacion:         optionalString,
  observaciones:      optionalString,
});

// ─── Middleware de validación ─────────────────────────────────────────────────

function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errores = result.error.issues.map(i => ({
        campo: i.path.join(".") || "campo",
        mensaje: i.message,
      }));
      return res.status(422).json({ error: "Datos no válidos", errores });
    }
    // Solo reemplaza las claves que vinieron en el body original (no añade nulls de Zod)
    const originalKeys = new Set(Object.keys(req[source]));
    const filtered = Object.fromEntries(
      Object.entries(result.data).filter(([k]) => originalKeys.has(k))
    );
    req[source] = filtered;
    next();
  };
}

module.exports = {
  SocioSchema,
  SocioCreateSchema,
  BancarioSchema,
  UsuarioSchema,
  TerapeutaSchema,
  SesionSchema,
  validate,
  validarIBAN,
  optionalIBAN,
};
