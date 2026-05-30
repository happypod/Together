import { Prisma, type MobileFormToken } from "@prisma/client";
import {
  assertPermission,
  AuthorizationError,
  type AuthUser,
} from "@/domain/auth/permissions";
import {
  LINKER_STATUS_LABELS,
  MOBILITY_STATUS_LABELS,
  type LinkerStatus,
  type MobilityStatus,
  type UserRole,
} from "@/domain/definitions";
import { maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import {
  assertMobileFieldsAllowed,
  validateMobileFormToken,
} from "@/server/mobile-forms/token-service";

export type LinkerListFilters = {
  query?: string;
  status?: string;
};

export type TripGroupFilters = {
  query?: string;
  serviceDate?: string;
  status?: string;
};

export type LinkerListItem = {
  id: string;
  name: string;
  villageName: string;
  phoneMasked: string;
  availableDays: string[];
  availableTimeWindows: string[];
  trainingCompleted: boolean;
  fieldPracticeCompleted: boolean;
  privacyPledgeSigned: boolean;
  insuranceRegistered: boolean;
  readyForAssignment: boolean;
  status: LinkerStatus;
  statusLabel: string;
  activityCount: number;
  incidentComplaintHistory: string;
  wantsJobConnection: boolean;
  desiredJobField: string;
};

export type LinkerOption = {
  id: string;
  name: string;
  phoneMasked: string;
  statusLabel: string;
  summary: string;
};

export type TripMemberItem = {
  id: string;
  residentName: string;
  phoneMasked: string;
  pickupOrder: number;
  pickupPlace: string;
  pickupEta: string;
  returnConfirmedAt: string;
};

export type TaxiReservationItem = {
  id: string;
  requestedAt: string;
  partnerManagerName: string;
  reservationConfirmed: boolean;
  confirmedAt: string;
  vehicleNumber: string;
  driverPhoneMasked: string;
  expectedFare: number | null;
  actualFare: number | null;
  receiptAttached: boolean;
  receiptUrl: string;
  notes: string;
};

export type TripLogItem = {
  id: string;
  status: MobilityStatus;
  statusLabel: string;
  linkerBoardedAt: string;
  resident1BoardedAt: string;
  resident2BoardedAt: string;
  resident3BoardedAt: string;
  arrivedAtDestination: string;
  serviceTaskConfirmed: boolean;
  returnStartedAt: string;
  allReturnsConfirmedAt: string;
  notes: string;
};

export type TripStep =
  | "linkerBoarded"
  | "resident1Boarded"
  | "resident2Boarded"
  | "resident3Boarded"
  | "arrivedAtDestination"
  | "serviceTaskConfirmed"
  | "returnStarted";

export type TripGroupListItem = {
  id: string;
  groupName: string;
  serviceDate: string;
  timeWindow: string;
  destinationSummary: string;
  returnEta: string;
  status: MobilityStatus;
  statusLabel: string;
  linker: {
    id: string;
    name: string;
    phoneMasked: string;
    statusLabel: string;
  } | null;
  memberCount: number;
  members: TripMemberItem[];
  taxiReservation: TaxiReservationItem | null;
  tripLog: TripLogItem | null;
  availableTripSteps: TripStep[];
};

export type CreateLinkerInput = {
  name?: string;
  villageName?: string;
  phone?: string;
  availableDays?: string[];
  availableTimeWindows?: string[];
  trainingCompleted?: boolean;
  fieldPracticeCompleted?: boolean;
  privacyPledgeSigned?: boolean;
  insuranceRegistered?: boolean;
  status?: string;
  incidentComplaintHistory?: string;
  wantsJobConnection?: boolean;
  desiredJobField?: string;
};

export type UpdateLinkerStatusInput = {
  linkerId: string;
  status: string;
};

export type AssignLinkerInput = {
  groupId: string;
  linkerId: string;
};

export type RequestTaxiReservationInput = {
  groupId: string;
  partnerManagerName?: string;
  notes?: string;
};

export type ConfirmTaxiReservationInput = {
  groupId: string;
  reservationConfirmed?: boolean;
  confirmedAt?: string;
  partnerManagerName?: string;
  vehicleNumber?: string;
  driverPhone?: string;
  expectedFare?: string | number | null;
  actualFare?: string | number | null;
  receiptAttached?: boolean;
  receiptUrl?: string;
  notes?: string;
};

export type UpdateTripStatusInput = {
  groupId: string;
  step: string;
  notes?: string;
};

export type ConfirmReturnInput = {
  groupId: string;
  memberId?: string;
  confirmAll?: boolean;
  notes?: string;
};

const assignmentReadyStatuses = new Set<LinkerStatus>(["AVAILABLE", "ACTIVE"]);
const operationalRoles = new Set<UserRole>([
  "SUPER_ADMIN",
  "ANCHOR_ADMIN",
  "COUNCIL_OPERATOR",
]);
const taxiManagedStatuses = new Set<MobilityStatus>(["LINKER_ASSIGNED", "TAXI_REQUESTED"]);
const activeTripStatuses = new Set<MobilityStatus>(["TAXI_CONFIRMED", "IN_PROGRESS"]);

const tripStepLabels: Record<TripStep, string> = {
  linkerBoarded: "동행링커 탑승",
  resident1Boarded: "1번 주민 탑승",
  resident2Boarded: "2번 주민 탑승",
  resident3Boarded: "3번 주민 탑승",
  arrivedAtDestination: "목적지 도착",
  serviceTaskConfirmed: "생활업무 완료",
  returnStarted: "귀가 출발",
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function optionalCleanText(value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  return text.length > 0 ? text : undefined;
}

function requireText(label: string, value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  if (!text) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return text;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function parseDateOnly(value: unknown) {
  const text = requireText("운행일", value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("운행일은 YYYY-MM-DD 형식이어야 합니다.");
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("운행일을 다시 확인해 주세요.");
  }
  return date;
}

function parseOptionalDateTime(value: unknown) {
  const text = optionalCleanText(value, 32);
  if (!text) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error("시간 값을 다시 확인해 주세요.");
  }
  return date;
}

function parseNonNegativeInteger(label: string, value: unknown) {
  const text = optionalCleanText(value, 20);
  if (!text) {
    return undefined;
  }
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label}은 0 이상의 정수로 입력해 주세요.`);
  }
  return number;
}

function parseMobilityStatus(value: unknown): MobilityStatus {
  const status = requireText("상태", value, 40) as MobilityStatus;
  if (!(status in MOBILITY_STATUS_LABELS)) {
    throw new Error("상태 값을 다시 선택해 주세요.");
  }
  return status;
}

function parseLinkerStatus(value: unknown): LinkerStatus {
  const status = requireText("링커 상태", value, 40) as LinkerStatus;
  if (!(status in LINKER_STATUS_LABELS)) {
    throw new Error("링커 상태를 다시 선택해 주세요.");
  }
  return status;
}

function parseTripStep(value: unknown): TripStep {
  const step = requireText("운행 단계", value, 40) as TripStep;
  if (!(step in tripStepLabels)) {
    throw new Error("운행 단계를 다시 선택해 주세요.");
  }
  return step;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeInput(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}

function formatDateTimeDisplay(date?: Date | null) {
  return date ? date.toLocaleString("ko-KR") : "";
}

function normalizePhone(phone?: string | null) {
  return String(phone ?? "").replace(/\D/g, "");
}

function isAssignmentReady(linker: {
  status: LinkerStatus;
  trainingCompleted: boolean;
  fieldPracticeCompleted: boolean;
  privacyPledgeSigned: boolean;
  insuranceRegistered: boolean;
}) {
  return (
    assignmentReadyStatuses.has(linker.status) &&
    linker.trainingCompleted &&
    linker.fieldPracticeCompleted &&
    linker.privacyPledgeSigned &&
    linker.insuranceRegistered
  );
}

function assertOperationalUser(user: AuthUser, message = "운영자만 처리할 수 있습니다.") {
  if (!user.isActive || !operationalRoles.has(user.role)) {
    throw new AuthorizationError(message);
  }
}

async function getActorProfile(tx: Prisma.TransactionClient, userId: string) {
  const actor = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, role: true, isActive: true },
  });
  if (!actor?.isActive) {
    throw new AuthorizationError();
  }
  return actor;
}

type LinkerRecord = Prisma.LinkerGetPayload<Record<string, never>>;

function toLinkerItem(linker: LinkerRecord): LinkerListItem {
  return {
    id: linker.id,
    name: linker.name,
    villageName: linker.villageName,
    phoneMasked: maskPhone(linker.phone),
    availableDays: linker.availableDays,
    availableTimeWindows: linker.availableTimeWindows,
    trainingCompleted: linker.trainingCompleted,
    fieldPracticeCompleted: linker.fieldPracticeCompleted,
    privacyPledgeSigned: linker.privacyPledgeSigned,
    insuranceRegistered: linker.insuranceRegistered,
    readyForAssignment: isAssignmentReady(linker),
    status: linker.status,
    statusLabel: LINKER_STATUS_LABELS[linker.status],
    activityCount: linker.activityCount,
    incidentComplaintHistory: linker.incidentComplaintHistory ?? "",
    wantsJobConnection: linker.wantsJobConnection,
    desiredJobField: linker.desiredJobField ?? "",
  };
}

function toLinkerOption(linker: LinkerRecord): LinkerOption {
  return {
    id: linker.id,
    name: linker.name,
    phoneMasked: maskPhone(linker.phone),
    statusLabel: LINKER_STATUS_LABELS[linker.status],
    summary: `${linker.villageName} · ${linker.availableDays.join(", ") || "요일 미정"} · ${
      linker.availableTimeWindows.join(", ") || "시간 미정"
    }`,
  };
}

type TripGroupRecord = Prisma.MobilityGroupGetPayload<{
  include: {
    linker: true;
    members: {
      include: {
        resident: {
          select: {
            name: true;
            phone: true;
          };
        };
      };
    };
    taxiReservation: true;
    tripLogs: true;
  };
}>;

function countActiveMembers(group: Pick<TripGroupRecord, "members">) {
  return group.members.filter((member) => member.memberStatus === "ACTIVE").length;
}

function requiredResidentBoardingFields(memberCount: number) {
  return [
    "resident1BoardedAt",
    memberCount >= 2 ? "resident2BoardedAt" : null,
    memberCount >= 3 ? "resident3BoardedAt" : null,
  ].filter((field): field is "resident1BoardedAt" | "resident2BoardedAt" | "resident3BoardedAt" =>
    Boolean(field),
  );
}

function getLatestTripLog(group: Pick<TripGroupRecord, "tripLogs">) {
  return [...group.tripLogs].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
}

function toTripGroupItem(group: TripGroupRecord): TripGroupListItem {
  const latestTripLog = getLatestTripLog(group);
  const memberCount = countActiveMembers(group);

  return {
    id: group.id,
    groupName: group.groupName,
    serviceDate: formatDateOnly(group.serviceDate),
    timeWindow: group.timeWindow,
    destinationSummary: group.destinationSummary,
    returnEta: formatDateTimeInput(group.returnEta),
    status: group.status,
    statusLabel: MOBILITY_STATUS_LABELS[group.status],
    linker: group.linker
      ? {
          id: group.linker.id,
          name: group.linker.name,
          phoneMasked: maskPhone(group.linker.phone),
          statusLabel: LINKER_STATUS_LABELS[group.linker.status],
        }
      : null,
    memberCount,
    members: group.members.map((member) => ({
      id: member.id,
      residentName: member.resident.name,
      phoneMasked: maskPhone(member.resident.phone),
      pickupOrder: member.pickupOrder,
      pickupPlace: member.pickupPlace,
      pickupEta: formatDateTimeInput(member.pickupEta),
      returnConfirmedAt: formatDateTimeInput(member.returnConfirmedAt),
    })),
    taxiReservation: group.taxiReservation
      ? {
          id: group.taxiReservation.id,
          requestedAt: formatDateTimeDisplay(group.taxiReservation.requestedAt),
          partnerManagerName: group.taxiReservation.partnerManagerName ?? "",
          reservationConfirmed: group.taxiReservation.reservationConfirmed,
          confirmedAt: formatDateTimeInput(group.taxiReservation.confirmedAt),
          vehicleNumber: group.taxiReservation.vehicleNumber ?? "",
          driverPhoneMasked: maskPhone(group.taxiReservation.driverPhone ?? ""),
          expectedFare: group.taxiReservation.expectedFare,
          actualFare: group.taxiReservation.actualFare,
          receiptAttached: group.taxiReservation.receiptAttached,
          receiptUrl: group.taxiReservation.receiptUrl ?? "",
          notes: group.taxiReservation.notes ?? "",
        }
      : null,
    tripLog: latestTripLog
      ? {
          id: latestTripLog.id,
          status: latestTripLog.status,
          statusLabel: MOBILITY_STATUS_LABELS[latestTripLog.status],
          linkerBoardedAt: formatDateTimeInput(latestTripLog.linkerBoardedAt),
          resident1BoardedAt: formatDateTimeInput(latestTripLog.resident1BoardedAt),
          resident2BoardedAt: formatDateTimeInput(latestTripLog.resident2BoardedAt),
          resident3BoardedAt: formatDateTimeInput(latestTripLog.resident3BoardedAt),
          arrivedAtDestination: formatDateTimeInput(latestTripLog.arrivedAtDestination),
          serviceTaskConfirmed: latestTripLog.serviceTaskConfirmed,
          returnStartedAt: formatDateTimeInput(latestTripLog.returnStartedAt),
          allReturnsConfirmedAt: formatDateTimeInput(latestTripLog.allReturnsConfirmedAt),
          notes: latestTripLog.notes ?? "",
        }
      : null,
    availableTripSteps: getAvailableTripSteps(group, latestTripLog, memberCount),
  };
}

function getAvailableTripSteps(
  group: Pick<TripGroupRecord, "status">,
  tripLog: ReturnType<typeof getLatestTripLog>,
  memberCount: number,
): TripStep[] {
  if (!activeTripStatuses.has(group.status)) {
    return [];
  }
  if (!tripLog?.linkerBoardedAt) {
    return ["linkerBoarded"];
  }
  if (!tripLog.resident1BoardedAt) {
    return ["resident1Boarded"];
  }
  if (memberCount >= 2 && !tripLog.resident2BoardedAt) {
    return ["resident2Boarded"];
  }
  if (memberCount >= 3 && !tripLog.resident3BoardedAt) {
    return ["resident3Boarded"];
  }
  if (!tripLog.arrivedAtDestination) {
    return ["arrivedAtDestination"];
  }
  if (!tripLog.serviceTaskConfirmed) {
    return ["serviceTaskConfirmed"];
  }
  if (!tripLog.returnStartedAt) {
    return ["returnStarted"];
  }
  return [];
}

async function findGroupForTrip(tx: Prisma.TransactionClient, groupId: string) {
  const group = await tx.mobilityGroup.findFirst({
    where: { id: cleanText(groupId, 80), deletedAt: null },
    include: {
      linker: true,
      members: {
        orderBy: { pickupOrder: "asc" },
        include: {
          resident: { select: { name: true, phone: true } },
        },
      },
      taxiReservation: true,
      tripLogs: true,
    },
  });
  if (!group) {
    throw new Error("운행 그룹을 찾을 수 없습니다.");
  }
  return group;
}

async function assertTripWriterForGroup(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  group: Pick<TripGroupRecord, "linker">,
) {
  if (user.role !== "LINKER") {
    assertPermission(user, "trip:write");
    return;
  }

  const actor = await getActorProfile(tx, user.id);
  if (!actor.phone || !group.linker?.phone) {
    throw new AuthorizationError("배정된 동행링커만 운행 내용을 입력할 수 있습니다.");
  }
  if (normalizePhone(actor.phone) !== normalizePhone(group.linker.phone)) {
    throw new AuthorizationError("배정된 동행링커만 운행 내용을 입력할 수 있습니다.");
  }
}

async function getOrCreateTripLog(
  tx: Prisma.TransactionClient,
  userId: string,
  group: Pick<TripGroupRecord, "id" | "status" | "tripLogs">,
) {
  const latestTripLog = getLatestTripLog(group);
  if (latestTripLog) {
    return latestTripLog;
  }
  return tx.tripLog.create({
    data: {
      groupId: group.id,
      status: group.status,
      createdByUserId: userId,
    },
  });
}

async function applyTaxiConfirmation(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  input: ConfirmTaxiReservationInput,
) {
  assertPermission(user, "taxi:write");

  const group = await tx.mobilityGroup.findFirst({
    where: { id: cleanText(input.groupId, 80), deletedAt: null },
    include: { taxiReservation: true },
  });
  if (!group) {
    throw new Error("택시 예약을 연결할 그룹을 찾을 수 없습니다.");
  }
  if (!group.taxiReservation && user.role === "TAXI_PARTNER") {
    throw new Error("운영자가 예약요청을 먼저 기록해야 확정할 수 있습니다.");
  }

  const reservationConfirmed = input.reservationConfirmed ?? true;
  const confirmedAt = parseOptionalDateTime(input.confirmedAt) ?? new Date();
  const vehicleNumber = optionalCleanText(input.vehicleNumber, 40);
  const driverPhone = optionalCleanText(input.driverPhone, 30);
  if (reservationConfirmed && (!vehicleNumber || !driverPhone)) {
    throw new Error("예약 확정 시 차량번호와 기사 연락처를 입력해 주세요.");
  }

  const expectedFare = parseNonNegativeInteger("예상요금", input.expectedFare);
  const actualFare = parseNonNegativeInteger("실제요금", input.actualFare);
  const receiptUrl = optionalCleanText(input.receiptUrl, 300);

  const data = {
    partnerManagerName: optionalCleanText(input.partnerManagerName, 40),
    reservationConfirmed,
    confirmedAt: reservationConfirmed ? confirmedAt : undefined,
    vehicleNumber,
    driverPhone,
    expectedFare,
    actualFare,
    receiptAttached: Boolean(input.receiptAttached || receiptUrl),
    receiptUrl,
    notes: optionalCleanText(input.notes, 300),
  };

  const reservation = group.taxiReservation
    ? await tx.taxiReservation.update({
        where: { id: group.taxiReservation.id },
        data,
      })
    : await tx.taxiReservation.create({
        data: {
          groupId: group.id,
          requestedAt: new Date(),
          ...data,
        },
      });

  if (reservation.reservationConfirmed) {
    await tx.mobilityGroup.update({
      where: { id: group.id },
      data: { status: "TAXI_CONFIRMED" },
    });
  }

  await writeAuditLog(tx, {
    userId: user.id,
    action: "UPDATE",
    targetType: "TaxiReservation",
    targetId: reservation.id,
    beforeValue: group.taxiReservation,
    afterValue: reservation,
    note: "택시 예약 확정",
  });

  return reservation;
}

async function applyTripStep(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  input: UpdateTripStatusInput,
) {
  const step = parseTripStep(input.step);
  const group = await findGroupForTrip(tx, input.groupId);
  await assertTripWriterForGroup(tx, user, group);

  if (!activeTripStatuses.has(group.status)) {
    throw new Error("택시가 확정된 운행만 체크할 수 있습니다.");
  }

  const activeMemberCount = countActiveMembers(group);
  const tripLog = await getOrCreateTripLog(tx, user.id, group);
  const now = new Date();
  const data: Prisma.TripLogUpdateInput = {
    notes: optionalCleanText(input.notes, 500),
  };

  if (step === "linkerBoarded") {
    data.linkerBoardedAt = tripLog.linkerBoardedAt ?? now;
    data.status = "IN_PROGRESS";
  } else if (step === "resident1Boarded") {
    if (!tripLog.linkerBoardedAt) {
      throw new Error("동행링커 탑승을 먼저 확인해 주세요.");
    }
    data.resident1BoardedAt = tripLog.resident1BoardedAt ?? now;
    data.status = "IN_PROGRESS";
  } else if (step === "resident2Boarded") {
    if (activeMemberCount < 2) {
      throw new Error("2번 주민이 없는 그룹입니다.");
    }
    if (!tripLog.resident1BoardedAt) {
      throw new Error("1번 주민 탑승을 먼저 확인해 주세요.");
    }
    data.resident2BoardedAt = tripLog.resident2BoardedAt ?? now;
    data.status = "IN_PROGRESS";
  } else if (step === "resident3Boarded") {
    if (activeMemberCount < 3) {
      throw new Error("3번 주민이 없는 그룹입니다.");
    }
    if (!tripLog.resident2BoardedAt) {
      throw new Error("2번 주민 탑승을 먼저 확인해 주세요.");
    }
    data.resident3BoardedAt = tripLog.resident3BoardedAt ?? now;
    data.status = "IN_PROGRESS";
  } else if (step === "arrivedAtDestination") {
    const missingBoarding = requiredResidentBoardingFields(activeMemberCount).some(
      (field) => !tripLog[field],
    );
    if (missingBoarding) {
      throw new Error("주민 탑승을 모두 확인한 뒤 목적지 도착을 기록해 주세요.");
    }
    data.arrivedAtDestination = tripLog.arrivedAtDestination ?? now;
    data.status = "IN_PROGRESS";
  } else if (step === "serviceTaskConfirmed") {
    if (!tripLog.arrivedAtDestination) {
      throw new Error("목적지 도착을 먼저 확인해 주세요.");
    }
    data.serviceTaskConfirmed = true;
    data.status = "IN_PROGRESS";
  } else if (step === "returnStarted") {
    if (!tripLog.serviceTaskConfirmed) {
      throw new Error("생활업무 완료를 먼저 확인해 주세요.");
    }
    data.returnStartedAt = tripLog.returnStartedAt ?? now;
    data.status = "IN_PROGRESS";
  }

  const updated = await tx.tripLog.update({
    where: { id: tripLog.id },
    data,
  });

  if (group.status === "TAXI_CONFIRMED") {
    await tx.mobilityGroup.update({
      where: { id: group.id },
      data: { status: "IN_PROGRESS" },
    });
  }

  await writeAuditLog(tx, {
    userId: user.id,
    action: "STATUS_CHANGE",
    targetType: "TripLog",
    targetId: updated.id,
    beforeValue: tripLog,
    afterValue: updated,
    note: tripStepLabels[step],
  });

  return updated;
}

async function applyReturnConfirmation(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  input: ConfirmReturnInput,
) {
  const group = await findGroupForTrip(tx, input.groupId);
  await assertTripWriterForGroup(tx, user, group);

  const tripLog = await getOrCreateTripLog(tx, user.id, group);
  if (!tripLog.returnStartedAt && !tripLog.allReturnsConfirmedAt) {
    throw new Error("귀가 출발을 먼저 확인해 주세요.");
  }

  const now = new Date();
  const activeMembers = group.members.filter((member) => member.memberStatus === "ACTIVE");
  if (activeMembers.length === 0) {
    throw new Error("귀가 확인할 주민이 없습니다.");
  }

  const targetMemberId = optionalCleanText(input.memberId, 80);
  if (input.confirmAll || !targetMemberId) {
    await tx.mobilityGroupMember.updateMany({
      where: {
        groupId: group.id,
        memberStatus: "ACTIVE",
        returnConfirmedAt: null,
      },
      data: { returnConfirmedAt: now },
    });
  } else {
    const member = activeMembers.find((entry) => entry.id === targetMemberId);
    if (!member) {
      throw new Error("귀가 확인할 주민을 찾을 수 없습니다.");
    }
    await tx.mobilityGroupMember.update({
      where: { id: member.id },
      data: { returnConfirmedAt: member.returnConfirmedAt ?? now },
    });
  }

  const remaining = await tx.mobilityGroupMember.count({
    where: {
      groupId: group.id,
      memberStatus: "ACTIVE",
      returnConfirmedAt: null,
    },
  });

  let updatedTripLog = tripLog;
  if (remaining === 0) {
    updatedTripLog = await tx.tripLog.update({
      where: { id: tripLog.id },
      data: {
        status: "RETURN_CONFIRMED",
        allReturnsConfirmedAt: tripLog.allReturnsConfirmedAt ?? now,
        notes: optionalCleanText(input.notes, 500) ?? tripLog.notes,
      },
    });
    await tx.mobilityGroup.update({
      where: { id: group.id },
      data: { status: "RETURN_CONFIRMED" },
    });
    await tx.mobilityRequest.updateMany({
      where: {
        groupMembers: {
          some: {
            groupId: group.id,
            memberStatus: "ACTIVE",
          },
        },
      },
      data: { status: "RETURN_CONFIRMED" },
    });
    if (group.linkerId && !tripLog.allReturnsConfirmedAt) {
      await tx.linker.update({
        where: { id: group.linkerId },
        data: { activityCount: { increment: 1 } },
      });
    }
  }

  await writeAuditLog(tx, {
    userId: user.id,
    action: "STATUS_CHANGE",
    targetType: "MobilityGroup",
    targetId: group.id,
    beforeValue: {
      status: group.status,
      allReturnsConfirmedAt: tripLog.allReturnsConfirmedAt,
    },
    afterValue: {
      status: remaining === 0 ? "RETURN_CONFIRMED" : group.status,
      allReturnsConfirmedAt: updatedTripLog.allReturnsConfirmedAt,
      remainingReturns: remaining,
    },
    note: "귀가 확인",
  });

  return { remainingReturns: remaining };
}

export async function listLinkers(filters: LinkerListFilters = {}) {
  const and: Prisma.LinkerWhereInput[] = [{ deletedAt: null }];
  const query = cleanText(filters.query, 80);
  const status = filters.status ? parseLinkerStatus(filters.status) : undefined;

  if (query) {
    and.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { villageName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (status) {
    and.push({ status });
  }

  const linkers = await prisma.linker.findMany({
    where: { AND: and },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 80,
  });

  return linkers.map(toLinkerItem);
}

export async function listAssignableLinkerOptions() {
  const linkers = await prisma.linker.findMany({
    where: {
      deletedAt: null,
      status: { in: ["AVAILABLE", "ACTIVE"] },
      trainingCompleted: true,
      fieldPracticeCompleted: true,
      privacyPledgeSigned: true,
      insuranceRegistered: true,
    },
    orderBy: [{ activityCount: "asc" }, { updatedAt: "desc" }],
    take: 80,
  });
  return linkers.map(toLinkerOption);
}

export async function listTripGroups(user: AuthUser, filters: TripGroupFilters = {}) {
  const and: Prisma.MobilityGroupWhereInput[] = [{ deletedAt: null }];
  const query = cleanText(filters.query, 80);
  const serviceDate = filters.serviceDate ? parseDateOnly(filters.serviceDate) : undefined;
  const status = filters.status ? parseMobilityStatus(filters.status) : undefined;

  if (query) {
    and.push({
      OR: [
        { groupName: { contains: query, mode: "insensitive" } },
        { destinationSummary: { contains: query, mode: "insensitive" } },
        { linker: { is: { name: { contains: query, mode: "insensitive" } } } },
        { taxiReservation: { is: { vehicleNumber: { contains: query, mode: "insensitive" } } } },
        {
          members: {
            some: {
              resident: {
                is: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        },
      ],
    });
  }
  if (serviceDate) {
    and.push({ serviceDate });
  }
  if (status) {
    and.push({ status });
  }
  if (user.role === "LINKER") {
    const actor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true },
    });
    const phone = normalizePhone(actor?.phone);
    if (!phone) {
      return [];
    }
    and.push({ linker: { is: { phone: actor?.phone ?? "" } } });
  }
  if (user.role === "TAXI_PARTNER") {
    and.push({ status: { in: ["TAXI_REQUESTED", "TAXI_CONFIRMED"] } });
  }

  const groups = await prisma.mobilityGroup.findMany({
    where: { AND: and },
    orderBy: [{ serviceDate: "desc" }, { updatedAt: "desc" }],
    take: 80,
    include: {
      linker: true,
      members: {
        orderBy: { pickupOrder: "asc" },
        include: {
          resident: { select: { name: true, phone: true } },
        },
      },
      taxiReservation: true,
      tripLogs: true,
    },
  });

  return groups.map(toTripGroupItem);
}

export async function createLinker(user: AuthUser, input: CreateLinkerInput) {
  assertPermission(user, "linker:write");
  const status = input.status ? parseLinkerStatus(input.status) : "CANDIDATE";
  const data = {
    name: requireText("동행링커명", input.name, 40),
    villageName: requireText("마을명", input.villageName, 60),
    phone: requireText("연락처", input.phone, 30),
    availableDays: (input.availableDays ?? []).map((day) => cleanText(day, 12)).filter(Boolean),
    availableTimeWindows: (input.availableTimeWindows ?? [])
      .map((timeWindow) => cleanText(timeWindow, 20))
      .filter(Boolean),
    trainingCompleted: Boolean(input.trainingCompleted),
    fieldPracticeCompleted: Boolean(input.fieldPracticeCompleted),
    privacyPledgeSigned: Boolean(input.privacyPledgeSigned),
    insuranceRegistered: Boolean(input.insuranceRegistered),
    status,
    incidentComplaintHistory: optionalCleanText(input.incidentComplaintHistory, 300),
    wantsJobConnection: Boolean(input.wantsJobConnection),
    desiredJobField: optionalCleanText(input.desiredJobField, 80),
  };

  if (assignmentReadyStatuses.has(status) && !isAssignmentReady(data)) {
    throw new Error("활동가능 상태는 교육, 실습, 개인정보보호 서약, 보험 등록이 모두 필요합니다.");
  }

  const linker = await prisma.$transaction(async (tx) => {
    const created = await tx.linker.create({ data });
    await writeAuditLog(tx, {
      userId: user.id,
      action: "CREATE",
      targetType: "Linker",
      targetId: created.id,
      afterValue: created,
    });
    return created;
  });

  return linker;
}

export async function updateLinkerStatus(user: AuthUser, input: UpdateLinkerStatusInput) {
  assertPermission(user, "linker:write");
  const status = parseLinkerStatus(input.status);

  return prisma.$transaction(async (tx) => {
    const linker = await tx.linker.findFirst({
      where: { id: cleanText(input.linkerId, 80), deletedAt: null },
    });
    if (!linker) {
      throw new Error("동행링커를 찾을 수 없습니다.");
    }
    if (assignmentReadyStatuses.has(status) && !isAssignmentReady({ ...linker, status })) {
      throw new Error("활동가능 상태는 교육, 실습, 개인정보보호 서약, 보험 등록이 모두 필요합니다.");
    }
    const updated = await tx.linker.update({
      where: { id: linker.id },
      data: { status },
    });
    await writeAuditLog(tx, {
      userId: user.id,
      action: "STATUS_CHANGE",
      targetType: "Linker",
      targetId: linker.id,
      beforeValue: { status: linker.status },
      afterValue: { status: updated.status },
    });
    return updated;
  });
}

export async function assignLinkerToGroup(user: AuthUser, input: AssignLinkerInput) {
  assertOperationalUser(user, "운영자만 동행링커를 배정할 수 있습니다.");

  return prisma.$transaction(async (tx) => {
    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(input.groupId, 80), deletedAt: null },
    });
    if (!group) {
      throw new Error("동행링커를 배정할 그룹을 찾을 수 없습니다.");
    }
    if (!["GROUP_READY", "LINKER_RECRUITING", "LINKER_ASSIGNED"].includes(group.status)) {
      throw new Error("그룹확정 또는 링커모집 단계에서만 동행링커를 배정할 수 있습니다.");
    }

    const linker = await tx.linker.findFirst({
      where: { id: cleanText(input.linkerId, 80), deletedAt: null },
    });
    if (!linker) {
      throw new Error("동행링커를 찾을 수 없습니다.");
    }
    if (!isAssignmentReady(linker)) {
      throw new Error("활동가능하고 필수 준비가 완료된 동행링커만 배정할 수 있습니다.");
    }

    const updated = await tx.mobilityGroup.update({
      where: { id: group.id },
      data: {
        linkerId: linker.id,
        status: "LINKER_ASSIGNED",
      },
    });

    await writeAuditLog(tx, {
      userId: user.id,
      action: "ASSIGN",
      targetType: "MobilityGroup",
      targetId: group.id,
      beforeValue: { linkerId: group.linkerId, status: group.status },
      afterValue: { linkerId: updated.linkerId, status: updated.status },
      note: "동행링커 배정",
    });
    return updated;
  });
}

export async function requestTaxiReservation(user: AuthUser, input: RequestTaxiReservationInput) {
  assertOperationalUser(user, "운영자만 택시 예약요청을 기록할 수 있습니다.");
  assertPermission(user, "taxi:write");

  return prisma.$transaction(async (tx) => {
    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(input.groupId, 80), deletedAt: null },
      include: { taxiReservation: true },
    });
    if (!group) {
      throw new Error("택시 예약요청을 연결할 그룹을 찾을 수 없습니다.");
    }
    if (!group.linkerId) {
      throw new Error("동행링커 배정 후 택시 예약요청을 기록해 주세요.");
    }
    if (!taxiManagedStatuses.has(group.status)) {
      throw new Error("링커확정 단계에서만 택시 예약요청을 기록할 수 있습니다.");
    }

    const data = {
      partnerManagerName: optionalCleanText(input.partnerManagerName, 40),
      notes: optionalCleanText(input.notes, 300),
    };
    const reservation = group.taxiReservation
      ? await tx.taxiReservation.update({
          where: { id: group.taxiReservation.id },
          data: {
            requestedAt: new Date(),
            ...data,
          },
        })
      : await tx.taxiReservation.create({
          data: {
            groupId: group.id,
            ...data,
          },
        });

    await tx.mobilityGroup.update({
      where: { id: group.id },
      data: { status: "TAXI_REQUESTED" },
    });

    await writeAuditLog(tx, {
      userId: user.id,
      action: group.taxiReservation ? "UPDATE" : "CREATE",
      targetType: "TaxiReservation",
      targetId: reservation.id,
      beforeValue: group.taxiReservation,
      afterValue: reservation,
      note: "택시연합 예약요청",
    });
    return reservation;
  });
}

export async function confirmTaxiReservation(user: AuthUser, input: ConfirmTaxiReservationInput) {
  return prisma.$transaction((tx) => applyTaxiConfirmation(tx, user, input));
}

export async function updateTripStatus(user: AuthUser, input: UpdateTripStatusInput) {
  return prisma.$transaction((tx) => applyTripStep(tx, user, input));
}

export async function confirmReturn(user: AuthUser, input: ConfirmReturnInput) {
  return prisma.$transaction((tx) => applyReturnConfirmation(tx, user, input));
}

function formText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function formHasValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim().length > 0;
}

function extractSubmittedFields(formData: FormData) {
  return [...formData.entries()]
    .filter(([key, value]) => key !== "token" && String(value).trim().length > 0)
    .map(([key]) => key);
}

async function applyMobileSubmission(
  tx: Prisma.TransactionClient,
  token: MobileFormToken,
  formData: FormData,
) {
  const tokenUser: AuthUser = {
    id: token.createdByUserId,
    role: "SUPER_ADMIN",
    isActive: true,
  };

  if (token.scope === "TAXI_CONFIRM") {
    let groupId = token.targetId;
    if (token.targetType === "TaxiReservation") {
      const reservation = await tx.taxiReservation.findUnique({
        where: { id: token.targetId },
        select: { groupId: true },
      });
      if (!reservation) {
        throw new Error("택시 예약을 찾을 수 없습니다.");
      }
      groupId = reservation.groupId;
    }
    await applyTaxiConfirmation(tx, tokenUser, {
      groupId,
      reservationConfirmed: parseBoolean(formData.get("reservationConfirmed")),
      confirmedAt: formText(formData, "confirmedAt"),
      partnerManagerName: formText(formData, "partnerManagerName"),
      vehicleNumber: formText(formData, "vehicleNumber"),
      driverPhone: formText(formData, "driverPhone"),
      expectedFare: formText(formData, "expectedFare"),
      actualFare: formText(formData, "actualFare"),
      receiptAttached: parseBoolean(formData.get("receiptAttached")),
      receiptUrl: formText(formData, "receiptUrl"),
      notes: formText(formData, "notes"),
    });
  } else if (token.scope === "TRIP_CHECK") {
    if (token.targetType !== "MobilityGroup") {
      throw new Error("운행 체크 링크의 대상이 올바르지 않습니다.");
    }
    const orderedSteps: TripStep[] = [
      "linkerBoarded",
      "resident1Boarded",
      "resident2Boarded",
      "resident3Boarded",
      "arrivedAtDestination",
      "serviceTaskConfirmed",
      "returnStarted",
    ];
    for (const step of orderedSteps) {
      if (formHasValue(formData, `${step}At`) || formHasValue(formData, step)) {
        await applyTripStep(tx, tokenUser, {
          groupId: token.targetId,
          step,
          notes: formText(formData, "notes"),
        });
      }
    }
  } else if (token.scope === "RETURN_CONFIRM") {
    if (token.targetType === "MobilityGroupMember") {
      const member = await tx.mobilityGroupMember.findUnique({
        where: { id: token.targetId },
        select: { groupId: true },
      });
      if (!member) {
        throw new Error("귀가 확인할 주민을 찾을 수 없습니다.");
      }
      await applyReturnConfirmation(tx, tokenUser, {
        groupId: member.groupId,
        memberId: token.targetId,
        notes: formText(formData, "notes"),
      });
    } else if (token.targetType === "MobilityGroup") {
      await applyReturnConfirmation(tx, tokenUser, {
        groupId: token.targetId,
        confirmAll: true,
        notes: formText(formData, "notes"),
      });
    } else {
      throw new Error("귀가 확인 링크의 대상이 올바르지 않습니다.");
    }
  }
}

export async function submitOperationalMobileForm(rawToken: string, formData: FormData) {
  const submittedFields = extractSubmittedFields(formData);
  if (submittedFields.length === 0) {
    throw new Error("저장할 내용을 입력해 주세요.");
  }

  return prisma.$transaction(async (tx) => {
    const status = await validateMobileFormToken(rawToken, undefined, tx);
    if (!status.ok) {
      throw new Error("사용할 수 없는 모바일 입력 링크입니다.");
    }

    assertMobileFieldsAllowed(status.token.scope, submittedFields);
    await applyMobileSubmission(tx, status.token, formData);

    const updated = await tx.mobileFormToken.update({
      where: { id: status.token.id },
      data: { usedCount: { increment: 1 } },
    });

    await writeAuditLog(tx, {
      userId: status.token.createdByUserId,
      action: "TOKEN_SUBMIT",
      targetType: status.token.targetType,
      targetId: status.token.targetId,
      afterValue: {
        scope: status.token.scope,
        submittedFields,
        usedCount: updated.usedCount,
      },
    });

    return updated;
  });
}

export const previewLinkers: LinkerListItem[] = [
  {
    id: "preview-linker-1",
    name: "김동행",
    villageName: "백천마을",
    phoneMasked: "010-****-3300",
    availableDays: ["월", "수", "금"],
    availableTimeWindows: ["오전", "오후"],
    trainingCompleted: true,
    fieldPracticeCompleted: true,
    privacyPledgeSigned: true,
    insuranceRegistered: true,
    readyForAssignment: true,
    status: "AVAILABLE",
    statusLabel: "활동가능",
    activityCount: 4,
    incidentComplaintHistory: "없음",
    wantsJobConnection: false,
    desiredJobField: "",
  },
  {
    id: "preview-linker-2",
    name: "이도움",
    villageName: "백천마을",
    phoneMasked: "010-****-4411",
    availableDays: ["화", "목"],
    availableTimeWindows: ["오전"],
    trainingCompleted: true,
    fieldPracticeCompleted: false,
    privacyPledgeSigned: true,
    insuranceRegistered: true,
    readyForAssignment: false,
    status: "IN_TRAINING",
    statusLabel: "교육중",
    activityCount: 0,
    incidentComplaintHistory: "실습 대기",
    wantsJobConnection: true,
    desiredJobField: "돌봄 보조",
  },
];

export const previewLinkerOptions: LinkerOption[] = [
  {
    id: "preview-linker-1",
    name: "김동행",
    phoneMasked: "010-****-3300",
    statusLabel: "활동가능",
    summary: "백천마을 · 월, 수, 금 · 오전, 오후",
  },
];

export const previewTripGroups: TripGroupListItem[] = [
  {
    id: "preview-trip-group",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    serviceDate: "2026-06-03",
    timeWindow: "오전",
    destinationSummary: "백천종합병원",
    returnEta: "2026-06-03T13:30",
    status: "TAXI_CONFIRMED",
    statusLabel: "택시확정",
    linker: {
      id: "preview-linker-1",
      name: "김동행",
      phoneMasked: "010-****-3300",
      statusLabel: "활동가능",
    },
    memberCount: 2,
    members: [
      {
        id: "preview-member-1",
        residentName: "홍길순",
        phoneMasked: "010-****-5678",
        pickupOrder: 1,
        pickupPlace: "백천마을 회관",
        pickupEta: "2026-06-03T09:00",
        returnConfirmedAt: "",
      },
      {
        id: "preview-member-2",
        residentName: "박순자",
        phoneMasked: "010-****-2222",
        pickupOrder: 2,
        pickupPlace: "백천마을 입구",
        pickupEta: "2026-06-03T09:10",
        returnConfirmedAt: "",
      },
    ],
    taxiReservation: {
      id: "preview-taxi",
      requestedAt: "2026. 6. 2. 오전 10:00:00",
      partnerManagerName: "택시연합 담당자",
      reservationConfirmed: true,
      confirmedAt: "2026-06-02T11:00",
      vehicleNumber: "충남12가3456",
      driverPhoneMasked: "010-****-7788",
      expectedFare: 28000,
      actualFare: null,
      receiptAttached: false,
      receiptUrl: "",
      notes: "시연용 예약",
    },
    tripLog: null,
    availableTripSteps: ["linkerBoarded"],
  },
];

export { tripStepLabels };
