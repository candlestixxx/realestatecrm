-- Per-realtor MLS connection (Realcomp), encrypted secret at rest.
CREATE TABLE "MlsCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'realcomp',
    "mlsUsername" TEXT NOT NULL,
    "secretEnc" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved_unverified',
    "lastTestedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "MlsCredential_userId_provider_key" ON "MlsCredential"("userId", "provider");
CREATE INDEX "MlsCredential_workspaceId_idx" ON "MlsCredential"("workspaceId");