const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando base de datos...");

  // ── Usuario admin del sistema ────────────────────────────────────────────────
  const hash = await bcrypt.hash("nora2026", 10);
  await prisma.userSistema.upsert({
    where:  { username: "admin" },
    update: {},
    create: { username: "admin", password: hash, nombre: "Administrador" },
  });
  console.log("✅ Usuario admin creado (admin / nora2026)");

  // ── Terapeutas ──────────────────────────────────────────────────────────────
  const terapeutasData = [
    { nombre: "María",  apellidos: "García López",   especialidad: "Logopedia" },
    { nombre: "Laura",  apellidos: "Martínez Pérez", especialidad: "Psicología" },
    { nombre: "Carmen", apellidos: "Rodríguez Díaz", especialidad: "Terapia Ocupacional" },
    { nombre: "Ana",    apellidos: "Fernández Ruiz", especialidad: "Fisioterapia" },
  ];

  const terapeutas = [];
  for (const t of terapeutasData) {
    const ter = await prisma.terapeuta.upsert({
      where: { id: terapeutasData.indexOf(t) + 1 },
      update: t,
      create: t,
    });
    terapeutas.push(ter);
  }
  console.log(`✅ ${terapeutas.length} terapeutas`);

  // ── Servicios ───────────────────────────────────────────────────────────────
  const serviciosData = [
    { nombre: "Logopedia",              categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Psicología",             categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Fisioterapia",           categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Terapia Ocupacional",    categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Aula TIC",               categoria: "Aula Terapéutica",       precio: 18 },
    { nombre: "Psicomotricidad",        categoria: "Aula Terapéutica",       precio: 12 },
    { nombre: "Atención Integral Adultos", categoria: "Atención Integral",   precio: 30 },
    { nombre: "Cocina",                 categoria: "Taller",                 precio: 6  },
    { nombre: "Peluquería",             categoria: "Taller",                 precio: 6  },
    { nombre: "Gimnasia",               categoria: "Taller",                 precio: 11 },
    { nombre: "Escuela de Padres",      categoria: "Escuela de Padres",      precio: 12 },
    { nombre: "Hipoterapia - Equitación Positiva",                    categoria: "Hipoterapia", precio: 0 },
    { nombre: "Hipoterapia - Asoc. Asturiana de Terapias Ecuestres",  categoria: "Hipoterapia", precio: 0 },
  ];

  const servicios = [];
  for (const s of serviciosData) {
    const srv = await prisma.servicio.upsert({
      where: { id: serviciosData.indexOf(s) + 1 },
      update: s,
      create: s,
    });
    servicios.push(srv);
  }
  console.log(`✅ ${servicios.length} servicios`);

  // ── Socios ──────────────────────────────────────────────────────────────────
  const sociosData = [
    { numSocio: 1, nombre: "Carlos",    apellidos: "Pérez Álvarez",    dni: "12345678A", telefono: "985111222", email: "carlos.perez@email.com",    tipologia: "Afectado",    poblacion: "Oviedo",   provincia: "Asturias", fechaAlta: new Date("2015-03-10") },
    { numSocio: 2, nombre: "Isabel",    apellidos: "González Suárez",  dni: "23456789B", telefono: "985222333", email: "isabel.gonzalez@email.com",  tipologia: "Afectado",    poblacion: "Gijón",    provincia: "Asturias", fechaAlta: new Date("2016-06-15") },
    { numSocio: 3, nombre: "Roberto",   apellidos: "Martínez Díaz",    dni: "34567890C", telefono: "985333444", email: "roberto.martinez@email.com", tipologia: "Colaborador", poblacion: "Avilés",   provincia: "Asturias", fechaAlta: new Date("2018-01-20") },
    { numSocio: 4, nombre: "Lucía",     apellidos: "Fernández López",  dni: "45678901D", telefono: "985444555", email: "lucia.fernandez@email.com",  tipologia: "Afectado",    poblacion: "Oviedo",   provincia: "Asturias", fechaAlta: new Date("2019-09-05") },
    { numSocio: 5, nombre: "Antonio",   apellidos: "Rodríguez García", dni: "56789012E", telefono: "985555666", email: "antonio.rodriguez@email.com",tipologia: "Afectado",    poblacion: "Mieres",   provincia: "Asturias", fechaAlta: new Date("2020-02-14") },
    { numSocio: 6, nombre: "Beatriz",   apellidos: "Sánchez Vega",     dni: "67890123F", telefono: "985666777", email: "beatriz.sanchez@email.com",  tipologia: "Afectado",    poblacion: "Oviedo",   provincia: "Asturias", fechaAlta: new Date("2023-05-20") },
  ];

  const socios = [];
  for (const s of sociosData) {
    const socio = await prisma.socio.upsert({
      where: { numSocio: s.numSocio },
      update: s,
      create: s,
    });
    socios.push(socio);
  }
  console.log(`✅ ${socios.length} socios`);

  // ── Usuarios ────────────────────────────────────────────────────────────────
  const usuariosData = [
    {
      nombre: "Pablo",      apellidos: "Pérez González",
      dni: "11111111A",     fechaNacimiento: new Date("2005-04-12"),
      direccion: "C/ Mayor 5", poblacion: "Oviedo", cp: "33001", provincia: "Asturias",
      telefono: "985100001", email: "pablo.perez@email.com",
      diagnostico: "Parálisis cerebral espástica", porcentajeDiscapacidad: 65, grado: "Grado II",
      centroAlQueAcude: "Centro Nora Oviedo",
      socioVinculadoId: socios[0].id,
      fechaAlta: new Date("2015-03-10"),
    },
    {
      nombre: "Sara",       apellidos: "González Martínez",
      dni: "22222222B",     fechaNacimiento: new Date("2008-07-23"),
      direccion: "Av. Constitución 12", poblacion: "Gijón", cp: "33201", provincia: "Asturias",
      telefono: "985100002", email: "sara.gonzalez@email.com",
      diagnostico: "Síndrome de Down", porcentajeDiscapacidad: 55, grado: "Grado II",
      centroAlQueAcude: "Centro Nora Gijón",
      socioVinculadoId: socios[1].id,
      fechaAlta: new Date("2016-06-15"),
    },
    {
      nombre: "Miguel",     apellidos: "Martínez Rodríguez",
      dni: "33333333C",     fechaNacimiento: new Date("2003-11-08"),
      direccion: "C/ Cervantes 8", poblacion: "Avilés", cp: "33400", provincia: "Asturias",
      telefono: "985100003",
      diagnostico: "Trastorno del espectro autista", porcentajeDiscapacidad: 45, grado: "Grado I",
      centroAlQueAcude: "Centro Nora Avilés",
      socioVinculadoId: socios[2].id,
      fechaAlta: new Date("2018-01-20"),
    },
    {
      nombre: "Elena",      apellidos: "Fernández Suárez",
      dni: "44444444D",     fechaNacimiento: new Date("2010-02-14"),
      direccion: "C/ Uría 22", poblacion: "Oviedo", cp: "33003", provincia: "Asturias",
      telefono: "985100004", email: "elena.fernandez@email.com",
      diagnostico: "Discapacidad intelectual moderada", porcentajeDiscapacidad: 50, grado: "Grado II",
      centroAlQueAcude: "Centro Nora Oviedo",
      socioVinculadoId: socios[3].id,
      fechaAlta: new Date("2019-09-05"),
    },
    {
      nombre: "Javier",     apellidos: "Rodríguez López",
      dni: "55555555E",     fechaNacimiento: new Date("2001-08-30"),
      direccion: "C/ San Francisco 3", poblacion: "Mieres", cp: "33600", provincia: "Asturias",
      telefono: "985100005",
      diagnostico: "Parálisis cerebral discinética", porcentajeDiscapacidad: 70, grado: "Grado III",
      centroAlQueAcude: "Centro Nora Mieres",
      socioVinculadoId: socios[4].id,
      fechaAlta: new Date("2020-02-14"),
    },
    {
      nombre: "Lucía",      apellidos: "Álvarez García",
      dni: "66666666F",     fechaNacimiento: new Date("2007-05-19"),
      direccion: "Av. Galicia 7", poblacion: "Oviedo", cp: "33005", provincia: "Asturias",
      telefono: "985100006", email: "lucia.alvarez@email.com",
      diagnostico: "Síndrome de Down", porcentajeDiscapacidad: 60, grado: "Grado II",
      centroAlQueAcude: "Centro Nora Oviedo",
      socioVinculadoId: socios[3].id, // hermana de Elena (mismo socio)
      fechaAlta: new Date("2019-09-05"),
    },
    {
      nombre: "Andrés",     apellidos: "López Pérez",
      dni: "77777777G",     fechaNacimiento: new Date("1998-12-03"),
      direccion: "C/ Jovellanos 15", poblacion: "Gijón", cp: "33202", provincia: "Asturias",
      telefono: "985100007",
      diagnostico: "Lesión medular", porcentajeDiscapacidad: 75, grado: "Grado III",
      centroAlQueAcude: "Centro Nora Gijón",
      socioVinculadoId: socios[1].id,
      fechaAlta: new Date("2021-04-01"),
    },
    {
      nombre: "Carmen",     apellidos: "Suárez Díaz",
      dni: "88888888H",     fechaNacimiento: new Date("2012-09-25"),
      direccion: "C/ Pelayo 9", poblacion: "Oviedo", cp: "33002", provincia: "Asturias",
      telefono: "985100008", email: "carmen.suarez@email.com",
      diagnostico: "Retraso madurativo", porcentajeDiscapacidad: 35, grado: "Grado I",
      centroAlQueAcude: "Centro Nora Oviedo",
      socioVinculadoId: socios[0].id,
      fechaAlta: new Date("2022-01-10"),
    },
    {
      nombre: "David",      apellidos: "Sánchez Moreno",
      dni: "99999999I",     fechaNacimiento: new Date("2015-03-18"),
      direccion: "C/ Independencia 45", poblacion: "Oviedo", cp: "33004", provincia: "Asturias",
      telefono: "985100009", email: "david.sanchez@email.com",
      diagnostico: "Trastorno del lenguaje", porcentajeDiscapacidad: 25, grado: "Grado I",
      centroAlQueAcude: "Centro Nora Oviedo",
      socioVinculadoId: socios[5].id, // Socio Beatriz (NUEVO - sin hermanos)
      fechaAlta: new Date("2023-05-20"),
    },
  ];

  const usuarios = [];
  for (const u of usuariosData) {
    // Evitar duplicados por DNI
    const existing = await prisma.usuario.findFirst({ where: { dni: u.dni } });
    let usuario;
    if (existing) {
      usuario = await prisma.usuario.update({ where: { id: existing.id }, data: u });
    } else {
      usuario = await prisma.usuario.create({ data: u });
    }
    usuarios.push(usuario);
  }
  console.log(`✅ ${usuarios.length} usuarios`);

  // ── Sesiones de Abril 2026 ──────────────────────────────────────────────────
  // Días laborables de abril 2026 (lunes a viernes)
  const diasLaborables = [];
  for (let d = 1; d <= 30; d++) {
    const dia = new Date(2026, 3, d);
    const dow = dia.getDay();
    if (dow !== 0 && dow !== 6) diasLaborables.push(d);
  }

  // Asignaciones: qué usuarios van con qué terapeuta y qué servicio
  // [terapeutaIdx, usuarioIdx, servicioIdx]
  const asignaciones = [
    // Logopedia (María García) - servicio Logopedia (idx 0)
    [0, 0, 0], // Pablo → Logopedia
    [0, 2, 0], // Miguel → Logopedia
    [0, 3, 0], // Elena → Logopedia
    [0, 7, 0], // Carmen → Logopedia
    [0, 8, 0], // David → Logopedia (NUEVO - pocas sesiones, sin descuento)

    // Psicología (Laura Martínez) - servicio Psicología (idx 1)
    [1, 1, 1], // Sara → Psicología
    [1, 4, 1], // Javier → Psicología
    [1, 5, 1], // Lucía → Psicología

    // Terapia Ocupacional (Carmen Rodríguez) - servicio T.O. (idx 3)
    [2, 0, 3], // Pablo → T.O.
    [2, 1, 3], // Sara → T.O.
    [2, 6, 3], // Andrés → T.O.

    // Fisioterapia (Ana Fernández) - servicio Fisioterapia (idx 2)
    [3, 4, 2], // Javier → Fisioterapia
    [3, 6, 2], // Andrés → Fisioterapia
    [3, 2, 2], // Miguel → Fisioterapia
  ];

  // Estados posibles con sus pesos (para variedad realista)
  const estadosPosibles = [
    { estado: "asistio",              peso: 70 },
    { estado: "falta",                peso: 12 },
    { estado: "festivo",              peso: 5  },
    { estado: "vacaciones_terapeuta", peso: 3  },
    { estado: "permiso",              peso: 5  },
    { estado: "hospitalizacion",      peso: 5  },
  ];

  function randomEstado() {
    const total = estadosPosibles.reduce((a, e) => a + e.peso, 0);
    let r = Math.random() * total;
    for (const e of estadosPosibles) {
      r -= e.peso;
      if (r <= 0) return e.estado;
    }
    return "asistio";
  }

  const noCobrables = ["festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"];

  // Cada asignación tiene sesiones 2 veces por semana (días alternos)
  let sesionesCreadas = 0;
  for (const [tIdx, uIdx, sIdx] of asignaciones) {
    let diasSesion = diasLaborables.filter((_, i) => i % 2 === (tIdx % 2)); // alternados
    
    // David (uIdx 8) solo tiene 5 sesiones para que no supere 120€ (5 x 12€ = 60€)
    if (uIdx === 8) {
      diasSesion = diasSesion.slice(0, 5);
    }
    
    for (const dia of diasSesion) {
      const fecha = new Date(Date.UTC(2026, 3, dia));
      const estado = randomEstado();
      const cobrable = !noCobrables.includes(estado);

      // Evitar duplicados
      const existe = await prisma.sesion.findFirst({
        where: {
          usuarioId:   usuarios[uIdx].id,
          terapeutaId: terapeutas[tIdx].id,
          fecha,
        },
      });
      if (existe) continue;

      await prisma.sesion.create({
        data: {
          usuarioId:   usuarios[uIdx].id,
          terapeutaId: terapeutas[tIdx].id,
          servicioId:  servicios[sIdx].id,
          fecha,
          estado,
          cobrable,
          actividadRealizada: estado === "asistio" ? actividadAleatoria(sIdx) : null,
        },
      });
      sesionesCreadas++;
    }
  }
  console.log(`✅ ${sesionesCreadas} sesiones en Abril 2026`);

  // ── Sesiones de Marzo 2026 (mes anterior para poder generar facturas) ───────
  const diasLaborablesMarzo = [];
  for (let d = 1; d <= 31; d++) {
    const dia = new Date(2026, 2, d);
    const dow = dia.getDay();
    if (dow !== 0 && dow !== 6) diasLaborablesMarzo.push(d);
  }

  let sesionesMarzo = 0;
  for (const [tIdx, uIdx, sIdx] of asignaciones) {
    const diasSesion = diasLaborablesMarzo.filter((_, i) => i % 2 === (tIdx % 2));
    for (const dia of diasSesion) {
      const fecha = new Date(Date.UTC(2026, 2, dia));
      const estado = Math.random() > 0.15 ? "asistio" : "falta";
      const cobrable = true;

      const existe = await prisma.sesion.findFirst({
        where: { usuarioId: usuarios[uIdx].id, terapeutaId: terapeutas[tIdx].id, fecha },
      });
      if (existe) continue;

      await prisma.sesion.create({
        data: {
          usuarioId:   usuarios[uIdx].id,
          terapeutaId: terapeutas[tIdx].id,
          servicioId:  servicios[sIdx].id,
          fecha,
          estado,
          cobrable,
          actividadRealizada: actividadAleatoria(sIdx),
        },
      });
      sesionesMarzo++;
    }
  }
  console.log(`✅ ${sesionesMarzo} sesiones en Marzo 2026`);

  console.log("\n🎉 Base de datos lista con datos de ejemplo.");
  console.log("   → Ve a Sesiones para ver el grid con datos reales.");
  console.log("   → Ve a Facturación y genera facturas de Marzo 2026.");
}

function actividadAleatoria(servicioIdx) {
  const actividades = {
    0: ["Ejercicios de fonación", "Trabajo de articulación", "Lectura comprensiva", "Ejercicios de deglución"],
    1: ["Terapia cognitivo-conductual", "Trabajo de habilidades sociales", "Gestión emocional", "Relajación y mindfulness"],
    2: ["Ejercicios de movilidad", "Estiramientos", "Hidroterapia", "Fortalecimiento muscular"],
    3: ["Actividades de vida diaria", "Coordinación motora fina", "Terapia ocupacional grupal", "Estimulación sensorial"],
  };
  const lista = actividades[servicioIdx] || ["Sesión terapéutica"];
  return lista[Math.floor(Math.random() * lista.length)];
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
