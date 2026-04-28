-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN "investmentBalance" REAL NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "InvestmentOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "baseCategory" TEXT NOT NULL DEFAULT 'Gold Bar',
    "gramsTotal" REAL NOT NULL,
    "gramsRemaining" REAL NOT NULL,
    "marginPerGram" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InvestmentCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "grams" REAL NOT NULL,
    "basePricePerGram" REAL NOT NULL,
    "marginPerGram" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestmentCommitment_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InvestmentOffer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestmentCommitment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvestmentOffer_status_idx" ON "InvestmentOffer"("status");

-- CreateIndex
CREATE INDEX "InvestmentCommitment_offerId_idx" ON "InvestmentCommitment"("offerId");

-- CreateIndex
CREATE INDEX "InvestmentCommitment_partnerId_idx" ON "InvestmentCommitment"("partnerId");
