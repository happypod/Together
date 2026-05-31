-- Notice: 공지사항 모델
CREATE TYPE "NoticeType" AS ENUM ('GENERAL', 'OPERATION', 'SAFETY', 'PRIVACY');

CREATE TABLE "Notice" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "noticeType" "NoticeType" NOT NULL DEFAULT 'GENERAL',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE,
    "endDate" DATE,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notice_noticeType_idx" ON "Notice"("noticeType");
CREATE INDEX "Notice_isPinned_isVisible_idx" ON "Notice"("isPinned", "isVisible");
CREATE INDEX "Notice_createdAt_idx" ON "Notice"("createdAt");

ALTER TABLE "Notice" ADD CONSTRAINT "Notice_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PublicFeedback: 공개 이용 소감
CREATE TYPE "PublicFeedbackSource" AS ENUM ('RESIDENT', 'GUARDIAN', 'LINKER', 'OPERATOR');

CREATE TABLE "PublicFeedback" (
    "id" UUID NOT NULL,
    "sourceType" "PublicFeedbackSource" NOT NULL,
    "villageLabel" TEXT,
    "roleLabel" TEXT,
    "content" TEXT NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "approvedByUserId" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicFeedback_isApproved_isVisible_idx" ON "PublicFeedback"("isApproved", "isVisible");
CREATE INDEX "PublicFeedback_sourceType_idx" ON "PublicFeedback"("sourceType");
CREATE INDEX "PublicFeedback_createdAt_idx" ON "PublicFeedback"("createdAt");

ALTER TABLE "PublicFeedback" ADD CONSTRAINT "PublicFeedback_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
