const router = require("express").Router();
const multer = require("multer");
const XLSX   = require("xlsx");
const prisma = require("../lib/prisma");
const { SocioCreateSchema, UsuarioSchema } = require("../lib/schemas");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Helpers de parseo de Excel ───────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string") {
    const parts = val.includes("/") ? val.split("/") : val.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

const str  = (v) => (v === undefined || v === null) ? null : String(v).trim() || null;
const num  = (v) => (v === undefined || v === null || v === "") ? null : (isNaN(Number(v)) ? null : Number(v));
const bool = (v) => !v ? false : ["si","sí","yes","true","1","x"].includes(String(v).toLowerCase().trim());

function normalizarSocio(row) {
  return {
    numSocio:       num(row["numSocio"]       ?? row["Num Socio"]        ?? row["num_socio"]),
    nombre:         str(row["nombre"]         ?? row["Nombre"]),
    apellidos:      str(row["apellidos"]      ?? row["Apellidos"]),
    dni:            str(row["dni"]            ?? row["DNI"]),
    direccion:      str(row["direccion"]      ?? row["Dirección"]        ?? row["Direccion"]),
    poblacion:      str(row["poblacion"]      ?? row["Población"]        ?? row["Poblacion"]),
    cp:             str(row["cp"]             ?? row["CP"]               ?? row["Código Postal"]),
    provincia:      str(row["provincia"]      ?? row["Provincia"]),
    telefono:       str(row["telefono"]       ?? row["Teléfono"]         ?? row["Telefono"]),
    telefono2:      str(row["telefono2"]      ?? row["Teléfono 2"]       ?? row["Telefono2"]),
    email:          str(row["email"]          ?? row["Email"]),
    tipologia:      str(row["tipologia"]      ?? row["Tipología"]        ?? row["Tipologia"]),
    notificaciones: str(row["notificaciones"] ?? row["Notificaciones"]),
    referencias:    str(row["referencias"]    ?? row["Referencias"]),
    observaciones:  str(row["observaciones"]  ?? row["Observaciones"]),
    empresa:        bool(row["empresa"]       ?? row["Empresa"]),
    baja:           bool(row["baja"]          ?? row["Baja"]),
    fechaAlta:      parseDate(row["fechaAlta"] ?? row["Fecha Alta"]      ?? row["fecha_alta"]),
    fechaBaja:      parseDate(row["fechaBaja"] ?? row["Fecha Baja"]      ?? row["fecha_baja"]),
    iban:           str(row["iban"]           ?? row["IBAN"]),
    cadencia:       str(row["cadencia"]       ?? row["Cadencia"]),
    cuota:          num(row["cuota"]          ?? row["Cuota"]),
  };
}

function normalizarUsuario(row) {
  return {
    nombre:                 str(row["nombre"]                  ?? row["Nombre"]),
    apellidos:              str(row["apellidos"]               ?? row["Apellidos"]),
    dni:                    str(row["dni"]                     ?? row["DNI"]),
    fechaNacimiento:        parseDate(row["fechaNacimiento"]   ?? row["Fecha Nacimiento"]   ?? row["fecha_nacimiento"]),
    direccion:              str(row["direccion"]               ?? row["Dirección"]          ?? row["Direccion"]),
    poblacion:              str(row["poblacion"]               ?? row["Población"]          ?? row["Poblacion"]),
    cp:                     str(row["cp"]                      ?? row["CP"]),
    provincia:              str(row["provincia"]               ?? row["Provincia"]),
    telefono:               str(row["telefono"]                ?? row["Teléfono"]           ?? row["Telefono"]),
    telefono2:              str(row["telefono2"]               ?? row["Teléfono 2"]),
    email:                  str(row["email"]                   ?? row["Email"]),
    diagnostico:            str(row["diagnostico"]             ?? row["Diagnóstico"]        ?? row["Diagnostico"]),
    porcentajeDiscapacidad: num(row["porcentajeDiscapacidad"]  ?? row["% Discapacidad"]     ?? row["Porcentaje Discapacidad"]),
    grado:                  str(row["grado"]                   ?? row["Grado"]),
    centroAlQueAcude:       str(row["centroAlQueAcude"]        ?? row["Centro"]             ?? row["Centro al que acude"]),
    observaciones:          str(row["observaciones"]           ?? row["Observaciones"]),
    baja:                   bool(row["baja"]                   ?? row["Baja"]),
    fechaAlta:              parseDate(row["fechaAlta"]         ?? row["Fecha Alta"]),
    fechaBaja:              parseDate(row["fechaBaja"]         ?? row["Fecha Baja"]),
    numSocio:               num(row["numSocio"]                ?? row["Num Socio"]          ?? row["socioVinculadoId"]),
    numSocio2:              num(row["numSocio2"]               ?? row["Num Socio 2"]        ?? row["socioVinculado2Id"]),
  };
}

