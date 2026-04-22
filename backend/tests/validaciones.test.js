const { SocioCreateSchema, UsuarioSchema } = require("../src/lib/schemas");

describe("Validaciones Zod — Socio", () => {
  const base = { numSocio: 1, nombre: "Carlos", apellidos: "García" };

  test("Datos mínimos válidos", () => {
    const r = SocioCreateSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  test("Email inválido → error", () => {
    const r = SocioCreateSchema.safeParse({ ...base, email: "noesvalido" });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toContain("email");
  });

  test("Email vacío → válido (campo opcional)", () => {
    const r = SocioCreateSchema.safeParse({ ...base, email: "" });
    expect(r.success).toBe(true);
  });

  test("Teléfono muy corto → error", () => {
    const r = SocioCreateSchema.safeParse({ ...base, telefono: "123" });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toContain("telefono");
  });

  test("Teléfono vacío → válido (campo opcional)", () => {
    const r = SocioCreateSchema.safeParse({ ...base, telefono: "" });
    expect(r.success).toBe(true);
  });

  test("CP con 4 dígitos → error", () => {
    const r = SocioCreateSchema.safeParse({ ...base, cp: "3300" });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toContain("cp");
  });

  test("CP con 5 dígitos → válido", () => {
    const r = SocioCreateSchema.safeParse({ ...base, cp: "33001" });
    expect(r.success).toBe(true);
  });

  test("Tipología inválida → error", () => {
    const r = SocioCreateSchema.safeParse({ ...base, tipologia: "Otro" });
    expect(r.success).toBe(false);
  });

  test("Tipología vacía → válido (campo opcional)", () => {
    const r = SocioCreateSchema.safeParse({ ...base, tipologia: "" });
    expect(r.success).toBe(true);
  });

  test("numSocio negativo → error", () => {
    const r = SocioCreateSchema.safeParse({ ...base, numSocio: -1 });
    expect(r.success).toBe(false);
  });

  test("Sin nombre → error", () => {
    const r = SocioCreateSchema.safeParse({ numSocio: 1, apellidos: "García" });
    expect(r.success).toBe(false);
  });
});

describe("Validaciones Zod — Usuario", () => {
  const base = { nombre: "Pablo", apellidos: "Pérez" };

  test("Datos mínimos válidos", () => {
    const r = UsuarioSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  test("Porcentaje discapacidad > 100 → error", () => {
    const r = UsuarioSchema.safeParse({ ...base, porcentajeDiscapacidad: 101 });
    expect(r.success).toBe(false);
  });

  test("Porcentaje discapacidad 100 → válido", () => {
    const r = UsuarioSchema.safeParse({ ...base, porcentajeDiscapacidad: 100 });
    expect(r.success).toBe(true);
  });

  test("Grado inválido → error", () => {
    const r = UsuarioSchema.safeParse({ ...base, grado: "Grado IV" });
    expect(r.success).toBe(false);
  });

  test("Grado vacío → válido (campo opcional)", () => {
    const r = UsuarioSchema.safeParse({ ...base, grado: "" });
    expect(r.success).toBe(true);
  });
});

describe("Validaciones Zod — IBAN", () => {
  const { optionalIBAN } = require("../src/lib/schemas");
  const schema = require("zod").object({ iban: optionalIBAN });

  test("IBAN válido español → válido", () => {
    const r = schema.safeParse({ iban: "ES9121000418450200051332" });
    expect(r.success).toBe(true);
  });

  test("IBAN con espacios → válido (se normalizan)", () => {
    const r = schema.safeParse({ iban: "ES91 2100 0418 4502 0005 1332" });
    expect(r.success).toBe(true);
  });

  test("IBAN incompleto → error", () => {
    const r = schema.safeParse({ iban: "ES91 2100 0418 4502 0005 13" });
    expect(r.success).toBe(false);
  });

  test("IBAN con dígitos de control incorrectos → error", () => {
    const r = schema.safeParse({ iban: "ES0021000418450200051332" });
    expect(r.success).toBe(false);
  });

  test("IBAN vacío → válido (campo opcional)", () => {
    const r = schema.safeParse({ iban: "" });
    expect(r.success).toBe(true);
  });

  test("IBAN null → válido (campo opcional)", () => {
    const r = schema.safeParse({ iban: null });
    expect(r.success).toBe(true);
  });
});
