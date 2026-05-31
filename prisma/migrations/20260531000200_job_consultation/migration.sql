-- CreateEnum
CREATE TYPE "JobConsultationTargetType" AS ENUM ('LINKER', 'RESIDENT');

-- CreateEnum
CREATE TYPE "JobConsultationStatus" AS ENUM ('REQUESTED', 'IN_PROGRESS', 'CONNECTED', 'CLOSED');

-- CreateTable
CREATE TABLE "JobConsultation" (
    "id" UUID NOT NULL,
    "targetType" "JobConsultationTargetType" NOT NULL,
    "linkerId" UUID,
    "residentId" UUID,
    "field" TEXT NOT NULL,
    "status" "JobConsultationStatus" NOT NULL DEFAULT 'REQUESTED',
    "consultedAt" DATE NOT NULL,
    "organization" TEXT,
    "supportSummary" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobConsultation_consultedAt_idx" ON "JobConsultation"("consultedAt");

-- CreateIndex
CREATE INDEX "JobConsultation_targetType_idx" ON "JobConsultation"("targetType");

-- CreateIndex
CREATE INDEX "JobConsultation_status_idx" ON "JobConsultation"("status");

-- CreateIndex
CREATE INDEX "JobConsultation_linkerId_idx" ON "JobConsultation"("linkerId");

-- CreateIndex
CREATE INDEX "JobConsultation_residentId_idx" ON "JobConsultation"("residentId");

-- CreateIndex
CREATE INDEX "JobConsultation_createdByUserId_idx" ON "JobConsultation"("createdByUserId");

-- AddForeignKey
ALTER TABLE "JobConsultation" ADD CONSTRAINT "JobConsultation_linkerId_fkey" FOREIGN KEY ("linkerId") REFERENCES "Linker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobConsultation" ADD CONSTRAINT "JobConsultation_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobConsultation" ADD CONSTRAINT "JobConsultation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "JobConsultation" ADD CONSTRAINT "JobConsultation_target_check" CHECK (
    ("targetType" = 'LINKER' AND "linkerId" IS NOT NULL AND "residentId" IS NULL)
    OR ("targetType" = 'RESIDENT' AND "residentId" IS NOT NULL AND "linkerId" IS NULL)
);
