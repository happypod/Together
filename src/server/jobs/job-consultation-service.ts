import {
  type JobConsultationStatus as PrismaJobConsultationStatus,
  type JobConsultationTargetType as PrismaJobConsultationTargetType,
  type Prisma,
} from "@prisma/client";
import {
  assertPermission,
  AuthorizationError,
  hasPermission,
  type AuthUser,
} from "@/domain/auth/permissions";
import {
  JOB_CONSULTATION_STATUS_LABELS,
  JOB_CONSULTATION_STATUSES,
  JOB_CONSULTATION_TARGET_TYPE_LABELS,
  JOB_CONSULTATION_TARGET_TYPES,
  type JobConsultationStatus,
  type JobConsultationTargetType,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { getMonthRange } from "@/server/reports/report-calculator";

export type JobConsultationFilters = {
  month?: string;
  status?: string;
  targetType?: string;
};

export type JobConsultationInput = {
  id?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  consultedAt?: string | Date | null;
  field?: string | null;
  status?: string | null;
  organization?: string | null;
  supportSummary?: string | null;
};

export type JobConsultationListItem = {
  id: string;
  targetType: JobConsultationTargetType;
  targetTypeLabel: string;
  targetId: string;
  targetName: string;
  villageName: string;
  field: string;
  status: JobConsultationStatus;
  statusLabel: string;
  consultedAt: string;
  organization: string;
  supportSummary: string;
  createdByName: string;
  createdAt: string;
};

export type JobConsultationTargetOption = {
  id: string;
  targetType: JobConsultationTargetType;
  label: string;
  helper: string;
};

export type JobConsultationSummary = {
  month: string;
  totalCount: number;
  linkerCount: number;
  residentCount: number;
  connectedCount: number;
  inProgressCount: number;
  closedCount: number;
};

export type JobConsultationView = {
  filters: Required<JobConsultationFilters>;
  records: JobConsultationListItem[];
  targetOptions: JobConsultationTargetOption[];
  summary: JobConsultationSummary;
};

type JobConsultationRecord = Prisma.JobConsultationGetPayload<{
  include: {
    linker: {
      select: {
        id: true;
        name: true;
        villageName: true;
        desiredJobField: true;
      };
    };
    resident: {
      select: {
        id: true;
        name: true;
        villageName: true;
      };
    };
    createdBy: {
      select: {
        name: true;
      };
    };
  };
}>;

const previewUserName = "운영 관리자";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

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

function parseMonth(value?: string | null) {
  const month = cleanText(value, 7) || currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("조회 월은 YYYY-MM 형식이어야 합니다.");
  }
  getMonthRange(month);
  return month;
}

function parseDateOnly(value: JobConsultationInput["consultedAt"]) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("기록일을 다시 확인해 주세요.");
    }
    return value;
  }

  const text = requireText("기록일", value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("기록일은 YYYY-MM-DD 형식이어야 합니다.");
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("기록일을 다시 확인해 주세요.");
  }
  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeDisplay(date?: Date | null) {
  return date ? date.toLocaleString("ko-KR") : "";
}

function parseTargetType(value: unknown): PrismaJobConsultationTargetType {
  const targetType = requireText("대상 유형", value, 20) as JobConsultationTargetType;
  if (!JOB_CONSULTATION_TARGET_TYPES.includes(targetType)) {
    throw new Error("대상 유형을 다시 선택해 주세요.");
  }
  return targetType as PrismaJobConsultationTargetType;
}

function optionalTargetType(value: unknown) {
  const targetType = optionalCleanText(value, 20);
  return targetType ? parseTargetType(targetType) : undefined;
}

function parseStatus(value: unknown): PrismaJobConsultationStatus {
  const status = requireText("진행 상태", value, 20) as JobConsultationStatus;
  if (!JOB_CONSULTATION_STATUSES.includes(status)) {
    throw new Error("진행 상태를 다시 선택해 주세요.");
  }
  return status as PrismaJobConsultationStatus;
}

function optionalStatus(value: unknown) {
  const status = optionalCleanText(value, 20);
  return status ? parseStatus(status) : undefined;
}

