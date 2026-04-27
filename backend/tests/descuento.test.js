const { calcularDescuento, agruparSesionesEnLineas, obtenerSubtotalHermano, siguienteNumRecibo, UMBRAL } = require("../src/lib/descuento");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

describe("Lógica de descuento 10%", () => {
  test("Factura individual < 120€ → sin descuento", () => {
    const result = calcularDescuento(100);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(100);
  });

  test("Factura individual = 120€ → sin descuento", () => {
    const result = calcularDescuento(120);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(120);
  });

  test("Factura individual > 120€ → 10% descuento", () => {
    const result = calcularDescuento(150);
    expect(result.aplicar).toBe(true);
    expect(result.descuento).toBe(15);
    expect(result.total).toBe(135);
  });

  test("Factura individual 121€ → 10% descuento (justo por encima)", () => {
    const result = calcularDescuento(121);
    expect(result.aplicar).toBe(true);
    expect(result.descuento).toBeCloseTo(12.1, 2);
    expect(result.total).toBeCloseTo(108.9, 2);
  });

  test("Dos hermanos, suma < 120€ → sin descuento", () => {
    const result = calcularDescuento(60, 50);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(60);
  });

  test("Dos hermanos, suma = 120€ → sin descuento", () => {
    const result = calcularDescuento(60, 60);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(60);
  });

  test("Dos hermanos, suma > 120€ → 10% descuento", () => {
    const result = calcularDescuento(70, 60);
    expect(result.aplicar).toBe(true);
    expect(result.descuento).toBe(7);
    expect(result.total).toBe(63);
  });

  test("Dos hermanos, suma 121€ → 10% descuento (justo por encima)", () => {
    const result = calcularDescuento(61, 60);
    expect(result.aplicar).toBe(true);
    expect(result.descuento).toBeCloseTo(6.1, 2);
    expect(result.total).toBeCloseTo(54.9, 2);
  });

  test("Hermano con subtotal 0 → sin descuento si propio < 120€", () => {
    const result = calcularDescuento(100, 0);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(100);
  });

  test("Caso real: 172.80€ individual → 10% descuento", () => {
    const result = calcularDescuento(172.80);
    expect(result.aplicar).toBe(true);
    expect(result.descuento).toBeCloseTo(17.28, 2);
    expect(result.total).toBeCloseTo(155.52, 2);
  });

  test("Caso real: 60€ sin hermanos → sin descuento", () => {
    const result = calcularDescuento(60);
    expect(result.aplicar).toBe(false);
    expect(result.descuento).toBe(0);
    expect(result.total).toBe(60);
  });
});

describe("agruparSesionesEnLineas", () => {
  test("Agrupa sesiones de un solo servicio", () => {
    const sesiones = [
      { servicioId: 1, servicio: { id: 1, precio: 20 } },
      { servicioId: 1, servicio: { id: 1, precio: 20 } },
      { servicioId: 1, servicio: { id: 1, precio: 20 } },
    ];
    const lineas = agruparSesionesEnLineas(sesiones);
    expect(lineas).toHaveLength(1);
    expect(lineas[0]).toEqual({
      servicioId: 1,
      numSesiones: 3,
      precioSesion: 20,
      suma: 60,
    });
  });

  test("Agrupa sesiones de múltiples servicios", () => {
    const sesiones = [
      { servicioId: 1, servicio: { id: 1, precio: 20 } },
      { servicioId: 1, servicio: { id: 1, precio: 20 } },
      { servicioId: 2, servicio: { id: 2, precio: 30 } },
      { servicioId: 2, servicio: { id: 2, precio: 30 } },
      { servicioId: 3, servicio: { id: 3, precio: 25 } },
    ];
    const lineas = agruparSesionesEnLineas(sesiones);
    expect(lineas).toHaveLength(3);
    
    const linea1 = lineas.find(l => l.servicioId === 1);
    expect(linea1).toEqual({ servicioId: 1, numSesiones: 2, precioSesion: 20, suma: 40 });
    
    const linea2 = lineas.find(l => l.servicioId === 2);
    expect(linea2).toEqual({ servicioId: 2, numSesiones: 2, precioSesion: 30, suma: 60 });
    
    const linea3 = lineas.find(l => l.servicioId === 3);
    expect(linea3).toEqual({ servicioId: 3, numSesiones: 1, precioSesion: 25, suma: 25 });
  });

  test("Devuelve array vacío si no hay sesiones", () => {
    const lineas = agruparSesionesEnLineas([]);
    expect(lineas).toEqual([]);
  });

  test("Calcula correctamente suma con precios decimales", () => {
    const sesiones = [
      { servicioId: 1, servicio: { id: 1, precio: 21.6 } },
      { servicioId: 1, servicio: { id: 1, precio: 21.6 } },
      { servicioId: 1, servicio: { id: 1, precio: 21.6 } },
      { servicioId: 1, servicio: { id: 1, precio: 21.6 } },
    ];
    const lineas = agruparSesionesEnLineas(sesiones);
    expect(lineas[0].suma).toBeCloseTo(86.4, 2);
  });
});

