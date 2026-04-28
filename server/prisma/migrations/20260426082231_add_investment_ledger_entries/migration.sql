-- CreateTable
CREATE TABLE "InvestmentLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0.0,
    "grams" REAL NOT NULL DEFAULT 0.0,
    "margin" REAL NOT NULL DEFAULT 0.0,
    "referenceId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestmentLedgerEntry_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InvestmentLedgerEntry_partnerId_idx" ON "InvestmentLedgerEntry"("partnerId");

-- CreateIndex
CREATE INDEX "InvestmentLedgerEntry_type_idx" ON "InvestmentLedgerEntry"("type");

-- CreateIndex
CREATE INDEX "InvestmentLedgerEntry_createdAt_idx" ON "InvestmentLedgerEntry"("createdAt");
