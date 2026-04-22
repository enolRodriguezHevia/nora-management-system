const { calcularDescuento, UMBRAL } = require("../src/lib/descuento");

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