// Schema de importación de socios extiende el base añadiendo campos bancarios
const { z } = require("zod");
const { optionalIBAN } = require("../lib/schemas");

const SocioImportSchema = SocioCreateSchema.extend({
  iban:     optionalIBAN,
  cadencia: z.enum(["Mensual", "Trimestral", "Anual"]).nullable().optional().transform(v => v || null),
  cuota:    z.number().positive("La cuota debe ser mayor que 0").nullable().optional(),
});

// Schema de importación de usuarios añade numSocio/numSocio2 como referencias externas
const UsuarioImportSchema = UsuarioSchema.extend({
  numSocio:  z.number().int().positive().nullable().optional(),
  numSocio2: z.number().int().positive().nullable().optional(),
});

function formatZodErrors(issues) {
  return issues.map(i => `${i.path.join(".") || "campo"}: ${i.message}`).join("; ");
}

// ─── POST /api/importar/socios ────────────────────────────────────────────────
router.post("/socios", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const wb   = XLSX.read(req.file.buffer, { type: "buffer", cellDates: false });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) return res.status(400).json({ error: "El archivo está vacío" });

    const resultados = { creados: 0, actualizados: 0, errores: [] };

    for (let i = 0; i < rows.length; i++) {
      const fila   = i + 2;
      const parsed = SocioImportSchema.safeParse(normalizarSocio(rows[i]));

      if (!parsed.success) {
        resultados.errores.push({ fila, error: formatZodErrors(parsed.error.issues) });
        continue;
      }

      const { iban, cadencia, cuota, ...socioData } = parsed.data;

      try {
        const existing = await prisma.socio.findUnique({ where: { numSocio: socioData.numSocio } });
        if (existing) {
          await prisma.socio.update({ where: { numSocio: socioData.numSocio }, data: socioData });
          if (iban) {
            const banc = await prisma.socioBancario.findFirst({ where: { socioId: existing.id } });
            if (banc) await prisma.socioBancario.update({ where: { id: banc.id }, data: { iban, cadencia, cuota } });
            else      await prisma.socioBancario.create({ data: { socioId: existing.id, iban, cadencia, cuota } });
          }
          resultados.actualizados++;
        } else {
          const socio = await prisma.socio.create({ data: socioData });
          if (iban) await prisma.socioBancario.create({ data: { socioId: socio.id, iban, cadencia, cuota } });
          resultados.creados++;
        }
      } catch (e) {
        resultados.errores.push({ fila, error: e.message });
      }
    }

    res.json(resultados);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/importar/usuarios ──────────────────────────────────────────────
router.post("/usuarios", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });

    const wb   = XLSX.read(req.file.buffer, { type: "buffer", cellDates: false });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) return res.status(400).json({ error: "El archivo está vacío" });

    const todosLosSocios = await prisma.socio.findMany({ select: { id: true, numSocio: true } });
    const socioByNum     = Object.fromEntries(todosLosSocios.map(s => [s.numSocio, s.id]));

    const resultados = { creados: 0, actualizados: 0, errores: [] };

    for (let i = 0; i < rows.length; i++) {
      const fila   = i + 2;
      const parsed = UsuarioImportSchema.safeParse(normalizarUsuario(rows[i]));

      if (!parsed.success) {
        resultados.errores.push({ fila, error: formatZodErrors(parsed.error.issues) });
        continue;
      }

      const { numSocio, numSocio2, ...usuarioData } = parsed.data;

      if (numSocio) {
        const sid = socioByNum[numSocio];
        if (!sid) { resultados.errores.push({ fila, error: `Socio con numSocio ${numSocio} no encontrado` }); continue; }
        usuarioData.socioVinculadoId = sid;
      }
      if (numSocio2) {
        const sid2 = socioByNum[numSocio2];
        if (!sid2) { resultados.errores.push({ fila, error: `Socio 2 con numSocio ${numSocio2} no encontrado` }); continue; }
        usuarioData.socioVinculado2Id = sid2;
      }

      try {
        const existing = usuarioData.dni
          ? await prisma.usuario.findFirst({ where: { dni: usuarioData.dni } })
          : null;

        if (existing) {
          await prisma.usuario.update({ where: { id: existing.id }, data: usuarioData });
          resultados.actualizados++;
        } else {
          await prisma.usuario.create({ data: usuarioData });
          resultados.creados++;
        }
      } catch (e) {
        resultados.errores.push({ fila, error: e.message });
      }
    }

    res.json(resultados);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/importar/plantilla/socios ───────────────────────────────────────
