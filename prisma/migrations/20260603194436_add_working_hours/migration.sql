-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmployeeCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT NOT NULL,
    "starRating" REAL NOT NULL DEFAULT 3.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workingHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    CONSTRAINT "EmployeeCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeCard" ("createdAt", "email", "fullName", "id", "jobTitle", "phoneNumber", "starRating", "status", "updatedAt", "userId") SELECT "createdAt", "email", "fullName", "id", "jobTitle", "phoneNumber", "starRating", "status", "updatedAt", "userId" FROM "EmployeeCard";
DROP TABLE "EmployeeCard";
ALTER TABLE "new_EmployeeCard" RENAME TO "EmployeeCard";
CREATE UNIQUE INDEX "EmployeeCard_userId_key" ON "EmployeeCard"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
