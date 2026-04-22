-- CreateTable
CREATE TABLE "HorarioHabitual" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "terapeutaId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HorarioHabitual_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HorarioHabitual_terapeutaId_fkey" FOREIGN KEY ("terapeutaId") REFERENCES "Terapeuta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HorarioHabitual_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
