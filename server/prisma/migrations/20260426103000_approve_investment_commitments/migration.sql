-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvestmentCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "grams" REAL NOT NULL,
    "basePricePerGram" REAL NOT NULL,
    "marginPerGram" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestmentCommitment_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InvestmentOffer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestmentCommitment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InvestmentCommitment" ("amount", "basePricePerGram", "createdAt", "grams", "id", "marginPerGram", "offerId", "partnerId", "status", "updatedAt") SELECT "amount", "basePricePerGram", "createdAt", "grams", "id", "marginPerGram", "offerId", "partnerId", "status", "updatedAt" FROM "InvestmentCommitment";
DROP TABLE "InvestmentCommitment";
ALTER TABLE "new_InvestmentCommitment" RENAME TO "InvestmentCommitment";
CREATE INDEX "InvestmentCommitment_offerId_idx" ON "InvestmentCommitment"("offerId");
CREATE INDEX "InvestmentCommitment_partnerId_idx" ON "InvestmentCommitment"("partnerId");
CREATE INDEX "InvestmentCommitment_status_idx" ON "InvestmentCommitment"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
