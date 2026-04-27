/**
 * Tests para lógica de autenticación
 */

const bcrypt = require("bcryptjs");

describe("Lógica de Autenticación", () => {
  describe("Hashing de contraseñas", () => {
    test("Hash es diferente de la contraseña original", async () => {
      const password = "nora2026";
      const hash = await bcrypt.hash(password, 10);
      expect(hash).not.toBe(password);
    });

    test("Hash tiene longitud esperada", async () => {
      const password = "nora2026";
      const hash = await bcrypt.hash(password, 10);
      expect(hash.length).toBeGreaterThan(50);
    });

    test("Mismo password genera hashes diferentes", async () => {
      const password = "nora2026";
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      expect(hash1).not.toBe(hash2);
    });

    test("Verifica contraseña correcta", async () => {
      const password = "nora2026";
      const hash = await bcrypt.hash(password, 10);
      const valido = await bcrypt.compare(password, hash);
      expect(valido).toBe(true);
    });

    test("Rechaza contraseña incorrecta", async () => {
      const password = "nora2026";
      const hash = await bcrypt.hash(password, 10);
      const valido = await bcrypt.compare("incorrecta", hash);
      expect(valido).toBe(false);
    });
  });

  describe("Validación de roles", () => {
    const rolesValidos = ["admin", "terapeuta"];

    test("'admin' es rol válido", () => {
      expect(rolesValidos.includes("admin")).toBe(true);
    });

    test("'terapeuta' es rol válido", () => {
      expect(rolesValidos.includes("terapeuta")).toBe(true);
    });

    test("'usuario' NO es rol válido", () => {
      expect(rolesValidos.includes("usuario")).toBe(false);
    });

    test("'moderador' NO es rol válido", () => {
      expect(rolesValidos.includes("moderador")).toBe(false);
    });
  });

  describe("Validación de username", () => {
    function validarUsername(username) {
      return username && username.length >= 3 && username.length <= 20 && /^[a-z0-9_]+$/.test(username);
    }

    test("Username válido con letras", () => {
      expect(validarUsername("admin")).toBe(true);
    });

    test("Username válido con números", () => {
      expect(validarUsername("maria2026")).toBe(true);
    });

    test("Username válido con guión bajo", () => {
      expect(validarUsername("user_name")).toBe(true);
    });

    test("Username muy corto es inválido", () => {
      expect(validarUsername("ab")).toBe(false);
    });

    test("Username muy largo es inválido", () => {
      expect(validarUsername("a".repeat(21))).toBe(false);
    });

    test("Username con mayúsculas es inválido", () => {
      expect(validarUsername("Admin")).toBe(false);
    });

    test("Username con espacios es inválido", () => {
      expect(validarUsername("user name")).toBe(false);
    });

    test("Username con caracteres especiales es inválido", () => {
      expect(validarUsername("user@name")).toBe(false);
    });

    test("Username vacío es inválido", () => {
      expect(validarUsername("")).toBeFalsy();
    });
  });

  describe("Validación de contraseña", () => {
    function validarPassword(password) {
      return password && password.length >= 6;
    }

    test("Contraseña de 6 caracteres es válida", () => {
      expect(validarPassword("abc123")).toBe(true);
    });

    test("Contraseña de 8 caracteres es válida", () => {
      expect(validarPassword("nora2026")).toBe(true);
    });

    test("Contraseña muy corta es inválida", () => {
      expect(validarPassword("12345")).toBe(false);
    });

    test("Contraseña vacía es inválida", () => {
      expect(validarPassword("")).toBeFalsy();
    });

    test("Contraseña null es inválida", () => {
      expect(validarPassword(null)).toBeFalsy();
    });
  });

  describe("Extracción de token JWT", () => {
    function extractToken(authHeader) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
      return authHeader.split(" ")[1];
    }

    test("Extrae token correctamente", () => {
      const header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const token = extractToken(header);
      expect(token).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });

    test("Retorna null si no hay Bearer", () => {
      const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const token = extractToken(header);
      expect(token).toBe(null);
    });

    test("Retorna null si header está vacío", () => {
      const token = extractToken("");
      expect(token).toBe(null);
    });

    test("Retorna null si header es null", () => {
      const token = extractToken(null);
      expect(token).toBe(null);
    });
  });

  describe("Verificación de permisos", () => {
    test("Admin tiene acceso a todo", () => {
      const user = { rol: "admin" };
      const tieneAcceso = user.rol === "admin";
      expect(tieneAcceso).toBe(true);
    });

    test("Terapeuta NO tiene acceso admin", () => {
      const user = { rol: "terapeuta" };
      const tieneAcceso = user.rol === "admin";
      expect(tieneAcceso).toBe(false);
    });

    test("Terapeuta puede ver sus propias sesiones", () => {
      const user = { rol: "terapeuta", terapeutaId: 1 };
      const sesion = { terapeutaId: 1 };
      const tieneAcceso = user.rol === "admin" || sesion.terapeutaId === user.terapeutaId;
      expect(tieneAcceso).toBe(true);
    });

    test("Terapeuta NO puede ver sesiones de otros", () => {
      const user = { rol: "terapeuta", terapeutaId: 1 };
      const sesion = { terapeutaId: 2 };
      const tieneAcceso = user.rol === "admin" || sesion.terapeutaId === user.terapeutaId;
      expect(tieneAcceso).toBe(false);
    });
  });
});
