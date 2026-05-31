-- 참여자 정서회복 만족도 설문: 정서회복 항목 추가 및 상세 만족도 항목 선택값 완화
-- AlterTable
ALTER TABLE "SatisfactionSurvey" ADD COLUMN "emotionalRecovery" INTEGER;
ALTER TABLE "SatisfactionSurvey" ADD COLUMN "collectedVia" TEXT NOT NULL DEFAULT 'operator';

ALTER TABLE "SatisfactionSurvey" ALTER COLUMN "linkerSatisfaction" DROP NOT NULL;
ALTER TABLE "SatisfactionSurvey" ALTER COLUMN "taxiSatisfaction" DROP NOT NULL;
ALTER TABLE "SatisfactionSurvey" ALTER COLUMN "costBurdenFeeling" DROP NOT NULL;
