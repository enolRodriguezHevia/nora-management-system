-- CreateTable
CREATE TABLE "Socio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numSocio" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT,
    "direccion" TEXT,
    "poblacion" TEXT,
    "cp" TEXT,
    "provincia" TEXT,
    "telefono" TEXT,
    "telefono2" TEXT,
    "email" TEXT,
    "tipologia" TEXT,
    "notificaciones" TEXT,
    "fechaAlta" DATETIME,
    "baja" BOOLEAN NOT NULL DEFAULT false,
    "fechaBaja" DATETIME,
    "referencias" TEXT,
    "observaciones" TEXT,
    "empresa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocioBancario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "socioId" INTEGER NOT NULL,
    "cadencia" TEXT,
    "cuota" REAL,
    "entidadBancaria" TEXT,
    "iban" TEXT,
    "codigoEntidad" TEXT,
    "codigoSucursal" TEXT,
    "dc" TEXT,
    "numeroCuenta" TEXT,
    "observaciones" TEXT,
    CONSTRAINT "SocioBancario_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT,
    "fechaNacimiento" DATETIME,
    "direccion" TEXT,
    "poblacion" TEXT,
    "cp" TEXT,
    "provincia" TEXT,
    "telefono" TEXT,
    "telefono2" TEXT,
    "email" TEXT,
    "diagnostico" TEXT,
    "porcentajeDiscapacidad" REAL,
    "grado" TEXT,
    "centroAlQueAcude" TEXT,
    "socioVinculadoId" INTEGER,
    "socioVinculado2Id" INTEGER,
    "fechaAlta" DATETIME,
    "baja" BOOLEAN NOT NULL DEFAULT false,
    "fechaBaja" DATETIME,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_socioVinculadoId_fkey" FOREIGN KEY ("socioVinculadoId") REFERENCES "Socio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Usuario_socioVinculado2Id_fkey" FOREIGN KEY ("socioVinculado2Id") REFERENCES "Socio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsuarioBancario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "entidadBancaria" TEXT,
    "iban" TEXT,
    "codigoEntidad" TEXT,
    "codigoSucursal" TEXT,
    "dc" TEXT,
    "numeroCuenta" TEXT,
    "observaciones" TEXT,
    CONSTRAINT "UsuarioBancario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Terapeuta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Servicio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "terapeutaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'asistio',
    "cobrable" BOOLEAN NOT NULL DEFAULT true,
    "actividadRealizada" TEXT,
    "motivacion" TEXT,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sesion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sesion_terapeutaId_fkey" FOREIGN KEY ("terapeutaId") REFERENCES "Terapeuta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sesion_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numRecibo" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineaFactura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facturaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "numSesiones" INTEGER NOT NULL,
    "precioSesion" REAL NOT NULL,
    "suma" REAL NOT NULL,
    CONSTRAINT "LineaFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineaFactura_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Socio_numSocio_key" ON "Socio"("numSocio");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numRecibo_key" ON "Factura"("numRecibo");
