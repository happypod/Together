-- CreateEnum
CREATE TYPE "MouStatus" AS ENUM ('ACTIVE', 'RENEWAL_DUE', 'EXPIRED', 'TERMINATED');

-- CreateTable
CREATE TABLE "MouRecord" (
    "id" UUID NOT NULL,
    "organizationName" TEXT NOT NULL,
    "partnerType" TEXT,
    "signedAt" DATE NOT NULL,
    "startAt" DATE,
    "endAt" DATE,
    "status" "MouStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopeSummary" TEXT,
    "documentUrl" TEXT,
    "documentLabel" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MouRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MouRecord_signedAt_idx" ON "MouRecord"("signedAt");

-- CreateIndex
CREATE INDEX "MouRecord_status_idx" ON "MouRecord"("status");

-- CreateIndex
CREATE INDEX "MouRecord_organizationName_idx" ON "MouRecord"("organizationName");

-- CreateIndex
CREATE INDEX "MouRecord_createdByUserId_idx" ON "MouRecord"("createdByUserId");

-- AddForeignKey
ALTER TABLE "MouRecord" ADD CONSTRAINT "MouRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
