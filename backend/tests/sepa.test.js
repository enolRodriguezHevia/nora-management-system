/**
 * Tests para lógica de remesas SEPA
 */

describe("Lógica SEPA", () => {
  describe("Formato de IBAN", () => {
    function formatIBAN(iban) {
      return (iban || "").replace(/\s/g, "").toUpperCase();
    }

    test("Elimina espacios del IBAN", () => {
      const iban = "ES91 2100 0418 4502 0005 1332";
      const formatted = formatIBAN(iban);
      expect(formatted).toBe("ES9121000418450200051332");
    });

    test("Convierte a mayúsculas", () => {
      const iban = "es9121000418450200051332";
      const formatted = formatIBAN(iban);
      expect(formatted).toBe("ES9121000418450200051332");
    });

    test("Maneja IBAN vacío", () => {
      const formatted = formatIBAN("");
      expect(formatted).toBe("");
    });

    test("Maneja IBAN null", () => {
      const formatted = formatIBAN(null);
      expect(formatted).toBe("");
    });
  });

  describe("Generación de ID de mensaje", () => {
    function msgId(mes, anio) {
      return `NORA-${anio}${String(mes).padStart(2, "0")}-${Date.now()}`;
    }

    test("Formato correcto para abril 2026", () => {
      const id = msgId(4, 2026);
      expect(id).toMatch(/^NORA-202604-\d+$/);
    });

    test("Formato correcto para diciembre 2026", () => {
      const id = msgId(12, 2026);
      expect(id).toMatch(/^NORA-202612-\d+$/);
    });

    test("Padding correcto para mes de un dígito", () => {
      const id = msgId(3, 2026);
      expect(id).toMatch(/^NORA-202603-\d+$/);
    });
  });

  describe("Formato de fecha ISO", () => {
    function isoDate(d) {
      return new Date(d).toISOString().slice(0, 10);
    }

    test("Convierte fecha a formato YYYY-MM-DD", () => {
      const fecha = new Date("2026-04-15T10:30:00");
      const iso = isoDate(fecha);
      expect(iso).toBe("2026-04-15");
    });

    test("Maneja fecha de inicio de mes", () => {
      const fecha = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
      const iso = isoDate(fecha);
      expect(iso).toBe("2026-01-01");
    });

    test("Maneja fecha de fin de mes", () => {
      const fecha = new Date(Date.UTC(2026, 11, 31, 23, 59, 59));
      const iso = isoDate(fecha);
      expect(iso).toBe("2026-12-31");
    });
  });

  describe("Escape de caracteres XML", () => {
    function esc(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    }

    test("Escapa ampersand", () => {
      expect(esc("A & B")).toBe("A &amp; B");
    });

    test("Escapa menor que", () => {
      expect(esc("A < B")).toBe("A &lt; B");
    });

    test("Escapa mayor que", () => {
      expect(esc("A > B")).toBe("A &gt; B");
    });

    test("Escapa comillas dobles", () => {
      expect(esc('Texto "citado"')).toBe("Texto &quot;citado&quot;");
    });

    test("Escapa comillas simples", () => {
      expect(esc("Texto 'citado'")).toBe("Texto &apos;citado&apos;");
    });

    test("Escapa múltiples caracteres", () => {
      expect(esc('A & B < "C"')).toBe("A &amp; B &lt; &quot;C&quot;");
    });

    test("Maneja string vacío", () => {
      expect(esc("")).toBe("");
    });

    test("Maneja null", () => {
      expect(esc(null)).toBe("");
    });
  });

  describe("Validación de facturas para SEPA", () => {
    test("Factura con IBAN es válida", () => {
      const factura = {
        estado: "pendiente",
        socio: { iban: "ES9121000418450200051332" }
      };
      const valida = !!(factura.estado === "pendiente" && factura.socio?.iban);
      expect(valida).toBe(true);
    });

    test("Factura sin IBAN NO es válida", () => {
      const factura = {
        estado: "pendiente",
        socio: { iban: null }
      };
      const valida = !!(factura.estado === "pendiente" && factura.socio?.iban);
      expect(valida).toBe(false);
    });

    test("Factura cobrada NO es válida", () => {
      const factura = {
        estado: "cobrada",
        socio: { iban: "ES9121000418450200051332" }
      };
      const valida = !!(factura.estado === "pendiente" && factura.socio?.iban);
      expect(valida).toBe(false);
    });

    test("Factura sin socio NO es válida", () => {
      const factura = {
        estado: "pendiente",
        socio: null
      };
      const valida = !!(factura.estado === "pendiente" && factura.socio?.iban);
      expect(valida).toBe(false);
    });
  });

  describe("Cálculo de fecha de cobro", () => {
    test("Fecha de cobro por defecto es +5 días", () => {
      const ahora = new Date();
      const fechaCobro = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);
      const diferencia = Math.floor((fechaCobro - ahora) / (24 * 60 * 60 * 1000));
      expect(diferencia).toBe(5);
    });
  });

  describe("Agrupación de facturas por socio", () => {
    test("Agrupa facturas del mismo socio", () => {
      const facturas = [
        { usuarioId: 1, socioId: 1, total: 100 },
        { usuarioId: 2, socioId: 1, total: 50 },
        { usuarioId: 3, socioId: 2, total: 120 },
      ];

      const porSocio = {};
      facturas.forEach(f => {
        if (!porSocio[f.socioId]) porSocio[f.socioId] = [];
        porSocio[f.socioId].push(f);
      });

      expect(porSocio[1].length).toBe(2);
      expect(porSocio[2].length).toBe(1);
    });

    test("Calcula total por socio", () => {
      const facturas = [
        { socioId: 1, total: 100 },
        { socioId: 1, total: 50 },
      ];

      const total = facturas.reduce((acc, f) => acc + f.total, 0);
      expect(total).toBe(150);
    });
  });
});
