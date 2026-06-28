
-- AlterTable
ALTER TABLE "LandingPage" ADD COLUMN "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LandingPage_customDomain_key" ON "LandingPage"("customDomain");
