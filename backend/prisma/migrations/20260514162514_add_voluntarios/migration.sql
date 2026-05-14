-- CreateTable
CREATE TABLE "Voluntario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT,
    "fechaNacimiento" DATETIME,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "poblacion" TEXT,
    "cp" TEXT,
    "provincia" TEXT,
    "fechaAlta" DATETIME,
    "baja" BOOLEAN NOT NULL DEFAULT false,
    "fechaBaja" DATETIME,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
