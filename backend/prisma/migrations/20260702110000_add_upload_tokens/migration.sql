CREATE TABLE "UploadToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'upload',
    "revokedAt" DATETIME,
    "lastUsedAt" DATETIME,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "UploadToken_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UploadToken_tokenHash_key" ON "UploadToken"("tokenHash");
CREATE INDEX "UploadToken_creatorId_idx" ON "UploadToken"("creatorId");