describe("obtenerSubtotalHermano", () => {
  beforeAll(async () => {
    // No limpiamos la BD aquí, cada test limpia sus propios datos
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Devuelve null si el usuario no tiene socio vinculado", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "Test", apellidos: "Usuario", diagnostico: "Test" },
    });
    
    const subtotalHermano = await obtenerSubtotalHermano(prisma, usuario.id, 100, 3, 2026);
    expect(subtotalHermano).toBeNull();
    
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

  test("Devuelve null si no hay hermanos con el mismo socio vinculado", async () => {
    const socioVinculado = await prisma.socio.create({
      data: { numSocio: 99003, nombre: "Test", apellidos: "Vinculado", dni: "33333333C", telefono: "333333333" },
    });
    const usuario = await prisma.usuario.create({
      data: { 
        nombre: "Test", 
        apellidos: "Usuario", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    
    const subtotalHermano = await obtenerSubtotalHermano(prisma, usuario.id, 100, 3, 2026);
    expect(subtotalHermano).toBeNull();
    
    await prisma.usuario.delete({ where: { id: usuario.id } });
    await prisma.socio.delete({ where: { id: socioVinculado.id } });
  });

  test("Devuelve null si los hermanos no tienen facturas en ese mes", async () => {
    const socioVinculado = await prisma.socio.create({
      data: { numSocio: 99005, nombre: "Test", apellidos: "Vinculado", dni: "55555555E", telefono: "555555555" },
    });
    const usuario1 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Uno", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    const usuario2 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Dos", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    
    const subtotalHermano = await obtenerSubtotalHermano(prisma, usuario1.id, 100, 3, 2026);
    expect(subtotalHermano).toBeNull();
    
    await prisma.usuario.delete({ where: { id: usuario1.id } });
    await prisma.usuario.delete({ where: { id: usuario2.id } });
    await prisma.socio.delete({ where: { id: socioVinculado.id } });
  });

  test("Devuelve subtotal del hermano si existe factura", async () => {
    const socioVinculado = await prisma.socio.create({
      data: { numSocio: 99007, nombre: "Test", apellidos: "Vinculado", dni: "77777777G", telefono: "777777777" },
    });
    const usuario1 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Uno", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    const usuario2 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Dos", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    
    await prisma.factura.create({
      data: {
        usuarioId: usuario2.id,
        mes: 3,
        anio: 2026,
        numRecibo: "99/2026",
        subtotal: 80,
        descuento: 0,
        total: 80,
        estado: "pendiente",
      },
    });
    
    const subtotalHermano = await obtenerSubtotalHermano(prisma, usuario1.id, 50, 3, 2026);
    expect(subtotalHermano).toBe(80);
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario2.id } });
    await prisma.usuario.delete({ where: { id: usuario1.id } });
    await prisma.usuario.delete({ where: { id: usuario2.id } });
    await prisma.socio.delete({ where: { id: socioVinculado.id } });
  });

  test("Aplica descuento retroactivo si la suma supera el umbral", async () => {
    const socioVinculado = await prisma.socio.create({
      data: { numSocio: 99209, nombre: "Test", apellidos: "Vinculado", dni: "88888888H", telefono: "888888888" },
    });
    const usuario1 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Uno", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    const usuario2 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Dos", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    
    const factura = await prisma.factura.create({
      data: {
        usuarioId: usuario2.id,
        mes: 4,
        anio: 2026,
        numRecibo: "998/2026",
        subtotal: 70,
        descuento: 0,
        total: 70,
        estado: "pendiente",
      },
    });
    
    // Usuario1 tiene 60€, usuario2 tiene 70€ → suma 130€ > 120€
    // Pero el descuento retroactivo solo se aplica si el subtotal individual > 120€
    // Por lo tanto, la factura del hermano NO debería cambiar
    const subtotalHermano = await obtenerSubtotalHermano(prisma, usuario1.id, 60, 4, 2026);
    expect(subtotalHermano).toBe(70);
    
    const facturaActualizada = await prisma.factura.findUnique({ where: { id: factura.id } });
    expect(facturaActualizada.descuento).toBe(0);
    expect(facturaActualizada.total).toBe(70);
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario2.id } });
    await prisma.usuario.delete({ where: { id: usuario1.id } });
    await prisma.usuario.delete({ where: { id: usuario2.id } });
    await prisma.socio.delete({ where: { id: socioVinculado.id } });
  });

  test("No aplica descuento retroactivo si ya tenía descuento", async () => {
    const socioVinculado = await prisma.socio.create({
      data: { numSocio: 99011, nombre: "Test", apellidos: "Vinculado", dni: "20202020K", telefono: "202020202" },
    });
    const usuario1 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Uno", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    const usuario2 = await prisma.usuario.create({
      data: { 
        nombre: "Hermano", 
        apellidos: "Dos", 
        socioVinculadoId: socioVinculado.id,
        diagnostico: "Test" 
      },
    });
    
    const factura = await prisma.factura.create({
      data: {
        usuarioId: usuario2.id,
        mes: 5,
        anio: 2026,
        numRecibo: "97/2026",
        subtotal: 150,
        descuento: 15,
        total: 135,
        estado: "pendiente",
      },
    });
    
    await obtenerSubtotalHermano(prisma, usuario1.id, 60, 5, 2026);
    
    const facturaActualizada = await prisma.factura.findUnique({ where: { id: factura.id } });
    expect(facturaActualizada.descuento).toBe(15);
    expect(facturaActualizada.total).toBe(135);
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario2.id } });
    await prisma.usuario.delete({ where: { id: usuario1.id } });
    await prisma.usuario.delete({ where: { id: usuario2.id } });
    await prisma.socio.delete({ where: { id: socioVinculado.id } });
  });
});

