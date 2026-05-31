CREATE TYPE "EducationCourseType" AS ENUM ('COLLECTIVE', 'LINKER_QUALIFICATION');

CREATE TYPE "EducationParticipantType" AS ENUM ('RESIDENT', 'COMPANION', 'LINKER');

CREATE TYPE "EducationApplicationStatus" AS ENUM ('RECEIVED', 'CONFIRMED', 'COMPLETED', 'CANCELED');

CREATE TABLE "EducationApplication" (
    "id" UUID NOT NULL,
    "receiptCode" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "villageName" TEXT,
    "participantType" "EducationParticipantType" NOT NULL,
    "courseType" "EducationCourseType" NOT NULL,
    "preferredDate" DATE NOT NULL,
    "notes" TEXT,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT true,
    "educationRuleConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "status" "EducationApplicationStatus" NOT NULL DEFAULT 'RECEIVED',
    "operatorMemo" TEXT,
    "handledByUserId" UUID,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducationApplication_receiptCode_key" ON "EducationApplication"("receiptCode");
CREATE INDEX "EducationApplication_status_idx" ON "EducationApplication"("status");
CREATE INDEX "EducationApplication_courseType_idx" ON "EducationApplication"("courseType");
CREATE INDEX "EducationApplication_preferredDate_idx" ON "EducationApplication"("preferredDate");
CREATE INDEX "EducationApplication_createdAt_idx" ON "EducationApplication"("createdAt");
CREATE INDEX "EducationApplication_handledByUserId_idx" ON "EducationApplication"("handledByUserId");

ALTER TABLE "EducationApplication" ADD CONSTRAINT "EducationApplication_handledByUserId_fkey"
    FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
