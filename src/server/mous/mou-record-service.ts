import {
  type FileType,
  type MouStatus as PrismaMouStatus,
  type Prisma,
} from "@prisma/client";
import {
  assertPermission,
  AuthorizationError,
  type AuthUser,
} from "@/domain/auth/permissions";
import {
  MOU_STATUS_LABELS,
  MOU_STATUSES,
  type MouStatus,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { createFileAttachment } from "@/server/files/file-attachment-service";
import { getMonthRange } from "@/server/reports/report-calculator";

export type MouRecordFilters = {
  month?: string;
  status?: string;
};

export type MouRecordInput = {
  id?: string | null;
  organizationName?: string | null;
  partnerType?: string | null;
  signedAt?: string | Date | null;
  startAt?: string | Date | null;
  endAt?: string | Date | null;
  status?: string | null;
  scopeSummary?: string | null;
  documentUrl?: string | null;
  documentLabel?: string | null;
  attachmentFileName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSizeBytes?: string | number | null;
};

export type MouRecordListItem = {
  id: string;
  organizationName: string;
  partnerType: string;
  signedAt: string;
  startAt: string;
  endAt: string;
  status: MouStatus;
  statusLabel: string;
  scopeSummary: string;
  documentUrl: string;
  documentLabel: string;
  documentAvailable: boolean;
  attachmentCount: number;
  createdByName: string;
  createdAt: string;
};

export type MouRecordSummary = {
  month: string;
  totalCount: number;
  activeCount: number;
  renewalDueCount: number;
  expiredCount: number;
  documentCount: number;
};

export type MouRecordView = {
  filters: Required<MouRecordFilters>;
  records: MouRecordListItem[];
  summary: MouRecordSummary;
  viewerLimited: boolean;
};

type MouRecordWithCreator = Prisma.MouRecordGetPayload<{
  include: {
    createdBy: {
      select: {
        name: true;
      };
    };
  };
}>;

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

function parseDateOnly(label: string, value: MouRecordInput["signedAt"]) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`${label}을 다시 확인해 주세요.`);
    }
    return value;
  }

  const text = requireText(label, value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${label}은 YYYY-MM-DD 형식이어야 합니다.`);
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label}을 다시 확인해 주세요.`);
  }
  return date;
}

function optionalDateOnly(label: string, value: MouRecordInput["startAt"]) {
  const text = optionalCleanText(value, 10);
  return text ? parseDateOnly(label, text) : undefined;
}

