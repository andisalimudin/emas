-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN "investmentTotal" REAL NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "InvestmentSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "capitalAmount" REAL NOT NULL DEFAULT 0.0,
    "transferAmount" REAL NOT NULL DEFAULT 0.0,
    "reference" TEXT,
    "bankName" TEXT,
    "proofUrl" TEXT,
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestmentSubmission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvestmentSubmission_partnerId_idx" ON "InvestmentSubmission"("partnerId");

-- CreateIndex
CREATE INDEX "InvestmentSubmission_status_idx" ON "InvestmentSubmission"("status");
