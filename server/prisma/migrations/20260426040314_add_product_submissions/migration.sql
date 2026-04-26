-- CreateTable
CREATE TABLE "ProductSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" REAL NOT NULL,
    "purity" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0.0,
    "lockDuration" INTEGER NOT NULL DEFAULT 15,
    "hidePrice" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "productId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSubmission_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductSubmission_vendorId_idx" ON "ProductSubmission"("vendorId");

-- CreateIndex
CREATE INDEX "ProductSubmission_status_idx" ON "ProductSubmission"("status");
