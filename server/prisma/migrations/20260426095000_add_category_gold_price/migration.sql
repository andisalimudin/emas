-- CreateTable
CREATE TABLE "CategoryGoldPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricePerGram" REAL NOT NULL DEFAULT 0.0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryGoldPrice_key_key" ON "CategoryGoldPrice"("key");
