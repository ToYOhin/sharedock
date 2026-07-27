CREATE TABLE "CleanupLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deletedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "details" TEXT
);

CREATE INDEX "CleanupLog_createdAt_idx" ON "CleanupLog"("createdAt");
CREATE INDEX "CleanupLog_jobName_idx" ON "CleanupLog"("jobName");
