import { Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  CANCELLATION_STATUSES,
  MOBILITY_PURPOSES,
  MOBILITY_PURPOSE_LABELS,
  MOBILITY_STATUSES,
  MOBILITY_STATUS_LABELS,
  type MobilityPurpose,
  type MobilityStatus,
} from "@/domain/definitions";
import { maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

const forbiddenSensitiveTextPattern =
  /(주민등록번호|진단명|처치|상담내용|상담 내용|혈압|혈당|복용약|처방|수술|질환|장애등급)/;

export type ResidentRequestFormInput = {
  residentId?: string;
  residentName?: string;
  villageName?: string;
  phone?: string;
  guardianPhone?: string;
  memo?: string;
  desiredDate?: string;
  desiredTimeWindow?: string;
  purpose?: string;
  origin?: string;
  destination?: string;
  needsCompanion?: boolean;
  notes?: string;
  privacyConsent?: boolean;
  thirdPartyConsent?: boolean;
  sensitiveInfoNotCollected?: boolean;
};

export type ResidentRequestListFilters = {
  query?: string;
  villageName?: string;
  desiredDate?: string;
  purpose?: string;
  status?: string;
};

export type ResidentOption = {
  id: string;
  name: string;
  villageName: string;
  phoneMasked: string;
};

export type ResidentRequestListItem = {
  id: string;
  residentId: string;
  residentName: string;
  villageName: string;
  phoneMasked: string;
  guardianPhoneMasked: string;
  desiredDate: string;
  desiredTimeWindow: string;
  purpose: MobilityPurpose;
  purposeLabel: string;
  origin: string;
  destination: string;
  status: MobilityStatus;
  statusLabel: string;
  needsCompanion: boolean;
  privacyReady: boolean;
  createdAt: string;
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

function requirePhone(label: string, value: unknown) {
  const phone = requireText(label, value, 30);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    throw new Error(`${label}는 숫자 8자리 이상으로 입력해 주세요.`);
  }
  return phone;
}

function parseDateOnly(value: unknown) {
  const text = requireText("희망일", value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("희망일은 YYYY-MM-DD 형식이어야 합니다.");
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("희망일을 다시 확인해 주세요.");
  }
  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parsePurpose(value: unknown): MobilityPurpose {
  const purpose = requireText("이동 목적", value, 40) as MobilityPurpose;
  if (!MOBILITY_PURPOSES.includes(purpose)) {
    throw new Error("이동 목적을 다시 선택해 주세요.");
  }
  return purpose;
}

function parseStatusFilter(value?: string): MobilityStatus | undefined {
  if (!value) {
    return undefined;
  }
  return MOBILITY_STATUSES.includes(value as MobilityStatus)
    ? (value as MobilityStatus)
    : undefined;
}

function parsePurposeFilter(value?: string): MobilityPurpose | undefined {
  if (!value) {
    return undefined;
  }
  return MOBILITY_PURPOSES.includes(value as MobilityPurpose)
    ? (value as MobilityPurpose)
    : undefined;
}

function assertNoForbiddenSensitiveText(fields: Record<string, string | undefined>) {
  for (const [label, value] of Object.entries(fields)) {
    if (value && forbiddenSensitiveTextPattern.test(value)) {
      throw new Error(
        `${label}에는 주민등록번호, 진단명, 처치·상담 내용 같은 민감정보를 입력하지 않습니다.`,
      );
    }
  }
}

function normalizeRequestInput(input: ResidentRequestFormInput) {
  const residentId = optionalCleanText(input.residentId, 80);
  const residentName = residentId
    ? optionalCleanText(input.residentName, 80)
    : requireText("주민명", input.residentName, 80);
  const villageName = residentId
    ? optionalCleanText(input.villageName, 80)
    : requireText("마을명", input.villageName, 80);
  const phone = residentId ? optionalCleanText(input.phone, 30) : requirePhone("연락처", input.phone);
  const guardianPhone = optionalCleanText(input.guardianPhone, 30);
  const memo = optionalCleanText(input.memo, 300);
  const desiredDate = parseDateOnly(input.desiredDate);
  const desiredTimeWindow = requireText("희망 시간대", input.desiredTimeWindow, 40);
  const purpose = parsePurpose(input.purpose);
  const origin = requireText("출발지", input.origin, 120);
  const destination = requireText("목적지", input.destination, 120);
  const notes = optionalCleanText(input.notes, 300);

  if (!input.privacyConsent || !input.thirdPartyConsent || !input.sensitiveInfoNotCollected) {
    throw new Error("개인정보 동의, 제3자 제공 동의, 민감정보 미수집 확인이 모두 필요합니다.");
  }

  assertNoForbiddenSensitiveText({
    주민메모: memo,
    출발지: origin,
    목적지: destination,
    요청메모: notes,
  });

  return {
    residentId,
    residentName,
    villageName,
    phone,
    guardianPhone,
    memo,
    desiredDate,
    desiredTimeWindow,
    purpose,
    origin,
    destination,
    notes,
    needsCompanion: input.needsCompanion ?? true,
    privacyConsent: true,
    thirdPartyConsent: true,
    sensitiveInfoNotCollected: true,
  };
}

export async function listResidentOptions(): Promise<ResidentOption[]> {
  const residents = await prisma.resident.findMany({
    where: { deletedAt: null },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: 80,
    select: {
      id: true,
      name: true,
      villageName: true,
      phone: true,
    },
  });

  return residents.map((resident) => ({
    id: resident.id,
    name: resident.name,
    villageName: resident.villageName,
    phoneMasked: maskPhone(resident.phone),
  }));
}

export async function listMobilityRequests(
  filters: ResidentRequestListFilters = {},
): Promise<ResidentRequestListItem[]> {
  const and: Prisma.MobilityRequestWhereInput[] = [{ deletedAt: null }];
  const query = cleanText(filters.query, 80);
  const villageName = cleanText(filters.villageName, 80);
  const desiredDate = filters.desiredDate ? parseDateOnly(filters.desiredDate) : undefined;
  const purpose = parsePurposeFilter(filters.purpose);
  const status = parseStatusFilter(filters.status);

  if (query) {
    and.push({
      OR: [
        { origin: { contains: query, mode: "insensitive" } },
        { destination: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        { resident: { is: { name: { contains: query, mode: "insensitive" } } } },
        { resident: { is: { phone: { contains: query } } } },
      ],
    });
  }
  if (villageName) {
    and.push({ resident: { is: { villageName } } });
  }
  if (desiredDate) {
    and.push({ desiredDate });
  }
  if (purpose) {
    and.push({ purpose });
  }
  if (status) {
    and.push({ status });
  }

  const requests = await prisma.mobilityRequest.findMany({
    where: { AND: and },
    orderBy: [{ desiredDate: "desc" }, { createdAt: "desc" }],
    take: 80,
    include: {
      resident: {
        select: {
          id: true,
          name: true,
          villageName: true,
          phone: true,
          guardianPhone: true,
        },
      },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    residentId: request.residentId,
    residentName: request.resident.name,
    villageName: request.resident.villageName,
    phoneMasked: maskPhone(request.resident.phone),
    guardianPhoneMasked: maskPhone(request.resident.guardianPhone),
    desiredDate: formatDateOnly(request.desiredDate),
    desiredTimeWindow: request.desiredTimeWindow,
    purpose: request.purpose,
    purposeLabel: MOBILITY_PURPOSE_LABELS[request.purpose],
    origin: request.origin,
    destination: request.destination,
    status: request.status,
    statusLabel: MOBILITY_STATUS_LABELS[request.status],
    needsCompanion: request.needsCompanion,
    privacyReady:
      request.privacyConsent &&
      request.thirdPartyConsent &&
      request.sensitiveInfoNotCollected,
    createdAt: request.createdAt.toISOString(),
  }));
}

export async function createResidentRequest(user: AuthUser, input: ResidentRequestFormInput) {
  assertPermission(user, "resident:write");
  assertPermission(user, "request:write");

  const normalized = normalizeRequestInput(input);

  return prisma.$transaction(async (tx) => {
    const resident = normalized.residentId
      ? await tx.resident.findFirst({
          where: { id: normalized.residentId, deletedAt: null },
        })
      : await tx.resident.create({
          data: {
            name: normalized.residentName ?? "",
            villageName: normalized.villageName ?? "",
            phone: normalized.phone ?? "",
            guardianPhone: normalized.guardianPhone,
            memo: normalized.memo,
          },
        });

    if (!resident) {
      throw new Error("선택한 주민을 찾을 수 없습니다.");
    }

    const duplicate = await tx.mobilityRequest.findFirst({
      where: {
        residentId: resident.id,
        desiredDate: normalized.desiredDate,
        desiredTimeWindow: normalized.desiredTimeWindow,
        deletedAt: null,
        status: {
          notIn: [...CANCELLATION_STATUSES],
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error("같은 주민의 같은 날짜와 시간대 신청이 이미 있습니다.");
    }

    const request = await tx.mobilityRequest.create({
      data: {
        residentId: resident.id,
        desiredDate: normalized.desiredDate,
        desiredTimeWindow: normalized.desiredTimeWindow,
        purpose: normalized.purpose,
        origin: normalized.origin,
        destination: normalized.destination,
        needsCompanion: normalized.needsCompanion,
        notes: normalized.notes,
        status: "REQUESTED",
        privacyConsent: normalized.privacyConsent,
        thirdPartyConsent: normalized.thirdPartyConsent,
        sensitiveInfoNotCollected: normalized.sensitiveInfoNotCollected,
        createdByUserId: user.id,
      },
    });

    if (!normalized.residentId) {
      await writeAuditLog(tx, {
        userId: user.id,
        action: "CREATE",
        targetType: "Resident",
        targetId: resident.id,
        afterValue: {
          name: resident.name,
          villageName: resident.villageName,
          phone: resident.phone,
          guardianPhone: resident.guardianPhone,
        },
      });
    }

    await writeAuditLog(tx, {
      userId: user.id,
      action: "CREATE",
      targetType: "MobilityRequest",
      targetId: request.id,
      afterValue: {
        residentId: resident.id,
        desiredDate: formatDateOnly(request.desiredDate),
        desiredTimeWindow: request.desiredTimeWindow,
        purpose: request.purpose,
        origin: request.origin,
        destination: request.destination,
        status: request.status,
        privacyConsent: request.privacyConsent,
        thirdPartyConsent: request.thirdPartyConsent,
        sensitiveInfoNotCollected: request.sensitiveInfoNotCollected,
      },
    });

    return { residentId: resident.id, requestId: request.id };
  });
}

export async function updateResident(
  user: AuthUser,
  residentId: string,
  input: Pick<
    ResidentRequestFormInput,
    "residentName" | "villageName" | "phone" | "guardianPhone" | "memo"
  >,
) {
  assertPermission(user, "resident:write");
  const previous = await prisma.resident.findFirst({
    where: { id: residentId, deletedAt: null },
  });
  if (!previous) {
    throw new Error("주민을 찾을 수 없습니다.");
  }

  const next = {
    name: requireText("주민명", input.residentName, 80),
    villageName: requireText("마을명", input.villageName, 80),
    phone: requirePhone("연락처", input.phone),
    guardianPhone: optionalCleanText(input.guardianPhone, 30),
    memo: optionalCleanText(input.memo, 300),
  };
  assertNoForbiddenSensitiveText({ 주민메모: next.memo });

  const updated = await prisma.resident.update({
    where: { id: residentId },
    data: next,
  });
  await writeAuditLog(prisma, {
    userId: user.id,
    action: "UPDATE",
    targetType: "Resident",
    targetId: residentId,
    beforeValue: previous,
    afterValue: updated,
  });
  return updated;
}

export async function updateMobilityRequest(
  user: AuthUser,
  requestId: string,
  input: Pick<
    ResidentRequestFormInput,
    | "desiredDate"
    | "desiredTimeWindow"
    | "purpose"
    | "origin"
    | "destination"
    | "needsCompanion"
    | "notes"
    | "privacyConsent"
    | "thirdPartyConsent"
    | "sensitiveInfoNotCollected"
  >,
) {
  assertPermission(user, "request:write");
  const previous = await prisma.mobilityRequest.findFirst({
    where: { id: requestId, deletedAt: null },
  });
  if (!previous) {
    throw new Error("신청을 찾을 수 없습니다.");
  }

  const normalized = normalizeRequestInput({
    residentId: previous.residentId,
    desiredDate: input.desiredDate,
    desiredTimeWindow: input.desiredTimeWindow,
    purpose: input.purpose,
    origin: input.origin,
    destination: input.destination,
    needsCompanion: input.needsCompanion,
    notes: input.notes,
    privacyConsent: input.privacyConsent,
    thirdPartyConsent: input.thirdPartyConsent,
    sensitiveInfoNotCollected: input.sensitiveInfoNotCollected,
  });

  const updated = await prisma.mobilityRequest.update({
    where: { id: requestId },
    data: {
      desiredDate: normalized.desiredDate,
      desiredTimeWindow: normalized.desiredTimeWindow,
      purpose: normalized.purpose,
      origin: normalized.origin,
      destination: normalized.destination,
      needsCompanion: normalized.needsCompanion,
      notes: normalized.notes,
      privacyConsent: normalized.privacyConsent,
      thirdPartyConsent: normalized.thirdPartyConsent,
      sensitiveInfoNotCollected: normalized.sensitiveInfoNotCollected,
    },
  });

  await writeAuditLog(prisma, {
    userId: user.id,
    action: "UPDATE",
    targetType: "MobilityRequest",
    targetId: requestId,
    beforeValue: previous,
    afterValue: updated,
  });
  return updated;
}
