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
    create: { username: "admin", password: hash, nombre: "Administrador", rol: "admin" },
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

  // ── Usuarios del sistema para terapeutas ────────────────────────────────────
  const credencialesTerapeutas = [
    { username: "maria",  nombre: "María García",   password: "maria2026"  },
    { username: "laura",  nombre: "Laura Martínez", password: "laura2026"  },
    { username: "carmen", nombre: "Carmen Rodríguez",password: "carmen2026"},
    { username: "ana",    nombre: "Ana Fernández",  password: "ana2026"    },
  ];
  for (let i = 0; i < terapeutas.length; i++) {
    const cred = credencialesTerapeutas[i];
    const hashT = await bcrypt.hash(cred.password, 10);
    await prisma.userSistema.upsert({
      where:  { username: cred.username },
      update: {},
      create: { username: cred.username, password: hashT, nombre: cred.nombre, rol: "terapeuta", terapeutaId: terapeutas[i].id },
    });
  }
  console.log("✅ Usuarios terapeutas creados (maria/maria2026, laura/laura2026, carmen/carmen2026, ana/ana2026)");

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

  // ── Socios adicionales para pruebas de paginación ────────────────────────────
  const sociosExtra = [
    { numSocio: 7,  nombre: "Fernando", apellidos: "Castro Vidal",     dni: "71234567A", telefono: "985777888", email: "fernando.castro@email.com",  tipologia: "Afectado",    poblacion: "Oviedo",  provincia: "Asturias", fechaAlta: new Date("2017-03-12") },
    { numSocio: 8,  nombre: "Marta",    apellidos: "Iglesias Blanco",   dni: "82345678B", telefono: "985888999", email: "marta.iglesias@email.com",   tipologia: "Colaborador", poblacion: "Gijón",   provincia: "Asturias", fechaAlta: new Date("2018-07-20") },
    { numSocio: 9,  nombre: "Jorge",    apellidos: "Cano Herrera",      dni: "93456789C", telefono: "985999000", email: "jorge.cano@email.com",       tipologia: "Afectado",    poblacion: "Avilés",  provincia: "Asturias", fechaAlta: new Date("2019-11-05") },
    { numSocio: 10, nombre: "Pilar",    apellidos: "Mora Santana",      dni: "04567890D", telefono: "985100111", email: "pilar.mora@email.com",       tipologia: "Afectado",    poblacion: "Mieres",  provincia: "Asturias", fechaAlta: new Date("2020-04-18") },
    { numSocio: 11, nombre: "Raúl",     apellidos: "Peña Domínguez",    dni: "15678901E", telefono: "985111222", email: "raul.pena@email.com",        tipologia: "Colaborador", poblacion: "Oviedo",  provincia: "Asturias", fechaAlta: new Date("2021-08-30") },
    { numSocio: 12, nombre: "Cristina", apellidos: "Vázquez Romero",    dni: "26789012F", telefono: "985222333", email: "cristina.vazquez@email.com", tipologia: "Afectado",    poblacion: "Gijón",   provincia: "Asturias", fechaAlta: new Date("2022-02-14") },
    { numSocio: 13, nombre: "Emilio",   apellidos: "Lara Medina",       dni: "37890123G", telefono: "985333444", email: "emilio.lara@email.com",      tipologia: "Afectado",    poblacion: "Oviedo",  provincia: "Asturias", fechaAlta: new Date("2022-09-01") },
    { numSocio: 14, nombre: "Natalia",  apellidos: "Fuentes Aguilar",   dni: "48901234H", telefono: "985444555", email: "natalia.fuentes@email.com",  tipologia: "Colaborador", poblacion: "Avilés",  provincia: "Asturias", fechaAlta: new Date("2023-01-15") },
    { numSocio: 15, nombre: "Víctor",   apellidos: "Ríos Gallardo",     dni: "59012345I", telefono: "985555666", email: "victor.rios@email.com",      tipologia: "Afectado",    poblacion: "Mieres",  provincia: "Asturias", fechaAlta: new Date("2023-06-20") },
    { numSocio: 16, nombre: "Amparo",   apellidos: "Nieto Carrasco",    dni: "60123456J", telefono: "985666777", email: "amparo.nieto@email.com",     tipologia: "Afectado",    poblacion: "Oviedo",  provincia: "Asturias", fechaAlta: new Date("2024-03-10") },
  ];

  for (const s of sociosExtra) {
    await prisma.socio.upsert({
      where:  { numSocio: s.numSocio },
      update: s,
      create: s,
    });
  }
  console.log(`✅ ${sociosExtra.length} socios adicionales`);

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

  // ── Usuarios adicionales para pruebas de paginación ──────────────────────────
  const usuariosExtra = [
    { nombre: "Sofía",    apellidos: "Blanco Iglesias",   dni: "10101010A", fechaNacimiento: new Date("2009-03-15"), diagnostico: "Parálisis cerebral espástica",      porcentajeDiscapacidad: 58, grado: "Grado II",  poblacion: "Oviedo",  socioIdx: 0 },
    { nombre: "Marcos",   apellidos: "Vega Castillo",     dni: "20202020B", fechaNacimiento: new Date("2004-07-22"), diagnostico: "Síndrome de Down",                  porcentajeDiscapacidad: 52, grado: "Grado II",  poblacion: "Gijón",   socioIdx: 1 },
    { nombre: "Noa",      apellidos: "Prieto Méndez",     dni: "30303030C", fechaNacimiento: new Date("2011-11-30"), diagnostico: "Trastorno del espectro autista",    porcentajeDiscapacidad: 40, grado: "Grado I",   poblacion: "Avilés",  socioIdx: 2 },
    { nombre: "Hugo",     apellidos: "Cuesta Morales",    dni: "40404040D", fechaNacimiento: new Date("2006-05-08"), diagnostico: "Discapacidad intelectual leve",     porcentajeDiscapacidad: 35, grado: "Grado I",   poblacion: "Oviedo",  socioIdx: 3 },
    { nombre: "Valentina",apellidos: "Ramos Herrero",     dni: "50505050E", fechaNacimiento: new Date("2013-09-19"), diagnostico: "Retraso madurativo",                porcentajeDiscapacidad: 30, grado: "Grado I",   poblacion: "Mieres",  socioIdx: 4 },
    { nombre: "Mateo",    apellidos: "Serrano Fuentes",   dni: "60606060F", fechaNacimiento: new Date("2000-02-14"), diagnostico: "Lesión medular cervical",           porcentajeDiscapacidad: 80, grado: "Grado III", poblacion: "Oviedo",  socioIdx: 5 },
    { nombre: "Daniela",  apellidos: "Ortega Navarro",    dni: "70707070G", fechaNacimiento: new Date("2007-12-03"), diagnostico: "Parálisis cerebral discinética",   porcentajeDiscapacidad: 65, grado: "Grado II",  poblacion: "Gijón",   socioIdx: 0 },
    { nombre: "Adrián",   apellidos: "Molina Pascual",    dni: "80808080H", fechaNacimiento: new Date("2003-06-27"), diagnostico: "Síndrome de Down",                  porcentajeDiscapacidad: 55, grado: "Grado II",  poblacion: "Oviedo",  socioIdx: 1 },
    { nombre: "Irene",    apellidos: "Rubio Campos",      dni: "90909090I", fechaNacimiento: new Date("2010-04-11"), diagnostico: "Trastorno del lenguaje",            porcentajeDiscapacidad: 28, grado: "Grado I",   poblacion: "Avilés",  socioIdx: 2 },
    { nombre: "Álvaro",   apellidos: "Jiménez Torres",    dni: "11223344J", fechaNacimiento: new Date("1999-08-05"), diagnostico: "Discapacidad intelectual moderada", porcentajeDiscapacidad: 48, grado: "Grado II",  poblacion: "Mieres",  socioIdx: 3 },
    { nombre: "Claudia",  apellidos: "Reyes Montero",     dni: "22334455K", fechaNacimiento: new Date("2008-01-20"), diagnostico: "Parálisis cerebral espástica",      porcentajeDiscapacidad: 62, grado: "Grado II",  poblacion: "Oviedo",  socioIdx: 4 },
    { nombre: "Samuel",   apellidos: "Guerrero Lozano",   dni: "33445566L", fechaNacimiento: new Date("2005-10-16"), diagnostico: "Trastorno del espectro autista",    porcentajeDiscapacidad: 44, grado: "Grado I",   poblacion: "Gijón",   socioIdx: 5 },
    { nombre: "Paula",    apellidos: "Delgado Vargas",    dni: "44556677M", fechaNacimiento: new Date("2012-07-09"), diagnostico: "Síndrome de Down",                  porcentajeDiscapacidad: 57, grado: "Grado II",  poblacion: "Oviedo",  socioIdx: 0 },
    { nombre: "Nicolás",  apellidos: "Soto Pedraza",      dni: "55667788N", fechaNacimiento: new Date("2001-03-25"), diagnostico: "Lesión medular dorsal",             porcentajeDiscapacidad: 72, grado: "Grado III", poblacion: "Avilés",  socioIdx: 1 },
    { nombre: "Luciana",  apellidos: "Cabrera Espinosa",  dni: "66778899O", fechaNacimiento: new Date("2014-11-07"), diagnostico: "Retraso madurativo",                porcentajeDiscapacidad: 33, grado: "Grado I",   poblacion: "Mieres",  socioIdx: 2 },
  ];

  for (const u of usuariosExtra) {
    const existing = await prisma.usuario.findFirst({ where: { dni: u.dni } });
    if (!existing) {
      await prisma.usuario.create({
        data: {
          nombre:                 u.nombre,
          apellidos:              u.apellidos,
          dni:                    u.dni,
          fechaNacimiento:        u.fechaNacimiento,
          poblacion:              u.poblacion,
          cp:                     "33001",
          provincia:              "Asturias",
          diagnostico:            u.diagnostico,
          porcentajeDiscapacidad: u.porcentajeDiscapacidad,
          grado:                  u.grado,
          centroAlQueAcude:       "Centro Nora",
          socioVinculadoId:       socios[u.socioIdx].id,
          fechaAlta:              new Date("2024-09-01"),
        },
      });
    }
  }
  console.log(`✅ ${usuariosExtra.length} usuarios adicionales`);

  // ── Sesiones de Abril 2026 para TODOS los usuarios ──────────────────────────
  // Días laborables de abril 2026 (lunes a viernes)
  const diasLaborables = [];
  for (let d = 1; d <= 30; d++) {
    const dia = new Date(2026, 3, d);
    const dow = dia.getDay();
    if (dow !== 0 && dow !== 6) diasLaborables.push(d);
  }

  // Estados posibles con sus pesos (para variedad realista)
  const estadosPosibles = [
    { estado: "asistio",              peso: 85 }, // Más asistencias para generar facturas
    { estado: "falta",                peso: 10 },
    { estado: "festivo",              peso: 2  },
    { estado: "vacaciones_terapeuta", peso: 1  },
    { estado: "permiso",              peso: 1  },
    { estado: "hospitalizacion",      peso: 1  },
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

  // Obtener TODOS los usuarios activos (incluyendo los adicionales)
  const todosUsuarios = await prisma.usuario.findMany({ where: { baja: false } });
  console.log(`📋 Generando sesiones de Abril 2026 para ${todosUsuarios.length} usuarios...`);

  let sesionesCreadas = 0;
  
  // Asignar a cada usuario 2-3 servicios aleatorios con 8-10 sesiones cada uno
  for (let i = 0; i < todosUsuarios.length; i++) {
    const usuario = todosUsuarios[i];
    
    // Seleccionar 2-3 servicios aleatorios (Logopedia, Psicología, Fisioterapia, T.O.)
    const serviciosUsuario = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 3 : 2);
    
    for (const sIdx of serviciosUsuario) {
      // Seleccionar terapeuta según especialidad
      const tIdx = sIdx; // 0=Logopedia(María), 1=Psicología(Laura), 2=Fisio(Ana), 3=T.O.(Carmen)
      const terapeutaReal = tIdx === 2 ? 3 : (tIdx === 3 ? 2 : tIdx); // Ajustar índices
      
      // 8-10 sesiones por servicio (2-3 veces por semana)
      const numSesiones = 8 + Math.floor(Math.random() * 3);
      const diasSesion = diasLaborables
        .filter((_, idx) => idx % 2 === (i % 2)) // Alternar días
        .slice(0, numSesiones);
      
      for (const dia of diasSesion) {
        const fecha = new Date(Date.UTC(2026, 3, dia));
        const estado = randomEstado();
        const cobrable = !noCobrables.includes(estado);

        // Evitar duplicados
        const existe = await prisma.sesion.findFirst({
          where: {
            usuarioId:   usuario.id,
            terapeutaId: terapeutas[terapeutaReal].id,
            fecha,
          },
        });
        if (existe) continue;

        await prisma.sesion.create({
          data: {
            usuarioId:   usuario.id,
            terapeutaId: terapeutas[terapeutaReal].id,
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
  }
  console.log(`✅ ${sesionesCreadas} sesiones en Abril 2026 para ${todosUsuarios.length} usuarios`);

  // ── Sesiones de Marzo 2026 (mes anterior para poder generar facturas) ───────
  const diasLaborablesMarzo = [];
  for (let d = 1; d <= 31; d++) {
    const dia = new Date(2026, 2, d);
    const dow = dia.getDay();
    if (dow !== 0 && dow !== 6) diasLaborablesMarzo.push(d);
  }

  console.log(`📋 Generando sesiones de Marzo 2026 para ${todosUsuarios.length} usuarios...`);
  let sesionesMarzo = 0;
  
  // Generar sesiones de marzo para todos los usuarios (similar a abril)
  for (let i = 0; i < todosUsuarios.length; i++) {
    const usuario = todosUsuarios[i];
    
    // Seleccionar 2-3 servicios aleatorios
    const serviciosUsuario = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 3 : 2);
    
    for (const sIdx of serviciosUsuario) {
      const tIdx = sIdx;
      const terapeutaReal = tIdx === 2 ? 3 : (tIdx === 3 ? 2 : tIdx);
      
      const numSesiones = 8 + Math.floor(Math.random() * 3);
      const diasSesion = diasLaborablesMarzo
        .filter((_, idx) => idx % 2 === (i % 2))
        .slice(0, numSesiones);
      
      for (const dia of diasSesion) {
        const fecha = new Date(Date.UTC(2026, 2, dia));
        const estado = Math.random() > 0.15 ? "asistio" : "falta";
        const cobrable = true;

        const existe = await prisma.sesion.findFirst({
          where: { usuarioId: usuario.id, terapeutaId: terapeutas[terapeutaReal].id, fecha },
        });
        if (existe) continue;

        await prisma.sesion.create({
          data: {
            usuarioId:   usuario.id,
            terapeutaId: terapeutas[terapeutaReal].id,
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
  }
  console.log(`✅ ${sesionesMarzo} sesiones en Marzo 2026 para ${todosUsuarios.length} usuarios`);

  // ── Datos bancarios de socios ────────────────────────────────────────────────
  const ibansSocios = [
    "ES9121000418450200051332",
    "ES8020486778983400057891",
    "ES7621000418401234567891",
    "ES6000491500051234567892",
    "ES5501822200150201504862",
    "ES2414650100722030876293",
  ];
  for (let i = 0; i < socios.length; i++) {
    const existing = await prisma.socioBancario.findFirst({ where: { socioId: socios[i].id } });
    if (!existing) {
      await prisma.socioBancario.create({
        data: {
          socioId: socios[i].id,
          iban: ibansSocios[i],
          cadencia: "Mensual",
          cuota: 50,
          entidadBancaria: ["CaixaBank", "BBVA", "Santander", "Sabadell", "Bankinter", "ING"][i],
        },
      });
    }
  }
  console.log("✅ Datos bancarios de socios");

  // ── Horarios habituales ──────────────────────────────────────────────────────
  // Generar horarios habituales para todos los usuarios activos
  console.log(`📋 Configurando horarios habituales para ${todosUsuarios.length} usuarios...`);
  let horariosCreados = 0;
  
  for (let i = 0; i < todosUsuarios.length; i++) {
    const usuario = todosUsuarios[i];
    
    // Cada usuario tiene 2-3 servicios con días fijos
    const serviciosUsuario = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 3 : 2);
    
    for (const sIdx of serviciosUsuario) {
      const tIdx = sIdx;
      const terapeutaReal = tIdx === 2 ? 3 : (tIdx === 3 ? 2 : tIdx);
      
      // Asignar 2 días fijos por semana para cada servicio
      const dias = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 2);
      
      for (const dia of dias) {
        const existe = await prisma.horarioHabitual.findFirst({
          where: {
            usuarioId:   usuario.id,
            terapeutaId: terapeutas[terapeutaReal].id,
            servicioId:  servicios[sIdx].id,
            diaSemana:   dia,
          },
        });
        if (!existe) {
          await prisma.horarioHabitual.create({
            data: {
              usuarioId:   usuario.id,
              terapeutaId: terapeutas[terapeutaReal].id,
              servicioId:  servicios[sIdx].id,
              diaSemana:   dia,
            },
          });
          horariosCreados++;
        }
      }
    }
  }
  console.log(`✅ ${horariosCreados} horarios habituales configurados`);

  // ── Avisos de ejemplo ────────────────────────────────────────────────────────
  const avisosData = [
    { usuarioId: usuarios[0].id, texto: "Renovar certificado de discapacidad en junio 2026", resuelto: false },
    { usuarioId: usuarios[3].id, texto: "Hablar con la familia sobre cambio de horario en septiembre", resuelto: false },
    { usuarioId: usuarios[4].id, texto: "Pendiente informe médico actualizado para la mutua", resuelto: false },
    { usuarioId: usuarios[1].id, texto: "Solicitar plaza en el programa de verano", resuelto: true },
  ];
  for (const a of avisosData) {
    const existe = await prisma.aviso.findFirst({ where: { usuarioId: a.usuarioId, texto: a.texto } });
    if (!existe) await prisma.aviso.create({ data: a });
  }
  console.log("✅ Avisos de ejemplo creados");

  // ── Facturas de Marzo 2026 ───────────────────────────────────────────────────
  // Generar facturas para todos los usuarios con sesiones cobrables en marzo
  const fechaInicioMarzo = new Date(Date.UTC(2026, 2, 1));
  const fechaFinMarzo    = new Date(Date.UTC(2026, 2, 31, 23, 59, 59));

  const sesionesMarzoPorUsuario = {};
  const todasSesionesMarzo = await prisma.sesion.findMany({
    where: { cobrable: true, fecha: { gte: fechaInicioMarzo, lte: fechaFinMarzo } },
    include: { servicio: true, usuario: { select: { id: true, baja: true } } },
  });

  for (const s of todasSesionesMarzo) {
    if (s.usuario.baja) continue;
    if (!sesionesMarzoPorUsuario[s.usuarioId]) sesionesMarzoPorUsuario[s.usuarioId] = [];
    sesionesMarzoPorUsuario[s.usuarioId].push(s);
  }

  let facturasCreadas = 0;
  for (const [uid, sesiones] of Object.entries(sesionesMarzoPorUsuario)) {
    const usuarioId = Number(uid);
    const existe = await prisma.factura.findFirst({ where: { usuarioId, mes: 3, anio: 2026 } });
    if (existe) continue;

    const agrupado = {};
    for (const s of sesiones) {
      if (!agrupado[s.servicioId]) agrupado[s.servicioId] = { servicio: s.servicio, count: 0 };
      agrupado[s.servicioId].count++;
    }
    const lineas   = Object.values(agrupado).map(g => ({
      servicioId: g.servicio.id, numSesiones: g.count,
      precioSesion: g.servicio.precio, suma: g.count * g.servicio.precio,
    }));
    const subtotal = lineas.reduce((acc, l) => acc + l.suma, 0);

    // Descuento hermanos
    const usuarioObj = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { socioVinculadoId: true } });
    let subtotalHermano = null;
    if (usuarioObj?.socioVinculadoId) {
      const hermanos = await prisma.usuario.findMany({
        where: { socioVinculadoId: usuarioObj.socioVinculadoId, id: { not: usuarioId } }, select: { id: true },
      });
      if (hermanos.length > 0) {
        const fh = await prisma.factura.findMany({
          where: { usuarioId: { in: hermanos.map(h => h.id) }, mes: 3, anio: 2026 }, select: { subtotal: true },
        });
        if (fh.length > 0) subtotalHermano = fh.reduce((acc, f) => acc + f.subtotal, 0);
      }
    }

    const aplicarDesc = subtotal > 120 || (subtotalHermano !== null && subtotal + subtotalHermano > 120);
    const descuento   = aplicarDesc ? subtotal * 0.1 : 0;
    const total       = subtotal - descuento;

    // numRecibo secuencial
    const ultima = await prisma.factura.findFirst({ where: { anio: 2026 }, orderBy: { numRecibo: "desc" }, select: { numRecibo: true } });
    let seq = 1;
    if (ultima) { const m = ultima.numRecibo.match(/^(\d+)\//); if (m) seq = parseInt(m[1]) + 1; }
    const numRecibo = `${String(seq).padStart(2, "0")}/2026`;

    await prisma.factura.create({
      data: { numRecibo, usuarioId, mes: 3, anio: 2026, subtotal, descuento, total, estado: "cobrada", lineas: { create: lineas } },
    });
    facturasCreadas++;
  }
  console.log(`✅ ${facturasCreadas} facturas de Marzo 2026 generadas (estado: cobrada)`);

  console.log("\n🎉 Base de datos lista con datos de ejemplo.");
  console.log("   → Credenciales: admin/nora2026 | maria/maria2026 | laura/laura2026 | carmen/carmen2026 | ana/ana2026");
  console.log("   → Facturas de Marzo ya generadas y cobradas.");
  console.log("   → Genera las facturas de Abril desde Facturación.");
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
