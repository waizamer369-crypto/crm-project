-- CreateTable
CREATE TABLE "StarHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCardId" TEXT NOT NULL,
    "changeAmount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "givenById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StarHistory_employeeCardId_fkey" FOREIGN KEY ("employeeCardId") REFERENCES "EmployeeCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StarHistory_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