function formatDateOnly(date?: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatDateTimeDisplay(date?: Date | null) {
  return date ? date.toLocaleString("ko-KR") : "";
}

function parseStatus(value: unknown): PrismaMouStatus {
  const status = requireText("MOU 상태", value, 20) as MouStatus;
  if (!MOU_STATUSES.includes(status)) {
    throw new Error("MOU 상태를 다시 선택해 주세요.");
  }
  return status as PrismaMouStatus;
}

function optionalStatus(value: unknown) {
  const status = optionalCleanText(value, 20);
  return status ? parseStatus(status) : undefined;
}

function parseOptionalPositiveInteger(label: string, value: unknown) {
  const text = optionalCleanText(value, 20);
  if (!text) {
    return undefined;
  }
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${label}은 1 이상의 정수로 입력해 주세요.`);
  }
  return number;
}

function normalizeDocumentUrl(value: unknown) {
  const text = optionalCleanText(value, 300);
  if (!text) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error("문서 링크는 http 또는 https 주소여야 합니다.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("문서 링크는 http 또는 https 주소여야 합니다.");
  }
  return url.toString();
}

function assertCanWrite(user: AuthUser) {
  assertPermission(user, "setting:manage");
  if (!["SUPER_ADMIN", "ANCHOR_ADMIN"].includes(user.role)) {
    throw new AuthorizationError("MOU 기록은 운영 책임자 권한에서만 저장할 수 있습니다.");
  }
}

function auditValue(record: {
  id: string;
  organizationName: string;
  partnerType: string | null;
  signedAt: Date;
  startAt: Date | null;
  endAt: Date | null;
  status: PrismaMouStatus;
  scopeSummary: string | null;
  documentUrl: string | null;
  documentLabel: string | null;
}) {
  return {
    id: record.id,
    organizationName: record.organizationName,
    partnerType: record.partnerType,
    signedAt: formatDateOnly(record.signedAt),
    startAt: formatDateOnly(record.startAt),
    endAt: formatDateOnly(record.endAt),
    status: record.status,
    hasScopeSummary: Boolean(record.scopeSummary),
    hasDocumentUrl: Boolean(record.documentUrl),
    documentLabel: record.documentLabel,
  };
}

function toListItem(
  record: MouRecordWithCreator,
  attachmentCount = 0,
  viewerLimited = false,
): MouRecordListItem {
  const status = record.status as MouStatus;
  const documentAvailable = Boolean(record.documentUrl) || attachmentCount > 0;
  return {
    id: record.id,
    organizationName: record.organizationName,
    partnerType: record.partnerType ?? "",
    signedAt: formatDateOnly(record.signedAt),
    startAt: formatDateOnly(record.startAt),
    endAt: formatDateOnly(record.endAt),
    status,
    statusLabel: MOU_STATUS_LABELS[status],
    scopeSummary: viewerLimited ? "" : record.scopeSummary ?? "",
    documentUrl: viewerLimited ? "" : record.documentUrl ?? "",
    documentLabel: record.documentLabel ?? "",
    documentAvailable,
    attachmentCount,
    createdByName: viewerLimited ? "" : record.createdBy.name,
    createdAt: formatDateTimeDisplay(record.createdAt),
  };
}

function summarizeMouRecords(
  month: string,
  records: Pick<MouRecordListItem, "status" | "documentAvailable">[],
): MouRecordSummary {
  return {
    month,
    totalCount: records.length,
    activeCount: records.filter((record) => record.status === "ACTIVE").length,
    renewalDueCount: records.filter((record) => record.status === "RENEWAL_DUE").length,
    expiredCount: records.filter((record) => record.status === "EXPIRED").length,
    documentCount: records.filter((record) => record.documentAvailable).length,
  };
}

async function countAttachmentsByTargetId(targetIds: string[]) {
  if (targetIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.fileAttachment.groupBy({
    by: ["targetId"],
    where: {
      targetType: "MouRecord",
      targetId: {
        in: targetIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(rows.map((row) => [row.targetId, row._count._all]));
}

function buildAttachmentInput(input: MouRecordInput, documentUrl: string | undefined) {
  const fileName = optionalCleanText(input.attachmentFileName, 120);
  const mimeType = optionalCleanText(input.attachmentMimeType, 80);
  const sizeBytes = parseOptionalPositiveInteger("문서 파일 크기", input.attachmentSizeBytes);
  const hasAnyAttachmentInput = Boolean(fileName || mimeType || sizeBytes);

  if (!hasAnyAttachmentInput) {
    return null;
  }
  if (!fileName || !mimeType || !sizeBytes || !documentUrl) {
    throw new Error("문서 첨부 기록은 파일명, 형식, 크기, 문서 링크를 함께 입력해 주세요.");
  }

  return {
    fileName,
    mimeType,
    sizeBytes,
    url: documentUrl,
  };
}

export async function saveMouRecord(user: AuthUser, input: MouRecordInput) {
  assertCanWrite(user);

  const recordId = optionalCleanText(input.id, 80);
  const organizationName = requireText("기관명", input.organizationName, 100);
  const partnerType = optionalCleanText(input.partnerType, 80);
  const signedAt = parseDateOnly("체결일", input.signedAt);
  const startAt = optionalDateOnly("시작일", input.startAt);
  const endAt = optionalDateOnly("종료일", input.endAt);
  const status = parseStatus(input.status);
  const scopeSummary = optionalCleanText(input.scopeSummary, 200);
  const documentUrl = normalizeDocumentUrl(input.documentUrl);
  const documentLabel = optionalCleanText(input.documentLabel, 100);
  const attachmentInput = buildAttachmentInput(input, documentUrl);

  if (startAt && endAt && startAt > endAt) {
    throw new Error("시작일은 종료일보다 늦을 수 없습니다.");
  }

  assertNoForbiddenSensitiveInfo({
    기관명: organizationName,
    "기관 유형": partnerType,
    "협력 범위": scopeSummary,
    "문서명": documentLabel,
    "문서 링크": documentUrl,
    "첨부 파일명": attachmentInput?.fileName,
  });

  return prisma.$transaction(async (tx) => {
    const before = recordId
      ? await tx.mouRecord.findUnique({
          where: {
            id: recordId,
          },
        })
      : null;
    if (recordId && !before) {
      throw new Error("수정할 MOU 기록을 찾을 수 없습니다.");
    }

    const data = {
      organizationName,
      partnerType: partnerType ?? null,
      signedAt,
      startAt: startAt ?? null,
      endAt: endAt ?? null,
      status,
      scopeSummary: scopeSummary ?? null,
      documentUrl: documentUrl ?? null,
      documentLabel: documentLabel ?? null,
    };

    const saved = before
      ? await tx.mouRecord.update({
          where: {
            id: before.id,
          },
          data,
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        })
      : await tx.mouRecord.create({
          data: {
            ...data,
            createdByUserId: user.id,
          },
          include: {
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
      targetType: "MouRecord",
      targetId: saved.id,
      beforeValue: before ? auditValue(before) : undefined,
      afterValue: auditValue(saved),
      note: `${saved.organizationName} MOU ${MOU_STATUS_LABELS[saved.status as MouStatus]}`,
    });

    if (attachmentInput) {
      await createFileAttachment(
        user,
        {
          targetType: "MouRecord",
          targetId: saved.id,
          fileType: "OTHER" as FileType,
          fileName: attachmentInput.fileName,
          mimeType: attachmentInput.mimeType,
          sizeBytes: attachmentInput.sizeBytes,
          url: attachmentInput.url,
        },
        tx,
      );
    }

    return toListItem(saved, attachmentInput ? 1 : 0, false);
  });
}

export async function listMouRecords(
  user: AuthUser,
  filters: MouRecordFilters = {},
): Promise<MouRecordView> {
  assertPermission(user, "report:read");

  const month = parseMonth(filters.month);
  const status = optionalStatus(filters.status);
  const { startsAt, endsBefore } = getMonthRange(month);
  const where: Prisma.MouRecordWhereInput = {
    signedAt: {
      gte: startsAt,
      lt: endsBefore,
    },
    ...(status ? { status } : {}),
  };

  const records = await prisma.mouRecord.findMany({
    where,
    orderBy: [{ signedAt: "desc" }, { updatedAt: "desc" }],
    take: 120,
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });
  const attachmentCounts = await countAttachmentsByTargetId(records.map((record) => record.id));
  const viewerLimited = user.role === "VIEWER";
  const items = records.map((record) =>
    toListItem(record, attachmentCounts.get(record.id) ?? 0, viewerLimited),
  );

  return {
    filters: {
      month,
      status: status ?? "",
    },
    records: items,
    summary: summarizeMouRecords(month, items),
    viewerLimited,
  };
}

export async function listReportMouRecords(months: string[] = []) {
  const ranges = months.map((month) => getMonthRange(parseMonth(month)));
  const where: Prisma.MouRecordWhereInput =
    ranges.length > 0
      ? {
          OR: ranges.map((range) => ({
            signedAt: {
              gte: range.startsAt,
              lt: range.endsBefore,
            },
          })),
        }
      : {};

  return prisma.mouRecord.findMany({
    where,
    select: {
      signedAt: true,
      status: true,
    },
  });
}

export const previewMouRecords: MouRecordListItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000601",
    organizationName: "백천보건지소",
    partnerType: "공공기관",
    signedAt: "2026-06-02",
    startAt: "2026-06-02",
    endAt: "2027-06-01",
    status: "ACTIVE",
    statusLabel: "유효",
    scopeSummary: "동행 이동 연계와 안전 안내 협력",
    documentUrl: "https://example.com/mou/baekcheon-health.pdf",
    documentLabel: "협력 확인서",
    documentAvailable: true,
    attachmentCount: 1,
    createdByName: "운영 관리자",
    createdAt: "2026. 6. 2. 오전 10:00:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000602",
    organizationName: "백천택시협동조합",
    partnerType: "교통 협력기관",
    signedAt: "2026-06-10",
    startAt: "2026-06-10",
    endAt: "2026-12-31",
    status: "RENEWAL_DUE",
    statusLabel: "갱신 필요",
    scopeSummary: "공동예약 운영 기준 확인",
    documentUrl: "",
    documentLabel: "",
    documentAvailable: false,
    attachmentCount: 0,
    createdByName: "운영 관리자",
    createdAt: "2026. 6. 10. 오후 2:30:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000603",
    organizationName: "백천상생일자리센터",
    partnerType: "일자리 협력기관",
    signedAt: "2026-06-18",
    startAt: "2026-06-18",
    endAt: "",
    status: "ACTIVE",
    statusLabel: "유효",
    scopeSummary: "동행링커 취업연계 안내 협력",
    documentUrl: "https://example.com/mou/baekcheon-job.pdf",
    documentLabel: "MOU 문서",
    documentAvailable: true,
    attachmentCount: 0,
    createdByName: "운영 관리자",
    createdAt: "2026. 6. 18. 오전 11:20:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000604",
    organizationName: "백천생활지원센터",
    partnerType: "복지 협력기관",
    signedAt: "2026-05-20",
    startAt: "2026-05-20",
    endAt: "2026-05-31",
    status: "EXPIRED",
    statusLabel: "기간 만료",
    scopeSummary: "시범 운영 협력 종료",
    documentUrl: "",
    documentLabel: "",
    documentAvailable: false,
    attachmentCount: 0,
    createdByName: "운영 관리자",
    createdAt: "2026. 5. 20. 오후 1:10:00",
  },
];

export const previewReportMouRecords = previewMouRecords.map((record) => ({
  signedAt: record.signedAt,
  status: record.status,
}));

export function createPreviewMouRecordView(
  filters: MouRecordFilters = {},
  options: { viewerLimited?: boolean } = {},
): MouRecordView {
  const month = parseMonth(filters.month ?? "2026-06");
  const status = optionalStatus(filters.status);
  const records = previewMouRecords
    .filter((record) => {
      if (!record.signedAt.startsWith(month)) {
        return false;
      }
      if (status && record.status !== status) {
        return false;
      }
      return true;
    })
    .map((record) => ({
      ...record,
      scopeSummary: options.viewerLimited ? "" : record.scopeSummary,
      documentUrl: options.viewerLimited ? "" : record.documentUrl,
      createdByName: options.viewerLimited ? "" : record.createdByName,
    }));

  return {
    filters: {
      month,
      status: status ?? "",
    },
    records,
    summary: summarizeMouRecords(month, records),
    viewerLimited: Boolean(options.viewerLimited),
  };
}
