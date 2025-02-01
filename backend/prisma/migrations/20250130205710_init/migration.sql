/*
  Warnings:

  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Communication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customerId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    CONSTRAINT "Communication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Communication_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL DEFAULT 'Your Company Name',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "emailSettings" JSONB NOT NULL,
    "baseRate" REAL NOT NULL DEFAULT 0,
    "workingHours" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("area", "cleaningType", "createdAt", "customerId", "dateTime", "duration", "id", "price", "reminderSent", "updatedAt") SELECT "area", "cleaningType", "createdAt", "customerId", "dateTime", "duration", "id", "price", "reminderSent", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE TABLE "new_Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "lastService" DATETIME,
    "nextService" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "email", "id", "name", "phone") SELECT "address", "email", "id", "name", "phone" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
