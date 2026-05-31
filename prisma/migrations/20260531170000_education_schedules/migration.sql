CREATE TYPE "EducationScheduleStatus" AS ENUM ('OPEN', 'PRE_APPLY', 'CLOSED', 'COMPLETED');

CREATE TABLE "EducationSchedule" (
    "id" UUID NOT NULL,
    "courseType" "EducationCourseType" NOT NULL,
    "title" TEXT NOT NULL,
    "scheduleDate" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "status" "EducationScheduleStatus" NOT NULL DEFAULT 'OPEN',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EducationSchedule_scheduleDate_idx" ON "EducationSchedule"("scheduleDate");
CREATE INDEX "EducationSchedule_courseType_idx" ON "EducationSchedule"("courseType");
CREATE INDEX "EducationSchedule_status_idx" ON "EducationSchedule"("status");
CREATE INDEX "EducationSchedule_isVisible_scheduleDate_idx" ON "EducationSchedule"("isVisible", "scheduleDate");
CREATE INDEX "EducationSchedule_createdByUserId_idx" ON "EducationSchedule"("createdByUserId");

ALTER TABLE "EducationSchedule" ADD CONSTRAINT "EducationSchedule_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