router.get("/plantilla/socios", (_req, res) => {
  const wb = XLSX.utils.book_new();
  const datos = [
    {
      numSocio: 1, nombre: "Carlos", apellidos: "Pérez Álvarez", dni: "12345678A",
      direccion: "C/ Mayor 5", poblacion: "Oviedo", cp: "33001", provincia: "Asturias",
      telefono: "985111222", telefono2: "", email: "carlos@email.com",
      tipologia: "Afectado", notificaciones: "Email", empresa: "No",
      baja: "No", fechaAlta: "10/03/2015", fechaBaja: "", referencias: "", observaciones: "",
      iban: "ES9121000418450200051332", cadencia: "Mensual", cuota: 50,
    },
    {
      numSocio: 2, nombre: "Isabel", apellidos: "González Suárez", dni: "23456789B",
      direccion: "Av. Constitución 12", poblacion: "Gijón", cp: "33201", provincia: "Asturias",
      telefono: "985222333", telefono2: "", email: "isabel@email.com",
      tipologia: "Colaborador", notificaciones: "Correo Postal", empresa: "No",
      baja: "No", fechaAlta: "15/06/2016", fechaBaja: "", referencias: "", observaciones: "",
      iban: "", cadencia: "", cuota: "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(datos);
  ws["!cols"] = Object.keys(datos[0]).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Socios");

  const instrucciones = [
    { Campo: "numSocio",       Obligatorio: "SÍ", Descripción: "Número único de socio (entero positivo)" },
    { Campo: "nombre",         Obligatorio: "SÍ", Descripción: "Nombre del socio" },
    { Campo: "apellidos",      Obligatorio: "SÍ", Descripción: "Apellidos del socio" },
    { Campo: "dni",            Obligatorio: "No", Descripción: "DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra)" },
    { Campo: "direccion",      Obligatorio: "No", Descripción: "Dirección postal" },
    { Campo: "poblacion",      Obligatorio: "No", Descripción: "Población" },
    { Campo: "cp",             Obligatorio: "No", Descripción: "Código postal (exactamente 5 dígitos)" },
    { Campo: "provincia",      Obligatorio: "No", Descripción: "Provincia" },
    { Campo: "telefono",       Obligatorio: "No", Descripción: "Teléfono (7-15 dígitos)" },
    { Campo: "telefono2",      Obligatorio: "No", Descripción: "Teléfono secundario" },
    { Campo: "email",          Obligatorio: "No", Descripción: "Correo electrónico válido" },
    { Campo: "tipologia",      Obligatorio: "No", Descripción: "Afectado | Colaborador" },
    { Campo: "notificaciones", Obligatorio: "No", Descripción: "Email | Correo Postal" },
    { Campo: "empresa",        Obligatorio: "No", Descripción: "Si | No" },
    { Campo: "baja",           Obligatorio: "No", Descripción: "Si | No (por defecto No)" },
    { Campo: "fechaAlta",      Obligatorio: "No", Descripción: "Formato DD/MM/YYYY" },
    { Campo: "fechaBaja",      Obligatorio: "No", Descripción: "Formato DD/MM/YYYY" },
    { Campo: "referencias",    Obligatorio: "No", Descripción: "Referencias" },
    { Campo: "observaciones",  Obligatorio: "No", Descripción: "Observaciones" },
    { Campo: "iban",           Obligatorio: "No", Descripción: "IBAN sin espacios — se valida con módulo 97" },
    { Campo: "cadencia",       Obligatorio: "No", Descripción: "Mensual | Trimestral | Anual" },
    { Campo: "cuota",          Obligatorio: "No", Descripción: "Importe de la cuota (número positivo)" },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instrucciones);
  wsInstr["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", "attachment; filename=plantilla_socios.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

// ─── GET /api/importar/plantilla/usuarios ─────────────────────────────────────
router.get("/plantilla/usuarios", (_req, res) => {
  const wb = XLSX.utils.book_new();
  const datos = [
    {
      nombre: "Pablo", apellidos: "Pérez González", dni: "11111111A",
      fechaNacimiento: "12/04/2005", direccion: "C/ Mayor 5", poblacion: "Oviedo",
      cp: "33001", provincia: "Asturias", telefono: "985100001", telefono2: "",
      email: "pablo@email.com", diagnostico: "Parálisis cerebral espástica",
      porcentajeDiscapacidad: 65, grado: "Grado II", centroAlQueAcude: "Centro Nora Oviedo",
      numSocio: 1, numSocio2: "", baja: "No", fechaAlta: "10/03/2015", fechaBaja: "", observaciones: "",
    },
    {
      nombre: "Sara", apellidos: "González Martínez", dni: "22222222B",
      fechaNacimiento: "23/07/2008", direccion: "Av. Constitución 12", poblacion: "Gijón",
      cp: "33201", provincia: "Asturias", telefono: "985100002", telefono2: "",
      email: "sara@email.com", diagnostico: "Síndrome de Down",
      porcentajeDiscapacidad: 55, grado: "Grado II", centroAlQueAcude: "Centro Nora Gijón",
      numSocio: 2, numSocio2: "", baja: "No", fechaAlta: "15/06/2016", fechaBaja: "", observaciones: "",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(datos);
  ws["!cols"] = Object.keys(datos[0]).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

  const instrucciones = [
    { Campo: "nombre",                 Obligatorio: "SÍ", Descripción: "Nombre del usuario" },
    { Campo: "apellidos",              Obligatorio: "SÍ", Descripción: "Apellidos del usuario" },
    { Campo: "dni",                    Obligatorio: "No", Descripción: "DNI (se usa para detectar duplicados)" },
    { Campo: "fechaNacimiento",        Obligatorio: "No", Descripción: "Formato DD/MM/YYYY" },
    { Campo: "direccion",              Obligatorio: "No", Descripción: "Dirección postal" },
    { Campo: "poblacion",              Obligatorio: "No", Descripción: "Población" },
    { Campo: "cp",                     Obligatorio: "No", Descripción: "Código postal (exactamente 5 dígitos)" },
    { Campo: "provincia",              Obligatorio: "No", Descripción: "Provincia" },
    { Campo: "telefono",               Obligatorio: "No", Descripción: "Teléfono (7-15 dígitos)" },
    { Campo: "telefono2",              Obligatorio: "No", Descripción: "Teléfono secundario" },
    { Campo: "email",                  Obligatorio: "No", Descripción: "Correo electrónico válido" },
    { Campo: "diagnostico",            Obligatorio: "No", Descripción: "Diagnóstico médico" },
    { Campo: "porcentajeDiscapacidad", Obligatorio: "No", Descripción: "Número entre 0 y 100" },
    { Campo: "grado",                  Obligatorio: "No", Descripción: "Grado I | Grado II | Grado III" },
    { Campo: "centroAlQueAcude",       Obligatorio: "No", Descripción: "Nombre del centro" },
    { Campo: "numSocio",               Obligatorio: "No", Descripción: "numSocio del socio vinculado principal" },
    { Campo: "numSocio2",              Obligatorio: "No", Descripción: "numSocio del segundo socio vinculado" },
    { Campo: "baja",                   Obligatorio: "No", Descripción: "Si | No (por defecto No)" },
    { Campo: "fechaAlta",              Obligatorio: "No", Descripción: "Formato DD/MM/YYYY" },
    { Campo: "fechaBaja",              Obligatorio: "No", Descripción: "Formato DD/MM/YYYY" },
    { Campo: "observaciones",          Obligatorio: "No", Descripción: "Observaciones" },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instrucciones);
  wsInstr["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", "attachment; filename=plantilla_usuarios.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

module.exports = router;
