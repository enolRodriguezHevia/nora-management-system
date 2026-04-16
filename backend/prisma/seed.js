const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando base de datos...");

  // ── Terapeutas ──────────────────────────────────────────────────────────────
  const terapeutas = [
    { nombre: "María",   apellidos: "García López",    especialidad: "Logopedia" },
    { nombre: "Laura",   apellidos: "Martínez Pérez",  especialidad: "Psicología" },
    { nombre: "Carmen",  apellidos: "Rodríguez Díaz",  especialidad: "Terapia Ocupacional" },
    { nombre: "Ana",     apellidos: "Fernández Ruiz",  especialidad: "Fisioterapia" },
  ];

  for (const t of terapeutas) {
    await prisma.terapeuta.upsert({
      where: { id: terapeutas.indexOf(t) + 1 },
      update: {},
      create: t,
    });
  }

  // ── Servicios (precios del PDF) ──────────────────────────────────────────────
  const servicios = [
    // Tratamientos individuales
    { nombre: "Logopedia",           categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Psicología",          categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Fisioterapia",        categoria: "Tratamiento Individual", precio: 12 },
    { nombre: "Terapia Ocupacional", categoria: "Tratamiento Individual", precio: 12 },
    // Aulas terapéuticas
    { nombre: "Aula TIC",            categoria: "Aula Terapéutica",       precio: 18 },
    { nombre: "Psicomotricidad",     categoria: "Aula Terapéutica",       precio: 12 },
    // Atención integral
    { nombre: "Atención Integral Adultos", categoria: "Atención Integral", precio: 30 },
    // Talleres
    { nombre: "Cocina",              categoria: "Taller",                 precio: 6  },
    { nombre: "Peluquería",          categoria: "Taller",                 precio: 6  },
    { nombre: "Gimnasia",            categoria: "Taller",                 precio: 11 },
    // Escuela de padres
    { nombre: "Escuela de Padres",   categoria: "Escuela de Padres",      precio: 12 },
    // Hipoterapia (precio variable, se pone 0 como placeholder)
    { nombre: "Hipoterapia Centro 1", categoria: "Hipoterapia",           precio: 0  },
    { nombre: "Hipoterapia Centro 2", categoria: "Hipoterapia",           precio: 0  },
  ];

  for (const s of servicios) {
    await prisma.servicio.upsert({
      where: { id: servicios.indexOf(s) + 1 },
      update: {},
      create: s,
    });
  }

  console.log("✅ Base de datos lista con terapeutas y servicios.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
