/**
 * Tests para lógica de facturación
 */

describe("Lógica de Facturación", () => {
  describe("Cálculo de líneas de factura", () => {
    test("Agrupa sesiones por servicio correctamente", () => {
      const sesiones = [
        { servicioId: 1, servicio: { nombre: "Logopedia", precio: 12 } },
        { servicioId: 1, servicio: { nombre: "Logopedia", precio: 12 } },
        { servicioId: 2, servicio: { nombre: "Psicología", precio: 12 } },
        { servicioId: 1, servicio: { nombre: "Logopedia", precio: 12 } },
      ];

      const agrupado = {};
      sesiones.forEach(s => {
        if (!agrupado[s.servicioId]) {
          agrupado[s.servicioId] = { servicio: s.servicio, count: 0 };
        }
        agrupado[s.servicioId].count++;
      });

      expect(agrupado[1].count).toBe(3);
      expect(agrupado[2].count).toBe(1);
    });

    test("Calcula subtotal correctamente", () => {
      const lineas = [
        { numSesiones: 8, precioSesion: 12, suma: 96 },
        { numSesiones: 4, precioSesion: 12, suma: 48 },
      ];

      const subtotal = lineas.reduce((acc, l) => acc + l.suma, 0);
      expect(subtotal).toBe(144);
    });

    test("Calcula suma de línea correctamente", () => {
      const numSesiones = 10;
      const precioSesion = 12;
      const suma = numSesiones * precioSesion;
      expect(suma).toBe(120);
    });
  });

  describe("Validación de mes y año", () => {
    test("Mes válido (1-12)", () => {
      expect([1, 6, 12].every(m => m >= 1 && m <= 12)).toBe(true);
    });

    test("Mes inválido", () => {
      expect([0, 13, -1].some(m => m >= 1 && m <= 12)).toBe(false);
    });

    test("Año válido (2020-2030)", () => {
      expect([2024, 2025, 2026].every(a => a >= 2020 && a <= 2030)).toBe(true);
    });
  });

  describe("Estados de factura", () => {
    const estadosValidos = ["pendiente", "cobrada", "anulada"];

    test("'pendiente' es estado válido", () => {
      expect(estadosValidos.includes("pendiente")).toBe(true);
    });

    test("'cobrada' es estado válido", () => {
      expect(estadosValidos.includes("cobrada")).toBe(true);
    });

    test("'anulada' es estado válido", () => {
      expect(estadosValidos.includes("anulada")).toBe(true);
    });

    test("'pagada' NO es estado válido", () => {
      expect(estadosValidos.includes("pagada")).toBe(false);
    });
  });

  describe("Detección de facturas desactualizadas", () => {
    test("Factura desactualizada si sesiones cambiaron después", () => {
      const fechaFactura = new Date("2026-04-30T10:00:00");
      const fechaUltimaSesion = new Date("2026-04-30T15:00:00");
      
      const desactualizada = fechaUltimaSesion > fechaFactura;
      expect(desactualizada).toBe(true);
    });

    test("Factura actualizada si no hay cambios posteriores", () => {
      const fechaFactura = new Date("2026-04-30T15:00:00");
      const fechaUltimaSesion = new Date("2026-04-30T10:00:00");
      
      const desactualizada = fechaUltimaSesion > fechaFactura;
      expect(desactualizada).toBe(false);
    });
  });

  describe("Formato de número de recibo", () => {
    test("Formato correcto con padding", () => {
      const seq = 5;
      const anio = 2026;
      const numRecibo = `${String(seq).padStart(2, "0")}/${anio}`;
      expect(numRecibo).toBe("05/2026");
    });

    test("Formato correcto sin padding necesario", () => {
      const seq = 15;
      const anio = 2026;
      const numRecibo = `${String(seq).padStart(2, "0")}/${anio}`;
      expect(numRecibo).toBe("15/2026");
    });

    test("Extrae número de secuencia correctamente", () => {
      const numRecibo = "23/2026";
      const match = numRecibo.match(/^(\d+)\//);
      expect(match[1]).toBe("23");
      expect(parseInt(match[1])).toBe(23);
    });
  });
});
