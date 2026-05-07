-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STORE_MANAGER',
    "storeId" TEXT,
    CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReplenishmentRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantityNeeded" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '公斤',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReplenishmentRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReplenishmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fulfillment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "orderDate" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "kg" REAL,
    "caseSpec" TEXT,
    "caseCount" INTEGER,
    "orderNotes" TEXT,
    CONSTRAINT "Fulfillment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReplenishmentRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "arrivalDate" TEXT NOT NULL,
    "actualQuantity" REAL NOT NULL,
    "feedback" TEXT NOT NULL,
    CONSTRAINT "Receipt_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReplenishmentRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_name_key" ON "Store"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Fulfillment_requestId_key" ON "Fulfillment"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_requestId_key" ON "Receipt"("requestId");
