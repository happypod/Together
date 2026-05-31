import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  resident: "00000000-0000-4000-8000-000000000002",
  linker: "00000000-0000-4000-8000-000000000003",
  request: "00000000-0000-4000-8000-000000000004",
  group: "00000000-0000-4000-8000-000000000005",
  member: "00000000-0000-4000-8000-000000000006",
  taxi: "00000000-0000-4000-8000-000000000007",
  trip: "00000000-0000-4000-8000-000000000008",
  settlement: "00000000-0000-4000-8000-000000000009",
  survey: "00000000-0000-4000-8000-000000000010",
  fund: "00000000-0000-4000-8000-000000000012",
  file: "00000000-0000-4000-8000-000000000013",
  token: "00000000-0000-4000-8000-000000000014",
  contact: "00000000-0000-4000-8000-000000000015",
  audit: "00000000-0000-4000-8000-000000000016",
};

const serviceDate = new Date("2026-06-03T00:00:00.000Z");
const pickupAt = new Date("2026-06-03T09:00:00.000Z");
const returnedAt = new Date("2026-06-03T13:30:00.000Z");

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

async function main() {
  const initialPasswordHash = await hashPassword(
    process.env.INITIAL_SUPER_ADMIN_PASSWORD ?? "change-me-before-production",
  );

  const admin = await prisma.user.upsert({
    where: { id: ids.admin },
    update: {
      name: "초기 관리자",
      email: process.env.INITIAL_SUPER_ADMIN_EMAIL ?? "admin@example.com",
      passwordHash: initialPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      id: ids.admin,
      name: "초기 관리자",
      email: process.env.INITIAL_SUPER_ADMIN_EMAIL ?? "admin@example.com",
      passwordHash: initialPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const settings = [
    ["defaultFare", 72000, "기본 택시요금"],
    ["defaultResidentCount", 3, "공동예약 기본 주민 수"],
    ["maxGroupResidents", 3, "공동예약 그룹 최대 주민 수"],
    ["fareRoundingPolicy", "FLOOR", "정산 원 단위 처리 기본값"],
    ["mobileTokenTtlHours", 72, "모바일 링크형 입력 토큰 만료 시간"],
    ["reportDateBasis", "serviceDate", "월간 리포트 기준일"],
    ["villages", ["백천마을"], "운영 마을 목록"],
    ["timeWindows", ["오전", "오후"], "운영 시간대 목록"],
  ];

  for (const [key, value, description] of settings) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value, description, updatedByUserId: admin.id },
      create: { key, value, description, updatedByUserId: admin.id },
    });
  }

  const resident = await prisma.resident.upsert({
    where: { id: ids.resident },
    update: {
      name: "홍길순",
      villageName: "백천마을",
      phone: "010-1234-5678",
      guardianPhone: "010-2222-3333",
      memo: "시연용 주민",
    },
    create: {
      id: ids.resident,
      name: "홍길순",
      villageName: "백천마을",
      phone: "010-1234-5678",
      guardianPhone: "010-2222-3333",
      memo: "시연용 주민",
    },
  });

  const linker = await prisma.linker.upsert({
    where: { id: ids.linker },
    update: {
      name: "김동행",
      villageName: "백천마을",
      phone: "010-7777-8888",
      availableDays: ["MON", "WED", "FRI"],
      availableTimeWindows: ["오전"],
      trainingCompleted: true,
      fieldPracticeCompleted: true,
      privacyPledgeSigned: true,
      insuranceRegistered: true,
      status: "AVAILABLE",
    },
    create: {
      id: ids.linker,
      name: "김동행",
      villageName: "백천마을",
      phone: "010-7777-8888",
      availableDays: ["MON", "WED", "FRI"],
      availableTimeWindows: ["오전"],
      trainingCompleted: true,
      fieldPracticeCompleted: true,
      privacyPledgeSigned: true,
      insuranceRegistered: true,
      status: "AVAILABLE",
    },
  });

  const request = await prisma.mobilityRequest.upsert({
    where: { id: ids.request },
    update: {
      residentId: resident.id,
      desiredDate: serviceDate,
      desiredTimeWindow: "오전",
      purpose: "HOSPITAL",
      origin: "백천마을 회관",
      destination: "백천종합병원",
      needsCompanion: true,
      status: "GROUP_READY",
      privacyConsent: true,
      thirdPartyConsent: true,
      sensitiveInfoNotCollected: true,
      createdByUserId: admin.id,
    },
    create: {
      id: ids.request,
      residentId: resident.id,
      desiredDate: serviceDate,
      desiredTimeWindow: "오전",
      purpose: "HOSPITAL",
      origin: "백천마을 회관",
      destination: "백천종합병원",
      needsCompanion: true,
      status: "GROUP_READY",
      privacyConsent: true,
      thirdPartyConsent: true,
      sensitiveInfoNotCollected: true,
      createdByUserId: admin.id,
    },
  });

  const group = await prisma.mobilityGroup.upsert({
    where: { id: ids.group },
    update: {
      groupName: "2026-06-03 오전 병원 이동",
      serviceDate,
      timeWindow: "오전",
      destinationSummary: "백천종합병원",
      linkerId: linker.id,
      status: "RETURN_CONFIRMED",
      createdByUserId: admin.id,
    },
    create: {
      id: ids.group,
      groupName: "2026-06-03 오전 병원 이동",
      serviceDate,
      timeWindow: "오전",
      destinationSummary: "백천종합병원",
      linkerId: linker.id,
      status: "RETURN_CONFIRMED",
      createdByUserId: admin.id,
    },
  });

  await prisma.mobilityGroupMember.upsert({
    where: { id: ids.member },
    update: {
      groupId: group.id,
      requestId: request.id,
      residentId: resident.id,
      pickupOrder: 1,
      pickupEta: pickupAt,
      pickupPlace: "백천마을 회관",
      returnConfirmedAt: returnedAt,
      memberStatus: "ACTIVE",
    },
    create: {
      id: ids.member,
      groupId: group.id,
      requestId: request.id,
      residentId: resident.id,
      pickupOrder: 1,
      pickupEta: pickupAt,
      pickupPlace: "백천마을 회관",
      returnConfirmedAt: returnedAt,
      memberStatus: "ACTIVE",
    },
  });

  await prisma.taxiReservation.upsert({
    where: { id: ids.taxi },
    update: {
      groupId: group.id,
      partnerManagerName: "택시연합 담당자",
      reservationConfirmed: true,
      confirmedAt: new Date("2026-06-02T09:00:00.000Z"),
      expectedFare: 72000,
      actualFare: 72000,
      receiptAttached: true,
      receiptUrl: "https://example.com/receipt/demo",
    },
    create: {
      id: ids.taxi,
      groupId: group.id,
      partnerManagerName: "택시연합 담당자",
      reservationConfirmed: true,
      confirmedAt: new Date("2026-06-02T09:00:00.000Z"),
      expectedFare: 72000,
      actualFare: 72000,
      receiptAttached: true,
      receiptUrl: "https://example.com/receipt/demo",
    },
  });

  await prisma.tripLog.upsert({
    where: { id: ids.trip },
    update: {
      groupId: group.id,
      status: "RETURN_CONFIRMED",
      linkerBoardedAt: pickupAt,
      resident1BoardedAt: pickupAt,
      arrivedAtDestination: new Date("2026-06-03T10:00:00.000Z"),
      serviceTaskConfirmed: true,
      returnStartedAt: new Date("2026-06-03T12:30:00.000Z"),
      allReturnsConfirmedAt: returnedAt,
      createdByUserId: admin.id,
    },
    create: {
      id: ids.trip,
      groupId: group.id,
      status: "RETURN_CONFIRMED",
      linkerBoardedAt: pickupAt,
      resident1BoardedAt: pickupAt,
      arrivedAtDestination: new Date("2026-06-03T10:00:00.000Z"),
      serviceTaskConfirmed: true,
      returnStartedAt: new Date("2026-06-03T12:30:00.000Z"),
      allReturnsConfirmedAt: returnedAt,
      createdByUserId: admin.id,
    },
  });

  await prisma.settlement.upsert({
    where: { id: ids.settlement },
    update: {
      groupId: group.id,
      settlementMode: "PILOT",
      roundingPolicy: "FLOOR",
      totalFare: 72000,
      residentCount: 1,
      residentTotalShare: 24000,
      residentPerPersonShare: 24000,
      anchorSupportAmount: 48000,
      linkerActivityFee: 20000,
      receiptUrl: "https://example.com/receipt/demo",
      isSettled: true,
      settledAt: returnedAt,
    },
    create: {
      id: ids.settlement,
      groupId: group.id,
      settlementMode: "PILOT",
      roundingPolicy: "FLOOR",
      totalFare: 72000,
      residentCount: 1,
      residentTotalShare: 24000,
      residentPerPersonShare: 24000,
      anchorSupportAmount: 48000,
      linkerActivityFee: 20000,
      receiptUrl: "https://example.com/receipt/demo",
      isSettled: true,
      settledAt: returnedAt,
    },
  });

  await prisma.fileAttachment.upsert({
    where: { id: ids.file },
    update: {
      targetType: "Settlement",
      targetId: ids.settlement,
      fileType: "RECEIPT",
      fileName: "demo-receipt.pdf",
      mimeType: "application/pdf",
      sizeBytes: 256000,
      url: "https://example.com/receipt/demo",
      uploadedByUserId: admin.id,
    },
    create: {
      id: ids.file,
      targetType: "Settlement",
      targetId: ids.settlement,
      fileType: "RECEIPT",
      fileName: "demo-receipt.pdf",
      mimeType: "application/pdf",
      sizeBytes: 256000,
      url: "https://example.com/receipt/demo",
      uploadedByUserId: admin.id,
    },
  });

  await prisma.mobileFormToken.upsert({
    where: { id: ids.token },
    update: {
      tokenHash: "seed-token-hash-placeholder",
      scope: "RETURN_CONFIRM",
      targetType: "MobilityGroup",
      targetId: group.id,
      expiresAt: new Date("2026-06-06T00:00:00.000Z"),
      maxUseCount: 1,
      usedCount: 0,
      createdByUserId: admin.id,
    },
    create: {
      id: ids.token,
      tokenHash: "seed-token-hash-placeholder",
      scope: "RETURN_CONFIRM",
      targetType: "MobilityGroup",
      targetId: group.id,
      expiresAt: new Date("2026-06-06T00:00:00.000Z"),
      maxUseCount: 1,
      usedCount: 0,
      createdByUserId: admin.id,
    },
  });

  await prisma.contactLog.upsert({
    where: { id: ids.contact },
    update: {
      targetType: "MobilityGroup",
      targetId: group.id,
      contactType: "RESIDENT_CALL",
      contactedAt: new Date("2026-06-02T08:40:00.000Z"),
      summary: "이동 일정과 픽업 장소를 확인함",
      createdByUserId: admin.id,
    },
    create: {
      id: ids.contact,
      targetType: "MobilityGroup",
      targetId: group.id,
      contactType: "RESIDENT_CALL",
      contactedAt: new Date("2026-06-02T08:40:00.000Z"),
      summary: "이동 일정과 픽업 장소를 확인함",
      createdByUserId: admin.id,
    },
  });

  await prisma.satisfactionSurvey.upsert({
    where: { id: ids.survey },
    update: {
      groupId: group.id,
      residentId: resident.id,
      emotionalRecovery: 5,
      userSatisfaction: 5,
      linkerSatisfaction: 5,
      taxiSatisfaction: 5,
      costBurdenFeeling: 2,
      reuseIntent: 5,
      collectedVia: "operator",
      hasIncident: false,
      hasComplaint: false,
      issueTypes: [],
    },
    create: {
      id: ids.survey,
      groupId: group.id,
      residentId: resident.id,
      emotionalRecovery: 5,
      userSatisfaction: 5,
      linkerSatisfaction: 5,
      taxiSatisfaction: 5,
      costBurdenFeeling: 2,
      reuseIntent: 5,
      collectedVia: "operator",
      hasIncident: false,
      hasComplaint: false,
      issueTypes: [],
    },
  });

  await prisma.communityFund.upsert({
    where: { id: ids.fund },
    update: {
      groupId: group.id,
      month: "2026-06",
      amount: 48000,
      fundType: "SUPPORT_RECORD",
      source: "백천만 앵커",
      note: "시연용 이동지원비 기록",
    },
    create: {
      id: ids.fund,
      groupId: group.id,
      month: "2026-06",
      amount: 48000,
      fundType: "SUPPORT_RECORD",
      source: "백천만 앵커",
      note: "시연용 이동지원비 기록",
    },
  });

  await prisma.monthlyReport.upsert({
    where: { month: "2026-06" },
    update: {
      tripCount: 1,
      monthlyResidentCount: 1,
      cumulativeResidentCount: 1,
      linkerActivityCount: 1,
      activeLinkerCount: 1,
      averageFare: 72000,
      totalAnchorSupport: 48000,
      averageResidentShare: 24000,
      satisfactionAverage: 5,
      incidentComplaintCount: 0,
    },
    create: {
      month: "2026-06",
      tripCount: 1,
      monthlyResidentCount: 1,
      cumulativeResidentCount: 1,
      linkerActivityCount: 1,
      activeLinkerCount: 1,
      averageFare: 72000,
      totalAnchorSupport: 48000,
      averageResidentShare: 24000,
      satisfactionAverage: 5,
      incidentComplaintCount: 0,
    },
  });

  await prisma.auditLog.upsert({
    where: { id: ids.audit },
    update: {
      userId: admin.id,
      action: "CREATE",
      targetType: "Seed",
      targetId: ids.group,
      note: "초기 시드 데이터 생성",
    },
    create: {
      id: ids.audit,
      userId: admin.id,
      action: "CREATE",
      targetType: "Seed",
      targetId: ids.group,
      note: "초기 시드 데이터 생성",
    },
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
