/**
 * Tests para lógica de sesiones
 */

describe("Lógica de Sesiones", () => {
  describe("Estado cobrable", () => {
    test("'asistio' es cobrable", () => {
      const estado = "asistio";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(true);
    });

    test("'falta' es cobrable", () => {
      const estado = "falta";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(true);
    });

    test("'programada' NO es cobrable", () => {
      const estado = "programada";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(false);
    });

    test("'festivo' NO es cobrable", () => {
      const estado = "festivo";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(false);
    });

    test("'vacaciones_terapeuta' NO es cobrable", () => {
      const estado = "vacaciones_terapeuta";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(false);
    });

    test("'permiso' NO es cobrable", () => {
      const estado = "permiso";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(false);
    });

    test("'hospitalizacion' NO es cobrable", () => {
      const estado = "hospitalizacion";
      const cobrable = !["programada", "festivo", "vacaciones_terapeuta", "permiso", "hospitalizacion"].includes(estado);
      expect(cobrable).toBe(false);
    });
  });

  describe("Validación de días de semana", () => {
    test("Lunes (1) es día válido", () => {
      const dia = 1;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Viernes (5) es día válido", () => {
      const dia = 5;
      expect(dia >= 1 && dia <= 5).toBe(true);
    });

    test("Sábado (6) NO es día válido", () => {
      const dia = 6;
      expect(dia >= 1 && dia <= 5).toBe(false);
    });

    test("Domingo (0) NO es día válido", () => {
      const dia = 0;
      expect(dia >= 1 && dia <= 5).toBe(false);
    });
  });

  describe("Cálculo de días laborables del mes", () => {
    function getDiasLaborables(mes, anio) {
      const dias = [];
      const totalDias = new Date(anio, mes, 0).getDate();
      for (let d = 1; d <= totalDias; d++) {
        const fecha = new Date(anio, mes - 1, d);
        const dow = fecha.getDay();
        if (dow !== 0 && dow !== 6) {
          dias.push(d);
        }
      }
      return dias;
    }

    test("Abril 2026 tiene 22 días laborables", () => {
      const dias = getDiasLaborables(4, 2026);
      expect(dias.length).toBe(22);
    });

    test("Febrero 2026 (no bisiesto) tiene 20 días laborables", () => {
      const dias = getDiasLaborables(2, 2026);
      expect(dias.length).toBe(20);
    });

    test("Diciembre 2026 tiene 23 días laborables", () => {
      const dias = getDiasLaborables(12, 2026);
      expect(dias.length).toBe(23);
    });
  });
});