function assertCanWrite(user: AuthUser) {
  assertPermission(user, "contact-log:write");
  if (!["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"].includes(user.role)) {
    throw new AuthorizationError("취업연계 상담관리는 운영 담당자 권한에서만 저장할 수 있습니다.");
  }
}

function hasWriteAccess(user: AuthUser | null | undefined) {
  return (
    hasPermission(user, "contact-log:write") &&
    Boolean(user && ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"].includes(user.role))
  );
}

function targetLabel(record: JobConsultationRecord) {
  if (record.targetType === "LINKER") {
    return {
      id: record.linker?.id ?? "",
      name: record.linker?.name ?? "삭제된 동행링커",
      villageName: record.linker?.villageName ?? "",
    };
  }

  return {
    id: record.resident?.id ?? "",
    name: record.resident?.name ?? "삭제된 주민",
    villageName: record.resident?.villageName ?? "",
  };
}

function toListItem(record: JobConsultationRecord): JobConsultationListItem {
  const target = targetLabel(record);
  const targetType = record.targetType as JobConsultationTargetType;
  const status = record.status as JobConsultationStatus;
  return {
    id: record.id,
    targetType,
    targetTypeLabel: JOB_CONSULTATION_TARGET_TYPE_LABELS[targetType],
    targetId: target.id,
    targetName: target.name,
    villageName: target.villageName,
    field: record.field,
    status,
    statusLabel: JOB_CONSULTATION_STATUS_LABELS[status],
    consultedAt: formatDateOnly(record.consultedAt),
    organization: record.organization ?? "",
    supportSummary: record.supportSummary ?? "",
    createdByName: record.createdBy.name,
    createdAt: formatDateTimeDisplay(record.createdAt),
  };
}

function summarizeJobConsultations(
  month: string,
  records: Pick<JobConsultationListItem, "targetType" | "status">[],
): JobConsultationSummary {
  return {
    month,
    totalCount: records.length,
    linkerCount: records.filter((record) => record.targetType === "LINKER").length,
    residentCount: records.filter((record) => record.targetType === "RESIDENT").length,
    connectedCount: records.filter((record) => record.status === "CONNECTED").length,
    inProgressCount: records.filter((record) => record.status === "IN_PROGRESS").length,
    closedCount: records.filter((record) => record.status === "CLOSED").length,
  };
}

async function findTarget(
  tx: Prisma.TransactionClient,
  targetType: PrismaJobConsultationTargetType,
  targetId: string,
) {
  if (targetType === "LINKER") {
    const linker = await tx.linker.findFirst({
      where: {
        id: targetId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        villageName: true,
      },
    });
    if (!linker) {
      throw new Error("선택한 동행링커를 찾을 수 없습니다.");
    }
    return linker;
  }

  const resident = await tx.resident.findFirst({
    where: {
      id: targetId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      villageName: true,
    },
  });
  if (!resident) {
    throw new Error("선택한 주민을 찾을 수 없습니다.");
  }
  return resident;
}

function auditValue(record: {
  id: string;
  targetType: PrismaJobConsultationTargetType;
  linkerId: string | null;
  residentId: string | null;
  field: string;
  status: PrismaJobConsultationStatus;
  consultedAt: Date;
  organization: string | null;
  supportSummary: string | null;
}) {
  return {
    id: record.id,
    targetType: record.targetType,
    linkerId: record.linkerId,
    residentId: record.residentId,
    field: record.field,
    status: record.status,
    consultedAt: formatDateOnly(record.consultedAt),
    organization: record.organization,
    hasSupportSummary: Boolean(record.supportSummary),
  };
}

export async function saveJobConsultation(user: AuthUser, input: JobConsultationInput) {
  assertCanWrite(user);

  const recordId = optionalCleanText(input.id, 80);
  const targetType = parseTargetType(input.targetType);
  const targetId = requireText("대상", input.targetId, 80);
  const consultedAt = parseDateOnly(input.consultedAt);
  const field = requireText("연계 분야", input.field, 80);
  const status = parseStatus(input.status);
  const organization = optionalCleanText(input.organization, 80);
  const supportSummary = optionalCleanText(input.supportSummary, 140);

  assertNoForbiddenSensitiveInfo({
    "연계 분야": field,
    "연계 기관": organization,
    "지원 요약": supportSummary,
  });

  return prisma.$transaction(async (tx) => {
    const target = await findTarget(tx, targetType, targetId);
    const before = recordId
      ? await tx.jobConsultation.findUnique({
          where: {
            id: recordId,
          },
        })
      : null;
    if (recordId && !before) {
      throw new Error("수정할 취업연계 기록을 찾을 수 없습니다.");
    }

    const data = {
      targetType,
      linkerId: targetType === "LINKER" ? target.id : null,
      residentId: targetType === "RESIDENT" ? target.id : null,
      consultedAt,
      field,
      status,
      organization: organization ?? null,
      supportSummary: supportSummary ?? null,
    };

    const saved = before
      ? await tx.jobConsultation.update({
          where: {
            id: before.id,
          },
          data,
          include: {
            linker: {
              select: {
                id: true,
                name: true,
                villageName: true,
                desiredJobField: true,
              },
            },
            resident: {
              select: {
                id: true,
                name: true,
                villageName: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        })
      : await tx.jobConsultation.create({
          data: {
            ...data,
            createdByUserId: user.id,
          },
          include: {
            linker: {
              select: {
                id: true,
                name: true,
                villageName: true,
                desiredJobField: true,
              },
            },
            resident: {
              select: {
                id: true,
                name: true,
                villageName: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        });

    await writeAuditLog(tx, {
      userId: user.id,
      action: before ? "UPDATE" : "CREATE",
      targetType: "JobConsultation",
      targetId: saved.id,
      beforeValue: before ? auditValue(before) : undefined,
      afterValue: auditValue(saved),
      note: `${JOB_CONSULTATION_TARGET_TYPE_LABELS[saved.targetType as JobConsultationTargetType]} 취업연계 ${JOB_CONSULTATION_STATUS_LABELS[saved.status as JobConsultationStatus]}`,
    });

    return toListItem(saved);
  });
}

export async function listJobConsultationTargetOptions(): Promise<JobConsultationTargetOption[]> {
  const [linkers, residents] = await Promise.all([
    prisma.linker.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 120,
      select: {
        id: true,
        name: true,
        villageName: true,
        desiredJobField: true,
      },
    }),
    prisma.resident.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 120,
      select: {
        id: true,
        name: true,
        villageName: true,
      },
    }),
  ]);

  return [
    ...linkers.map((linker) => ({
      id: linker.id,
      targetType: "LINKER" as const,
      label: `${linker.name} · ${linker.villageName}`,
      helper: linker.desiredJobField ? `희망 분야 ${linker.desiredJobField}` : "희망 분야 미정",
    })),
    ...residents.map((resident) => ({
      id: resident.id,
      targetType: "RESIDENT" as const,
      label: `${resident.name} · ${resident.villageName}`,
      helper: "주민 이동 신청 기반",
    })),
  ];
}

export async function listJobConsultations(
  user: AuthUser,
  filters: JobConsultationFilters = {},
): Promise<JobConsultationView> {
  assertPermission(user, "report:read");

  const month = parseMonth(filters.month);
  const status = optionalStatus(filters.status);
  const targetType = optionalTargetType(filters.targetType);
  const { startsAt, endsBefore } = getMonthRange(month);
  const where: Prisma.JobConsultationWhereInput = {
    consultedAt: {
      gte: startsAt,
      lt: endsBefore,
    },
    ...(status ? { status } : {}),
    ...(targetType ? { targetType } : {}),
  };

  const [records, targetOptions] = await Promise.all([
    prisma.jobConsultation.findMany({
      where,
      orderBy: [{ consultedAt: "desc" }, { updatedAt: "desc" }],
      take: 120,
      include: {
        linker: {
          select: {
            id: true,
            name: true,
            villageName: true,
            desiredJobField: true,
          },
        },
        resident: {
          select: {
            id: true,
            name: true,
            villageName: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    hasWriteAccess(user) ? listJobConsultationTargetOptions() : Promise.resolve([]),
  ]);
  const items = records.map(toListItem);

  return {
    filters: {
      month,
      status: status ?? "",
      targetType: targetType ?? "",
    },
    records: items,
    targetOptions,
    summary: summarizeJobConsultations(month, items),
  };
}

export async function listReportJobConsultationRecords(months: string[] = []) {
  const ranges = months.map((month) => getMonthRange(parseMonth(month)));
  const where: Prisma.JobConsultationWhereInput =
    ranges.length > 0
      ? {
          OR: ranges.map((range) => ({
            consultedAt: {
              gte: range.startsAt,
              lt: range.endsBefore,
            },
          })),
        }
      : {};

  return prisma.jobConsultation.findMany({
    where,
    select: {
      consultedAt: true,
      status: true,
    },
  });
}

export const previewJobConsultationTargetOptions: JobConsultationTargetOption[] = [
  {
    id: "00000000-0000-4000-8000-000000000301",
    targetType: "LINKER",
    label: "김동행 · 백천1리",
    helper: "희망 분야 돌봄 보조",
  },
  {
    id: "00000000-0000-4000-8000-000000000302",
    targetType: "LINKER",
    label: "박연결 · 백천2리",
    helper: "희망 분야 시설 관리",
  },
  {
    id: "00000000-0000-4000-8000-000000000401",
    targetType: "RESIDENT",
    label: "이주민 · 백천3리",
    helper: "주민 이동 신청 기반",
  },
];

export const previewJobConsultationRecords: JobConsultationListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000501",
    targetType: "LINKER",
    targetTypeLabel: "동행링커",
    targetId: "00000000-0000-4000-8000-000000000301",
    targetName: "김동행",
    villageName: "백천1리",
    field: "돌봄 보조",
    status: "CONNECTED",
    statusLabel: "연계 완료",
    consultedAt: "2026-06-04",
    organization: "백천 상생일자리",
    supportSummary: "교육기관 안내와 면접 일정 연결",
    createdByName: previewUserName,
    createdAt: "2026. 6. 4. 오전 10:00:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000502",
    targetType: "RESIDENT",
    targetTypeLabel: "주민",
    targetId: "00000000-0000-4000-8000-000000000401",
    targetName: "이주민",
    villageName: "백천3리",
    field: "공공근로",
    status: "IN_PROGRESS",
    statusLabel: "진행",
    consultedAt: "2026-06-12",
    organization: "읍 행정복지센터",
    supportSummary: "신청 기간과 준비 서류 안내",
    createdByName: previewUserName,
    createdAt: "2026. 6. 12. 오후 2:30:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000503",
    targetType: "LINKER",
    targetTypeLabel: "동행링커",
    targetId: "00000000-0000-4000-8000-000000000302",
    targetName: "박연결",
    villageName: "백천2리",
    field: "시설 관리",
    status: "REQUESTED",
    statusLabel: "접수",
    consultedAt: "2026-06-20",
    organization: "",
    supportSummary: "희망 분야 확인",
    createdByName: previewUserName,
    createdAt: "2026. 6. 20. 오전 9:20:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000504",
    targetType: "LINKER",
    targetTypeLabel: "동행링커",
    targetId: "00000000-0000-4000-8000-000000000301",
    targetName: "김동행",
    villageName: "백천1리",
    field: "돌봄 보조",
    status: "CLOSED",
    statusLabel: "종료",
    consultedAt: "2026-05-21",
    organization: "백천 상생일자리",
    supportSummary: "다음 모집 시 재안내",
    createdByName: previewUserName,
    createdAt: "2026. 5. 21. 오전 11:30:00",
  },
];

export const previewReportJobConsultations = previewJobConsultationRecords.map((record) => ({
  consultedAt: record.consultedAt,
  status: record.status,
}));

export function createPreviewJobConsultationView(
  filters: JobConsultationFilters = {},
): JobConsultationView {
  const month = parseMonth(filters.month ?? "2026-06");
  const status = optionalStatus(filters.status);
  const targetType = optionalTargetType(filters.targetType);
  const records = previewJobConsultationRecords.filter((record) => {
    if (!record.consultedAt.startsWith(month)) {
      return false;
    }
    if (status && record.status !== status) {
      return false;
    }
    if (targetType && record.targetType !== targetType) {
      return false;
    }
    return true;
  });

  return {
    filters: {
      month,
      status: status ?? "",
      targetType: targetType ?? "",
    },
    records,
    targetOptions: previewJobConsultationTargetOptions,
    summary: summarizeJobConsultations(month, records),
  };
}
