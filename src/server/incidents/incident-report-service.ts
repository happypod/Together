import {
  type IncidentType as PrismaIncidentType,
  type Prisma,
} from "@prisma/client";
import {
  assertPermission,
  AuthorizationError,
  type AuthUser,
} from "@/domain/auth/permissions";
import {
  INCIDENT_TYPE_LABELS,
  type IncidentType,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo, maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

export type IncidentReportInput = {
  groupId?: string | null;
  incidentType?: string | null;
  occurredAt?: string | Date | null;
  description?: string | null;
  actionTaken?: string | null;
};

export type IncidentReportListItem = {
  id: string;
  groupId: string;
  incidentType: IncidentType;
  incidentTypeLabel: string;
  occurredAt: string;
  description: string;
  actionTaken: string;
  reportedByName: string;
  createdAt: string;
};

type IncidentReportRecord = Prisma.IncidentReportGetPayload<{
  include: {
    reportedBy: {
      select: {
        name: true;
      };
    };
  };
}>;

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

function parseIncidentType(value: unknown): PrismaIncidentType {
  const incidentType = requireText("사고·민원 유형", value, 40) as IncidentType;
  if (!(incidentType in INCIDENT_TYPE_LABELS)) {
    throw new Error("사고·민원 유형을 다시 선택해 주세요.");
  }
  return incidentType as PrismaIncidentType;
}

function parseOccurredAt(value: IncidentReportInput["occurredAt"]) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("발생 시각을 다시 확인해 주세요.");
    }
    return value;
  }

  const text = optionalCleanText(value, 40);
  if (!text) {
    return new Date();
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error("발생 시각을 다시 확인해 주세요.");
  }
  return date;
}

function formatDateTimeDisplay(date?: Date | null) {
  return date ? date.toLocaleString("ko-KR") : "";
}

function normalizePhone(phone?: string | null) {
  return String(phone ?? "").replace(/\D/g, "");
}

function incidentLabel(incidentType: PrismaIncidentType) {
  return INCIDENT_TYPE_LABELS[incidentType as IncidentType];
}

export function toIncidentReportListItem(record: IncidentReportRecord): IncidentReportListItem {
  const incidentType = record.incidentType as IncidentType;
  return {
    id: record.id,
    groupId: record.groupId,
    incidentType,
    incidentTypeLabel: incidentLabel(record.incidentType),
    occurredAt: formatDateTimeDisplay(record.occurredAt),
    description: record.description,
    actionTaken: record.actionTaken ?? "",
    reportedByName: record.reportedBy.name,
    createdAt: formatDateTimeDisplay(record.createdAt),
  };
}

async function assertCanReportForGroup(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  groupId: string,
) {
  assertPermission(user, "incident:write");

  const group = await tx.mobilityGroup.findFirst({
    where: { id: groupId, deletedAt: null },
    select: {
      id: true,
      groupName: true,
      linker: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });
  if (!group) {
    throw new Error("사고·민원을 연결할 운행 그룹을 찾을 수 없습니다.");
  }

  if (user.role !== "LINKER") {
    return group;
  }

  const actor = await tx.user.findUnique({
    where: { id: user.id },
    select: {
      isActive: true,
      phone: true,
    },
  });
  const actorPhone = normalizePhone(actor?.phone);
  const linkerPhone = normalizePhone(group.linker?.phone);
  if (!actor?.isActive || !actorPhone || !linkerPhone || actorPhone !== linkerPhone) {
    throw new AuthorizationError("배정된 동행링커만 이 운행의 사고·민원을 입력할 수 있습니다.");
  }

  return group;
}

export async function recordIncidentReportTx(
  tx: Prisma.TransactionClient,
  user: AuthUser,
  input: IncidentReportInput,
) {
  const groupId = requireText("운행 그룹", input.groupId, 80);
  const group = await assertCanReportForGroup(tx, user, groupId);
  const incidentType = parseIncidentType(input.incidentType);
  const occurredAt = parseOccurredAt(input.occurredAt);
  const description = requireText("사고·민원 내용", input.description, 600);
  const actionTaken = optionalCleanText(input.actionTaken, 500);

  assertNoForbiddenSensitiveInfo({
    "사고·민원 내용": description,
    "조치 내용": actionTaken,
  });

  const report = await tx.incidentReport.create({
    data: {
      groupId: group.id,
      incidentType,
      occurredAt,
      description,
      actionTaken: actionTaken ?? null,
      reportedByUserId: user.id,
    },
    include: {
      reportedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  await writeAuditLog(tx, {
    userId: user.id,
    action: "CREATE",
    targetType: "IncidentReport",
    targetId: report.id,
    afterValue: {
      groupId: group.id,
      groupName: group.groupName,
      incidentType,
      incidentTypeLabel: incidentLabel(incidentType),
      occurredAt,
      descriptionLength: description.length,
      hasActionTaken: Boolean(actionTaken),
      ...(user.role === "LINKER"
        ? { reportedByPhoneMasked: maskPhone(group.linker?.phone) }
        : {}),
    },
    note: `${incidentLabel(incidentType)} 기록`,
  });

  return toIncidentReportListItem(report);
}

export async function createIncidentReport(user: AuthUser, input: IncidentReportInput) {
  return prisma.$transaction((tx) => recordIncidentReportTx(tx, user, input));
}

export async function listIncidentReportsForGroups(groupIds: string[]) {
  const uniqueIds = [...new Set(groupIds)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return {};
  }

  const reports = await prisma.incidentReport.findMany({
    where: {
      groupId: {
        in: uniqueIds,
      },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    include: {
      reportedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  const byGroup: Record<string, IncidentReportListItem[]> = {};
  for (const report of reports) {
    const item = toIncidentReportListItem(report);
    byGroup[item.groupId] = [...(byGroup[item.groupId] ?? []), item];
  }
  return byGroup;
}

export async function listReportIncidentRecords(groupIds: string[]) {
  const uniqueIds = [...new Set(groupIds)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return [];
  }
  return prisma.incidentReport.findMany({
    where: {
      groupId: {
        in: uniqueIds,
      },
    },
    select: {
      groupId: true,
    },
  });
}
