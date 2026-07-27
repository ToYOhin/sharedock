-- CreateTable
CREATE TABLE "ShareTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    CONSTRAINT "ShareTag_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareTag_shareId_name_key" ON "ShareTag"("shareId", "name");

-- CreateIndex
CREATE INDEX "ShareTag_name_idx" ON "ShareTag"("name");
