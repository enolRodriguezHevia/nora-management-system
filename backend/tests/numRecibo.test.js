/**
 * Tests para la generación del número de recibo secuencial
 */

function generarNumRecibo(ultimoNumRecibo, anio) {
  let numeroSecuencial = 1;
  if (ultimoNumRecibo) {
    const match = ultimoNumRecibo.match(/^(\d+)\//);
    if (match) numeroSecuencial = parseInt(match[1]) + 1;
  }
  return `${String(numeroSecuencial).padStart(2, "0")}/${anio}`;
}

describe("Generación de numRecibo", () => {
  test("Primera factura del año → 01/YYYY", () => {
    expect(generarNumRecibo(null, 2026)).toBe("01/2026");
  });

  test("Segunda factura → 02/YYYY", () => {
    expect(generarNumRecibo("01/2026", 2026)).toBe("02/2026");
  });

  test("Décima factura → 10/YYYY", () => {
    expect(generarNumRecibo("09/2026", 2026)).toBe("10/2026");
  });

  test("Factura 99 → 100/YYYY (sin padding)", () => {
    expect(generarNumRecibo("99/2026", 2026)).toBe("100/2026");
  });

  test("Formato correcto: número/año", () => {
    const num = generarNumRecibo("05/2026", 2026);
    expect(num).toMatch(/^\d+\/\d{4}$/);
  });

  test("Año nuevo empieza desde 01", () => {
    // Simula que el último del año anterior era 17/2025
    // pero para 2026 se pasa null (no hay facturas de 2026 aún)
    expect(generarNumRecibo(null, 2026)).toBe("01/2026");
  });
});
