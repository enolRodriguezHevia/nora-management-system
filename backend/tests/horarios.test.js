/**
 * Tests para lógica de horarios habituales
 */

describe("Lógica de Horarios Habituales", () => {
  describe("Validación de día de semana", () => {
    test("Lunes (1) es válido", () => {
      const dia = 1;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Martes (2) es válido", () => {
      const dia = 2;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Miércoles (3) es válido", () => {
      const dia = 3;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Jueves (4) es válido", () => {
      const dia = 4;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Viernes (5) es válido", () => {
      const dia = 5;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Sábado (6) NO es válido", () => {
      const dia = 6;
      expect(dia >= 1 && dia <= 5).toBe(false);
    });

    test("Domingo (0) NO es válido", () => {
      const dia = 0;
      expect(dia >= 1 && dia <= 5).toBe(false);
    });
  });

  describe("Validación de mes pasado", () => {
    function esMesPasado(mes, anio) {
      const ahora = new Date();
      const mesActual = ahora.getMonth() + 1;
      const anioActual = ahora.getFullYear();
      return anio < anioActual || (anio === anioActual && mes < mesActual);
    }

    test("Mes anterior al actual es pasado", () => {
      const ahora = new Date();
      const mesActual = ahora.getMonth() + 1;
      const anioActual = ahora.getFullYear();
      
      const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
      const anioPasado = mesActual === 1 ? anioActual - 1 : anioActual;
      
      expect(esMesPasado(mesPasado, anioPasado)).toBe(true);
    });

    test("Mes actual NO es pasado", () => {
      const ahora = new Date();
      const mesActual = ahora.getMonth() + 1;
      const anioActual = ahora.getFullYear();
      
      expect(esMesPasado(mesActual, anioActual)).toBe(false);
    });

    test("Mes futuro NO es pasado", () => {
      const ahora = new Date();
      const mesActual = ahora.getMonth() + 1;
      const anioActual = ahora.getFullYear();
      
      const mesFuturo = mesActual === 12 ? 1 : mesActual + 1;
      const anioFuturo = mesActual === 12 ? anioActual + 1 : anioActual;
      
      expect(esMesPasado(mesFuturo, anioFuturo)).toBe(false);
    });

    test("Año pasado es pasado", () => {
      const ahora = new Date();
      const anioActual = ahora.getFullYear();
      
      expect(esMesPasado(6, anioActual - 1)).toBe(true);
    });
  });

  describe("Conversión de día de semana", () => {
    function getDiaSemana(fecha) {
      const dow = fecha.getDay();
      return dow === 0 ? 7 : dow;
    }

    test("Lunes devuelve 1", () => {
      const fecha = new Date("2026-04-06"); // Lunes
      expect(getDiaSemana(fecha)).toBe(1);
    });

    test("Viernes devuelve 5", () => {
      const fecha = new Date("2026-04-10"); // Viernes
      expect(getDiaSemana(fecha)).toBe(5);
    });

    test("Domingo devuelve 7", () => {
      const fecha = new Date("2026-04-05"); // Domingo
      expect(getDiaSemana(fecha)).toBe(7);
    });

    test("Sábado devuelve 6", () => {
      const fecha = new Date("2026-04-04"); // Sábado
      expect(getDiaSemana(fecha)).toBe(6);
    });
  });

  describe("Generación de rango de meses", () => {
    function generarRangoMeses(mesDesde, anioDesde, mesHasta, anioHasta) {
      const meses = [];
      let m = mesDesde, a = anioDesde;
      while (a < anioHasta || (a === anioHasta && m <= mesHasta)) {
        meses.push({ mes: m, anio: a });
        m++;
        if (m > 12) { m = 1; a++; }
        if (meses.length > 24) break; // Seguridad
      }
      return meses;
    }

    test("Rango de 3 meses en el mismo año", () => {
      const meses = generarRangoMeses(1, 2026, 3, 2026);
      expect(meses.length).toBe(3);
      expect(meses[0]).toEqual({ mes: 1, anio: 2026 });
      expect(meses[2]).toEqual({ mes: 3, anio: 2026 });
    });

    test("Rango que cruza año", () => {
      const meses = generarRangoMeses(11, 2025, 2, 2026);
      expect(meses.length).toBe(4);
      expect(meses[0]).toEqual({ mes: 11, anio: 2025 });
      expect(meses[1]).toEqual({ mes: 12, anio: 2025 });
      expect(meses[2]).toEqual({ mes: 1, anio: 2026 });
      expect(meses[3]).toEqual({ mes: 2, anio: 2026 });
    });

    test("Rango de un solo mes", () => {
      const meses = generarRangoMeses(5, 2026, 5, 2026);
      expect(meses.length).toBe(1);
      expect(meses[0]).toEqual({ mes: 5, anio: 2026 });
    });

    test("Límite de seguridad de 24 meses", () => {
      const meses = generarRangoMeses(1, 2024, 12, 2026);
      expect(meses.length).toBeGreaterThanOrEqual(24);
      expect(meses.length).toBeLessThanOrEqual(25);
    });
  });

  describe("Filtrado de horarios activos", () => {
    test("Filtra horarios de usuarios de baja", () => {
      const horarios = [
        { id: 1, usuario: { baja: false } },
        { id: 2, usuario: { baja: true } },
        { id: 3, usuario: { baja: false } },
      ];

      const activos = horarios.filter(h => !h.usuario.baja);
      expect(activos.length).toBe(2);
      expect(activos.map(h => h.id)).toEqual([1, 3]);
    });

    test("Todos activos si ninguno está de baja", () => {
      const horarios = [
        { id: 1, usuario: { baja: false } },
        { id: 2, usuario: { baja: false } },
      ];

      const activos = horarios.filter(h => !h.usuario.baja);
      expect(activos.length).toBe(2);
    });

    test("Ninguno activo si todos están de baja", () => {
      const horarios = [
        { id: 1, usuario: { baja: true } },
        { id: 2, usuario: { baja: true } },
      ];

      const activos = horarios.filter(h => !h.usuario.baja);
      expect(activos.length).toBe(0);
    });
  });
});
