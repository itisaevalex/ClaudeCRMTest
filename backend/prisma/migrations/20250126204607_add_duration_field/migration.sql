/*
  Warnings:

  - You are about to alter the column `area` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT,
    "bookingId" INTEGER NOT NULL,
    CONSTRAINT "ServiceItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "area" INTEGER NOT NULL,
    "dateTime" DATETIME NOT NULL,
    "price" REAL NOT NULL,
    "cleaningType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 2,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("area", "cleaningType", "customerId", "dateTime", "id", "price", "reminderSent") SELECT "area", "cleaningType", "customerId", "dateTime", "id", "price", "reminderSent" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