describe("siguienteNumRecibo", () => {
  beforeAll(async () => {
    // No limpiamos la BD aquí, cada test limpia sus propios datos
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Devuelve 01/2026 si no hay facturas previas", async () => {
    const numRecibo = await siguienteNumRecibo(prisma, 2030);
    expect(numRecibo).toBe("01/2030");
  });

  test("Incrementa el número de recibo correctamente", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "Test", apellidos: "Usuario", diagnostico: "Test" },
    });
    
    await prisma.factura.create({
      data: {
        usuarioId: usuario.id,
        mes: 1,
        anio: 2027,
        numRecibo: "01/2027",
        subtotal: 100,
        descuento: 0,
        total: 100,
        estado: "pendiente",
      },
    });
    
    const numRecibo = await siguienteNumRecibo(prisma, 2027);
    expect(numRecibo).toBe("02/2027");
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

  test("Maneja números de recibo de dos dígitos", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "Test", apellidos: "Usuario", diagnostico: "Test" },
    });
    
    await prisma.factura.create({
      data: {
        usuarioId: usuario.id,
        mes: 1,
        anio: 2028,
        numRecibo: "09/2028",
        subtotal: 100,
        descuento: 0,
        total: 100,
        estado: "pendiente",
      },
    });
    
    const numRecibo = await siguienteNumRecibo(prisma, 2028);
    expect(numRecibo).toBe("10/2028");
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

  test("Encuentra el número más alto si hay múltiples facturas", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombre: "Test", apellidos: "Usuario", diagnostico: "Test" },
    });
    
    await prisma.factura.createMany({
      data: [
        {
          usuarioId: usuario.id,
          mes: 1,
          anio: 2029,
          numRecibo: "05/2029",
          subtotal: 100,
          descuento: 0,
          total: 100,
          estado: "pendiente",
        },
        {
          usuarioId: usuario.id,
          mes: 2,
          anio: 2029,
          numRecibo: "12/2029",
          subtotal: 100,
          descuento: 0,
          total: 100,
          estado: "pendiente",
        },
        {
          usuarioId: usuario.id,
          mes: 3,
          anio: 2029,
          numRecibo: "08/2029",
          subtotal: 100,
          descuento: 0,
          total: 100,
          estado: "pendiente",
        },
      ],
    });
    
    const numRecibo = await siguienteNumRecibo(prisma, 2029);
    expect(numRecibo).toBe("13/2029");
    
    await prisma.factura.deleteMany({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });
});
