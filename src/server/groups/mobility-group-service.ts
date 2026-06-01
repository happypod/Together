import { Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  MOBILITY_STATUS_LABELS,
  type MobilityStatus,
} from "@/domain/definitions";
import {
  canTransitionMobilityStatus,
  getNextMobilityStatusActions,
  requiresStatusReason,
} from "@/domain/status";
import { assertNoForbiddenSensitiveInfo, maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export type GroupCandidateRequest = {
  id: string;
  residentName: string;
  villageName: string;
  phoneMasked: string;
  desiredDate: string;
  desiredTimeWindow: string;
  origin: string;
  destination: string;
  statusLabel: string;
};

export type MobilityGroupMemberItem = {
  id: string;
  requestId: string;
  residentName: string;
  phoneMasked: string;
  pickupOrder: number;
  pickupEta: string;
  pickupPlace: string;
  returnConfirmedAt: string;
  memberStatus: string;
};

export type MobilityGroupListItem = {
  id: string;
  groupName: string;
  serviceDate: string;
  timeWindow: string;
  destinationSummary: string;
  returnEta: string;
  status: MobilityStatus;
  statusLabel: string;
  exceptionReason: string;
  notes: string;
  memberCount: number;
  members: MobilityGroupMemberItem[];
  nextStatuses: {
    value: MobilityStatus;
    label: string;
  }[];
};

export type MobilityGroupListFilters = {
  query?: string;
  serviceDate?: string;
  status?: string;
};

export type CreateMobilityGroupInput = {
  requestIds: string[];
  destinationSummary?: string;
  returnEta?: string;
  notes?: string;
};

export type AddGroupMemberInput = {
  groupId: string;
  requestId: string;
  pickupPlace?: string;
  pickupEta?: string;
};

export type UpdatePickupInput = {
  groupId: string;
  memberId: string;
  pickupOrder: number;
  pickupPlace?: string;
  pickupEta?: string;
};

export type TransitionGroupStatusInput = {
  groupId: string;
  nextStatus: string;
  reason?: string;
};

const temporaryPickupOrder = 99;

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

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeInput(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}

function sameDate(left: Date, right: Date) {
  return formatDateOnly(left) === formatDateOnly(right);
}

function parseMobilityStatus(value: unknown): MobilityStatus {
  const status = requireText("상태", value, 40) as MobilityStatus;
  if (!(status in MOBILITY_STATUS_LABELS)) {
    throw new Error("상태 값을 다시 선택해 주세요.");
  }
  return status;
}

function validateRequestIds(requestIds: string[], maxGroupResidents: number) {
  const cleanedIds = requestIds.map((id) => cleanText(id, 80)).filter(Boolean);
  const uniqueIds = [...new Set(cleanedIds)];
  if (uniqueIds.length === 0) {
    throw new Error("그룹에 넣을 신청을 1명 이상 선택해 주세요.");
  }
  if (uniqueIds.length > maxGroupResidents) {
    throw new Error(`공동예약 그룹은 주민 ${maxGroupResidents}명까지 가능합니다.`);
  }
  return uniqueIds;
}

function buildGroupName(serviceDate: Date, timeWindow: string, destinationSummary: string) {
  return `${formatDateOnly(serviceDate)} ${timeWindow} ${destinationSummary} 이동`;
}

function toCandidate(request: CandidateRecord): GroupCandidateRequest {
  return {
    id: request.id,
    residentName: request.resident.name,
    villageName: request.resident.villageName,
    phoneMasked: maskPhone(request.resident.phone),
    desiredDate: formatDateOnly(request.desiredDate),
    desiredTimeWindow: request.desiredTimeWindow,
    origin: request.origin,
    destination: request.destination,
    statusLabel: MOBILITY_STATUS_LABELS[request.status],
  };
}

type CandidateRecord = Prisma.MobilityRequestGetPayload<{
  include: {
    resident: {
      select: {
        name: true;
        villageName: true;
        phone: true;
      };
    };
  };
}>;

type GroupRecord = Prisma.MobilityGroupGetPayload<{
  include: {
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
  };
}>;

function toGroupListItem(group: GroupRecord): MobilityGroupListItem {
  return {
    id: group.id,
    groupName: group.groupName,
    serviceDate: formatDateOnly(group.serviceDate),
    timeWindow: group.timeWindow,
    destinationSummary: group.destinationSummary,
    returnEta: formatDateTimeInput(group.returnEta),
    status: group.status,
    statusLabel: MOBILITY_STATUS_LABELS[group.status],
    exceptionReason: group.exceptionReason ?? "",
    notes: group.notes ?? "",
    memberCount: group.members.length,
    members: group.members.map((member) => ({
      id: member.id,
      requestId: member.requestId,
      residentName: member.resident.name,
      phoneMasked: maskPhone(member.resident.phone),
      pickupOrder: member.pickupOrder,
      pickupEta: formatDateTimeInput(member.pickupEta),
      pickupPlace: member.pickupPlace,
      returnConfirmedAt: formatDateTimeInput(member.returnConfirmedAt),
      memberStatus: member.memberStatus,
    })),
    nextStatuses: getNextMobilityStatusActions(group.status),
  };
}

async function syncGroupRequestStatuses(
  tx: Prisma.TransactionClient,
  groupId: string,
  status: MobilityStatus,
) {
  await tx.mobilityRequest.updateMany({
    where: {
      groupMembers: {
        some: {
          groupId,
          memberStatus: "ACTIVE",
        },
      },
    },
    data: { status },
  });
}

export async function listGroupCandidateRequests(): Promise<GroupCandidateRequest[]> {
  const requests = await prisma.mobilityRequest.findMany({
    where: {
      deletedAt: null,
      status: {
        in: ["REQUESTED", "RECRUITING"],
      },
      groupMembers: {
        none: {},
      },
    },
    orderBy: [{ desiredDate: "asc" }, { createdAt: "asc" }],
    take: 40,
    include: {
      resident: {
        select: {
          name: true,
          villageName: true,
          phone: true,
        },
      },
    },
  });

  return requests.map(toCandidate);
}

export async function listMobilityGroups(
  filters: MobilityGroupListFilters = {},
): Promise<MobilityGroupListItem[]> {
  const and: Prisma.MobilityGroupWhereInput[] = [{ deletedAt: null }];
  const query = cleanText(filters.query, 80);
  const serviceDate = filters.serviceDate ? parseDateOnly(filters.serviceDate) : undefined;
  const status = filters.status ? parseMobilityStatus(filters.status) : undefined;

  if (query) {
    and.push({
      OR: [
        { groupName: { contains: query, mode: "insensitive" } },
        { destinationSummary: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
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

  const groups = await prisma.mobilityGroup.findMany({
    where: { AND: and },
    orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
    take: 40,
    include: {
      members: {
        orderBy: { pickupOrder: "asc" },
        include: {
          resident: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  return groups.map(toGroupListItem);
}

export async function createMobilityGroup(user: AuthUser, input: CreateMobilityGroupInput) {
  assertPermission(user, "group:write");

  return prisma.$transaction(async (tx) => {
    const settings = await getOperatingSettings(tx);
    const requestIds = validateRequestIds(input.requestIds, settings.maxGroupResidents);
    const requests = await tx.mobilityRequest.findMany({
      where: {
        id: { in: requestIds },
        deletedAt: null,
      },
      include: {
        groupMembers: { select: { id: true } },
      },
    });

    if (requests.length !== requestIds.length) {
      throw new Error("선택한 신청 중 찾을 수 없는 항목이 있습니다.");
    }
    if (requests.some((request) => request.groupMembers.length > 0)) {
      throw new Error("이미 그룹에 편성된 신청이 포함되어 있습니다.");
    }
    if (requests.some((request) => !["REQUESTED", "RECRUITING"].includes(request.status))) {
      throw new Error("신청접수 또는 모집중 상태의 신청만 그룹에 넣을 수 있습니다.");
    }

    const [firstRequest] = requests;
    if (!firstRequest) {
      throw new Error("그룹에 넣을 신청을 1명 이상 선택해 주세요.");
    }
    if (
      requests.some(
        (request) =>
          !sameDate(request.desiredDate, firstRequest.desiredDate) ||
          request.desiredTimeWindow !== firstRequest.desiredTimeWindow,
      )
    ) {
      throw new Error("같은 날짜와 시간대의 신청만 하나의 그룹으로 묶을 수 있습니다.");
    }

    const destinationSummary =
      optionalCleanText(input.destinationSummary, 120) ??
      [...new Set(requests.map((request) => request.destination))].join(", ").slice(0, 120);
    const notes = optionalCleanText(input.notes, 300);
    assertNoForbiddenSensitiveInfo({
      목적지요약: destinationSummary,
      그룹메모: notes,
    });
    const group = await tx.mobilityGroup.create({
      data: {
        groupName: buildGroupName(
          firstRequest.desiredDate,
          firstRequest.desiredTimeWindow,
          destinationSummary,
        ),
        serviceDate: firstRequest.desiredDate,
        timeWindow: firstRequest.desiredTimeWindow,
        destinationSummary,
        returnEta: parseOptionalDateTime(input.returnEta),
        status: "GROUP_READY",
        notes,
        createdByUserId: user.id,
      },
    });

    for (const [index, requestId] of requestIds.entries()) {
      const request = requests.find((entry) => entry.id === requestId);
      if (!request) {
        continue;
      }
      await tx.mobilityGroupMember.create({
        data: {
          groupId: group.id,
          requestId: request.id,
          residentId: request.residentId,
          pickupOrder: index + 1,
          pickupPlace: request.origin,
        },
      });
      await tx.mobilityRequest.update({
        where: { id: request.id },
        data: { status: "GROUP_READY" },
      });
    }

    await writeAuditLog(tx, {
      userId: user.id,
      action: "CREATE",
      targetType: "MobilityGroup",
      targetId: group.id,
      afterValue: {
        groupName: group.groupName,
        requestIds,
        status: group.status,
        maxGroupResidents: settings.maxGroupResidents,
      },
    });

    return group;
  });
}

export async function addMemberToGroup(user: AuthUser, input: AddGroupMemberInput) {
  assertPermission(user, "group:write");

  return prisma.$transaction(async (tx) => {
    const settings = await getOperatingSettings(tx);
    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(input.groupId, 80), deletedAt: null },
      include: { members: true },
    });
    if (!group) {
      throw new Error("그룹을 찾을 수 없습니다.");
    }
    if (group.members.length >= settings.maxGroupResidents) {
      throw new Error(`공동예약 그룹은 주민 ${settings.maxGroupResidents}명까지 가능합니다.`);
    }

    const request = await tx.mobilityRequest.findFirst({
      where: {
        id: cleanText(input.requestId, 80),
        deletedAt: null,
      },
      include: { groupMembers: true },
    });
    if (!request) {
      throw new Error("추가할 신청을 찾을 수 없습니다.");
    }
    if (request.groupMembers.length > 0) {
      throw new Error("이미 그룹에 편성된 신청입니다.");
    }
    if (!sameDate(group.serviceDate, request.desiredDate) || group.timeWindow !== request.desiredTimeWindow) {
      throw new Error("그룹과 같은 날짜와 시간대의 신청만 추가할 수 있습니다.");
    }

    const pickupOrder = group.members.length + 1;
    const pickupPlace = optionalCleanText(input.pickupPlace, 120) ?? request.origin;
    assertNoForbiddenSensitiveInfo({ 픽업장소: pickupPlace });
    const member = await tx.mobilityGroupMember.create({
      data: {
        groupId: group.id,
        requestId: request.id,
        residentId: request.residentId,
        pickupOrder,
        pickupPlace,
        pickupEta: parseOptionalDateTime(input.pickupEta),
      },
    });
    await tx.mobilityRequest.update({
      where: { id: request.id },
      data: { status: "GROUP_READY" },
    });
    await writeAuditLog(tx, {
      userId: user.id,
      action: "ASSIGN",
      targetType: "MobilityGroup",
      targetId: group.id,
      afterValue: {
        memberId: member.id,
        requestId: request.id,
        pickupOrder,
      },
    });
    return member;
  });
}

export async function removeMemberFromGroup(user: AuthUser, groupId: string, memberId: string) {
  assertPermission(user, "group:write");

  return prisma.$transaction(async (tx) => {
    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(groupId, 80), deletedAt: null },
      include: { members: { orderBy: { pickupOrder: "asc" } } },
    });
    if (!group) {
      throw new Error("그룹을 찾을 수 없습니다.");
    }
    const member = group.members.find((entry) => entry.id === cleanText(memberId, 80));
    if (!member) {
      throw new Error("그룹 멤버를 찾을 수 없습니다.");
    }

    await tx.mobilityGroupMember.delete({ where: { id: member.id } });
    await tx.mobilityRequest.update({
      where: { id: member.requestId },
      data: { status: "RECRUITING" },
    });

    const remainingMembers = group.members.filter((entry) => entry.id !== member.id);
    for (const [index, remainingMember] of remainingMembers.entries()) {
      await tx.mobilityGroupMember.update({
        where: { id: remainingMember.id },
        data: { pickupOrder: index + 1 },
      });
    }

    await writeAuditLog(tx, {
      userId: user.id,
      action: "UNASSIGN",
      targetType: "MobilityGroup",
      targetId: group.id,
      afterValue: {
        memberId: member.id,
        requestId: member.requestId,
      },
    });
  });
}

export async function updatePickupOrder(user: AuthUser, input: UpdatePickupInput) {
  assertPermission(user, "group:write");
  if (!Number.isInteger(input.pickupOrder) || input.pickupOrder < 1) {
    throw new Error("픽업 순서는 1 이상의 정수여야 합니다.");
  }

  return prisma.$transaction(async (tx) => {
    const settings = await getOperatingSettings(tx);
    if (input.pickupOrder > settings.maxGroupResidents) {
      throw new Error(`픽업 순서는 ${settings.maxGroupResidents}번까지 가능합니다.`);
    }

    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(input.groupId, 80), deletedAt: null },
      include: { members: true },
    });
    if (!group) {
      throw new Error("그룹을 찾을 수 없습니다.");
    }
    const member = group.members.find((entry) => entry.id === cleanText(input.memberId, 80));
    if (!member) {
      throw new Error("그룹 멤버를 찾을 수 없습니다.");
    }
    const occupyingMember = group.members.find(
      (entry) => entry.pickupOrder === input.pickupOrder && entry.id !== member.id,
    );

    if (occupyingMember) {
      await tx.mobilityGroupMember.update({
        where: { id: member.id },
        data: { pickupOrder: temporaryPickupOrder },
      });
      await tx.mobilityGroupMember.update({
        where: { id: occupyingMember.id },
        data: { pickupOrder: member.pickupOrder },
      });
    }

    const pickupPlace = requireText("픽업 장소", input.pickupPlace, 120);
    assertNoForbiddenSensitiveInfo({ 픽업장소: pickupPlace });
    const updated = await tx.mobilityGroupMember.update({
      where: { id: member.id },
      data: {
        pickupOrder: input.pickupOrder,
        pickupPlace,
        pickupEta: parseOptionalDateTime(input.pickupEta),
      },
    });

    await writeAuditLog(tx, {
      userId: user.id,
      action: "UPDATE",
      targetType: "MobilityGroup",
      targetId: group.id,
      beforeValue: member,
      afterValue: updated,
      note: "픽업 순서와 장소 변경",
    });
    return updated;
  });
}

export async function transitionGroupStatus(user: AuthUser, input: TransitionGroupStatusInput) {
  assertPermission(user, "group:write");
  const nextStatus = parseMobilityStatus(input.nextStatus);
  const reason = optionalCleanText(input.reason, 300);
  assertNoForbiddenSensitiveInfo({ 상태변경사유: reason });

  return prisma.$transaction(async (tx) => {
    const group = await tx.mobilityGroup.findFirst({
      where: { id: cleanText(input.groupId, 80), deletedAt: null },
    });
    if (!group) {
      throw new Error("그룹을 찾을 수 없습니다.");
    }
    if (!canTransitionMobilityStatus(group.status, nextStatus)) {
      throw new Error("허용되지 않은 상태 변경입니다.");
    }
    if (requiresStatusReason(nextStatus) && !reason) {
      throw new Error("취소 또는 예외 상태는 사유를 입력해야 합니다.");
    }

    const updated = await tx.mobilityGroup.update({
      where: { id: group.id },
      data: {
        status: nextStatus,
        exceptionReason: reason,
      },
    });
    await syncGroupRequestStatuses(tx, group.id, nextStatus);

    await writeAuditLog(tx, {
      userId: user.id,
      action: "STATUS_CHANGE",
      targetType: "MobilityGroup",
      targetId: group.id,
      beforeValue: { status: group.status, exceptionReason: group.exceptionReason },
      afterValue: {
        status: updated.status,
        exceptionReason: updated.exceptionReason,
        syncedActiveRequests: true,
      },
    });
    return updated;
  });
}

export const previewGroupCandidates: GroupCandidateRequest[] = [
  {
    id: "preview-request-1",
    residentName: "홍길순",
    villageName: "백천마을",
    phoneMasked: "010-****-5678",
    desiredDate: "2026-06-03",
    desiredTimeWindow: "오전",
    origin: "백천마을 회관",
    destination: "백천종합병원",
    statusLabel: "신청접수",
  },
  {
    id: "preview-request-2",
    residentName: "박순자",
    villageName: "백천마을",
    phoneMasked: "010-****-2222",
    desiredDate: "2026-06-03",
    desiredTimeWindow: "오전",
    origin: "백천마을 입구",
    destination: "백천종합병원",
    statusLabel: "신청접수",
  },
];

export const previewGroups: MobilityGroupListItem[] = [
  {
    id: "preview-group",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    serviceDate: "2026-06-03",
    timeWindow: "오전",
    destinationSummary: "백천종합병원",
    returnEta: "2026-06-03T13:30",
    status: "GROUP_READY",
    statusLabel: "그룹확정",
    exceptionReason: "",
    notes: "시연용 공동예약 그룹",
    memberCount: 1,
    members: [
      {
        id: "preview-member",
        requestId: "preview-request",
        residentName: "홍길순",
        phoneMasked: "010-****-5678",
        pickupOrder: 1,
        pickupEta: "2026-06-03T09:00",
        pickupPlace: "백천마을 회관",
        returnConfirmedAt: "",
        memberStatus: "ACTIVE",
      },
    ],
    nextStatuses: [
      { value: "LINKER_RECRUITING", label: "링커모집" },
      { value: "CANCELED_BY_OPERATOR", label: "운영취소" },
    ],
  },
];

export function getDefaultMaxGroupResidents() {
  return DEFAULT_OPERATING_SETTINGS.maxGroupResidents;
}
