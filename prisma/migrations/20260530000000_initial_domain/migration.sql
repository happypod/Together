-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ANCHOR_ADMIN', 'COUNCIL_OPERATOR', 'LINKER', 'TAXI_PARTNER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MobilityPurpose" AS ENUM ('HOSPITAL', 'PHARMACY', 'MARKET', 'PUBLIC_OFFICE', 'FINANCE', 'POST_OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "MobilityStatus" AS ENUM ('REQUESTED', 'RECRUITING', 'GROUP_READY', 'LINKER_RECRUITING', 'LINKER_ASSIGNED', 'TAXI_REQUESTED', 'TAXI_CONFIRMED', 'IN_PROGRESS', 'RETURN_CONFIRMED', 'SETTLED', 'REPORTED', 'CANCELED_BY_RESIDENT', 'CANCELED_BY_OPERATOR', 'CANCELED_BY_TAXI', 'CANCELED_BY_WEATHER', 'CANCELED_BY_OTHER', 'INCIDENT_REPORTED', 'COMPLAINT_REPORTED', 'NO_SHOW', 'PARTIAL_COMPLETED');

-- CreateEnum
CREATE TYPE "LinkerStatus" AS ENUM ('CANDIDATE', 'IN_TRAINING', 'TRAINING_COMPLETED', 'FIELD_PRACTICE_COMPLETED', 'AVAILABLE', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('ACTIVE', 'CANCELED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SettlementMode" AS ENUM ('PILOT', 'SELF_RELIANCE', 'COMMUNITY_SUPPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RoundingPolicy" AS ENUM ('ROUND', 'FLOOR', 'CEIL', 'MANUAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'STATUS_CHANGE', 'ASSIGN', 'UNASSIGN', 'EXPORT_CSV', 'UPLOAD_FILE', 'LOGIN', 'LOGOUT', 'TOKEN_CREATE', 'TOKEN_SUBMIT', 'TOKEN_REVOKE', 'SETTLEMENT_LOCK', 'SETTLEMENT_UNLOCK');

-- CreateEnum
CREATE TYPE "MobileTokenScope" AS ENUM ('REQUEST_INTAKE', 'TRIP_CHECK', 'RETURN_CONFIRM', 'SURVEY_SUBMIT', 'TAXI_CONFIRM');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('RESIDENT_CALL', 'GUARDIAN_CALL', 'LINKER_CALL', 'TAXI_PARTNER_CALL', 'ON_SITE', 'SMS_MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('INCIDENT', 'COMPLAINT', 'LOST_ITEM', 'DELAY', 'RETURN_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunityFundType" AS ENUM ('CONTRIBUTION', 'SUPPORT_RECORD');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('RECEIPT', 'CONSENT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "villageName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "guardianPhone" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilityRequest" (
    "id" UUID NOT NULL,
    "residentId" UUID NOT NULL,
    "desiredDate" DATE NOT NULL,
    "desiredTimeWindow" TEXT NOT NULL,
    "purpose" "MobilityPurpose" NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "needsCompanion" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "status" "MobilityStatus" NOT NULL DEFAULT 'REQUESTED',
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyConsent" BOOLEAN NOT NULL DEFAULT false,
    "sensitiveInfoNotCollected" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MobilityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilityGroup" (
    "id" UUID NOT NULL,
    "groupName" TEXT NOT NULL,
    "serviceDate" DATE NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "destinationSummary" TEXT NOT NULL,
    "returnEta" TIMESTAMP(3),
    "linkerId" UUID,
    "status" "MobilityStatus" NOT NULL DEFAULT 'RECRUITING',
    "exceptionReason" TEXT,
    "notes" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MobilityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilityGroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "residentId" UUID NOT NULL,
    "pickupOrder" INTEGER NOT NULL,
    "pickupEta" TIMESTAMP(3),
    "pickupPlace" TEXT NOT NULL,
    "returnConfirmedAt" TIMESTAMP(3),
    "memberStatus" "GroupMemberStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "MobilityGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Linker" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "villageName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "availableDays" TEXT[],
    "availableTimeWindows" TEXT[],
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "fieldPracticeCompleted" BOOLEAN NOT NULL DEFAULT false,
    "privacyPledgeSigned" BOOLEAN NOT NULL DEFAULT false,
    "insuranceRegistered" BOOLEAN NOT NULL DEFAULT false,
    "status" "LinkerStatus" NOT NULL DEFAULT 'CANDIDATE',
    "activityCount" INTEGER NOT NULL DEFAULT 0,
    "incidentComplaintHistory" TEXT,
    "wantsJobConnection" BOOLEAN NOT NULL DEFAULT false,
    "desiredJobField" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Linker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxiReservation" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partnerManagerName" TEXT,
    "reservationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "vehicleNumber" TEXT,
    "driverPhone" TEXT,
    "expectedFare" INTEGER,
    "actualFare" INTEGER,
    "receiptAttached" BOOLEAN NOT NULL DEFAULT false,
    "receiptUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "TaxiReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripLog" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "status" "MobilityStatus" NOT NULL,
    "linkerBoardedAt" TIMESTAMP(3),
    "resident1BoardedAt" TIMESTAMP(3),
    "resident2BoardedAt" TIMESTAMP(3),
    "resident3BoardedAt" TIMESTAMP(3),
    "arrivedAtDestination" TIMESTAMP(3),
    "serviceTaskConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "returnStartedAt" TIMESTAMP(3),
    "allReturnsConfirmedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "settlementMode" "SettlementMode" NOT NULL DEFAULT 'PILOT',
    "roundingPolicy" "RoundingPolicy" NOT NULL DEFAULT 'FLOOR',
    "totalFare" INTEGER NOT NULL,
    "residentCount" INTEGER NOT NULL,
    "residentTotalShare" INTEGER NOT NULL,
    "residentPerPersonShare" INTEGER NOT NULL,
    "anchorSupportAmount" INTEGER NOT NULL,
    "linkerActivityFee" INTEGER,
    "communityFundSupportAmount" INTEGER,
    "receiptUrl" TEXT,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "settledAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "updatedReason" TEXT,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionSurvey" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "residentId" UUID,
    "userSatisfaction" INTEGER NOT NULL,
    "linkerSatisfaction" INTEGER NOT NULL,
    "taxiSatisfaction" INTEGER NOT NULL,
    "costBurdenFeeling" INTEGER NOT NULL,
    "reuseIntent" INTEGER NOT NULL,
    "inconvenience" TEXT,
    "improvementRequest" TEXT,
    "hasIncident" BOOLEAN NOT NULL DEFAULT false,
    "hasComplaint" BOOLEAN NOT NULL DEFAULT false,
    "issueTypes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "incidentType" "IncidentType" NOT NULL,
    "occurredAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "reportedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityFund" (
    "id" UUID NOT NULL,
    "groupId" UUID,
    "month" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "fundType" "CommunityFundType" NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyResidentCount" INTEGER NOT NULL DEFAULT 0,
    "cumulativeResidentCount" INTEGER NOT NULL DEFAULT 0,
    "linkerActivityCount" INTEGER NOT NULL DEFAULT 0,
    "activeLinkerCount" INTEGER NOT NULL DEFAULT 0,
    "averageFare" INTEGER NOT NULL DEFAULT 0,
    "totalAnchorSupport" INTEGER NOT NULL DEFAULT 0,
    "averageResidentShare" INTEGER NOT NULL DEFAULT 0,
    "estimatedSaving" INTEGER NOT NULL DEFAULT 0,
    "satisfactionAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incidentComplaintCount" INTEGER NOT NULL DEFAULT 0,
    "communityFundAmount" INTEGER NOT NULL DEFAULT 0,
    "jobConsultationCount" INTEGER NOT NULL DEFAULT 0,
    "mouCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessContext" TEXT,
    "note" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileFormToken" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scope" "MobileTokenScope" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUseCount" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileFormToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedByUserId" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ContactLog" (
    "id" UUID NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "contactedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Resident_villageName_idx" ON "Resident"("villageName");

-- CreateIndex
CREATE INDEX "Resident_phone_idx" ON "Resident"("phone");

-- CreateIndex
CREATE INDEX "Resident_deletedAt_idx" ON "Resident"("deletedAt");

-- CreateIndex
CREATE INDEX "MobilityRequest_residentId_idx" ON "MobilityRequest"("residentId");

-- CreateIndex
CREATE INDEX "MobilityRequest_desiredDate_idx" ON "MobilityRequest"("desiredDate");

-- CreateIndex
CREATE INDEX "MobilityRequest_status_idx" ON "MobilityRequest"("status");

-- CreateIndex
CREATE INDEX "MobilityRequest_createdByUserId_idx" ON "MobilityRequest"("createdByUserId");

-- CreateIndex
CREATE INDEX "MobilityRequest_deletedAt_idx" ON "MobilityRequest"("deletedAt");

-- CreateIndex
CREATE INDEX "MobilityGroup_serviceDate_idx" ON "MobilityGroup"("serviceDate");

-- CreateIndex
CREATE INDEX "MobilityGroup_status_idx" ON "MobilityGroup"("status");

-- CreateIndex
CREATE INDEX "MobilityGroup_linkerId_idx" ON "MobilityGroup"("linkerId");

-- CreateIndex
CREATE INDEX "MobilityGroup_createdByUserId_idx" ON "MobilityGroup"("createdByUserId");

-- CreateIndex
CREATE INDEX "MobilityGroup_deletedAt_idx" ON "MobilityGroup"("deletedAt");

-- CreateIndex
CREATE INDEX "MobilityGroupMember_groupId_idx" ON "MobilityGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "MobilityGroupMember_residentId_idx" ON "MobilityGroupMember"("residentId");

-- CreateIndex
CREATE INDEX "MobilityGroupMember_memberStatus_idx" ON "MobilityGroupMember"("memberStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MobilityGroupMember_groupId_pickupOrder_key" ON "MobilityGroupMember"("groupId", "pickupOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MobilityGroupMember_requestId_key" ON "MobilityGroupMember"("requestId");

-- CreateIndex
CREATE INDEX "Linker_villageName_idx" ON "Linker"("villageName");

-- CreateIndex
CREATE INDEX "Linker_phone_idx" ON "Linker"("phone");

-- CreateIndex
CREATE INDEX "Linker_status_idx" ON "Linker"("status");

-- CreateIndex
CREATE INDEX "Linker_deletedAt_idx" ON "Linker"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaxiReservation_groupId_key" ON "TaxiReservation"("groupId");

-- CreateIndex
CREATE INDEX "TripLog_groupId_idx" ON "TripLog"("groupId");

-- CreateIndex
CREATE INDEX "TripLog_status_idx" ON "TripLog"("status");

-- CreateIndex
CREATE INDEX "TripLog_createdByUserId_idx" ON "TripLog"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_groupId_key" ON "Settlement"("groupId");

-- CreateIndex
CREATE INDEX "Settlement_isSettled_idx" ON "Settlement"("isSettled");

-- CreateIndex
CREATE INDEX "Settlement_settledAt_idx" ON "Settlement"("settledAt");

-- CreateIndex
CREATE INDEX "SatisfactionSurvey_groupId_idx" ON "SatisfactionSurvey"("groupId");

-- CreateIndex
CREATE INDEX "SatisfactionSurvey_residentId_idx" ON "SatisfactionSurvey"("residentId");

-- CreateIndex
CREATE INDEX "SatisfactionSurvey_createdAt_idx" ON "SatisfactionSurvey"("createdAt");

-- CreateIndex
CREATE INDEX "IncidentReport_groupId_idx" ON "IncidentReport"("groupId");

-- CreateIndex
CREATE INDEX "IncidentReport_incidentType_idx" ON "IncidentReport"("incidentType");

-- CreateIndex
CREATE INDEX "IncidentReport_reportedByUserId_idx" ON "IncidentReport"("reportedByUserId");

-- CreateIndex
CREATE INDEX "CommunityFund_month_idx" ON "CommunityFund"("month");

-- CreateIndex
CREATE INDEX "CommunityFund_fundType_idx" ON "CommunityFund"("fundType");

-- CreateIndex
CREATE INDEX "CommunityFund_groupId_idx" ON "CommunityFund"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReport_month_key" ON "MonthlyReport"("month");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "FileAttachment_targetType_targetId_idx" ON "FileAttachment"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "FileAttachment_fileType_idx" ON "FileAttachment"("fileType");

-- CreateIndex
CREATE INDEX "FileAttachment_uploadedByUserId_idx" ON "FileAttachment"("uploadedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MobileFormToken_tokenHash_key" ON "MobileFormToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MobileFormToken_scope_idx" ON "MobileFormToken"("scope");

-- CreateIndex
CREATE INDEX "MobileFormToken_targetType_targetId_idx" ON "MobileFormToken"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "MobileFormToken_expiresAt_idx" ON "MobileFormToken"("expiresAt");

-- CreateIndex
CREATE INDEX "MobileFormToken_revokedAt_idx" ON "MobileFormToken"("revokedAt");

-- CreateIndex
CREATE INDEX "ContactLog_targetType_targetId_idx" ON "ContactLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ContactLog_contactType_idx" ON "ContactLog"("contactType");

-- CreateIndex
CREATE INDEX "ContactLog_contactedAt_idx" ON "ContactLog"("contactedAt");

-- CreateIndex
CREATE INDEX "ContactLog_createdByUserId_idx" ON "ContactLog"("createdByUserId");

-- AddForeignKey
ALTER TABLE "MobilityRequest" ADD CONSTRAINT "MobilityRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityRequest" ADD CONSTRAINT "MobilityRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityGroup" ADD CONSTRAINT "MobilityGroup_linkerId_fkey" FOREIGN KEY ("linkerId") REFERENCES "Linker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityGroup" ADD CONSTRAINT "MobilityGroup_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityGroupMember" ADD CONSTRAINT "MobilityGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityGroupMember" ADD CONSTRAINT "MobilityGroupMember_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MobilityRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityGroupMember" ADD CONSTRAINT "MobilityGroupMember_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxiReservation" ADD CONSTRAINT "TaxiReservation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionSurvey" ADD CONSTRAINT "SatisfactionSurvey_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionSurvey" ADD CONSTRAINT "SatisfactionSurvey_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityFund" ADD CONSTRAINT "CommunityFund_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MobilityGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileFormToken" ADD CONSTRAINT "MobileFormToken_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactLog" ADD CONSTRAINT "ContactLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

