-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSistema" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'admin',
    "terapeutaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_UserSistema" ("createdAt", "id", "nombre", "password", "username") SELECT "createdAt", "id", "nombre", "password", "username" FROM "UserSistema";
DROP TABLE "UserSistema";
ALTER TABLE "new_UserSistema" RENAME TO "UserSistema";
CREATE UNIQUE INDEX "UserSistema_username_key" ON "UserSistema"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
