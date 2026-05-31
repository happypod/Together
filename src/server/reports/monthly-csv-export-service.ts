import { type Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { maskPhone } from "@/domain/privacy";
import { type MobilityStatus } from "@/domain/definitions";
import { prisma } from "@/server/db/prisma";
import { getMonthRange, getReportMonth } from "@/server/reports/report-calculator";
import {
  MONTHLY_SUMMARY_CSV_COLUMNS,
  TRIP_DETAIL_CSV_COLUMNS,
  type CsvColumnContract,
} from "@/server/reports/report-contracts";
import {
  createPreviewMonthlyReport,
  getMonthlyReport,
  parseReportMonth,
  type MonthlyOperationReport,
} from "@/server/reports/monthly-report-service";
import { recordCsvExportAudit } from "@/server/reports/export-audit";
import { type ReportDateBasis } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export const MONTHLY_CSV_KINDS = ["summary", "trip-detail"] as const;
export const CSV_PRIVACY_MODES = ["minimum", "masked", "full"] as const;

export type MonthlyCsvKind = (typeof MONTHLY_CSV_KINDS)[number];
export type CsvPrivacyMode = (typeof CSV_PRIVACY_MODES)[number];

export type MonthlyCsvExportInput = {
  month?: string | null;
  kind?: string | null;
  reason?: string | null;
  privacyMode?: string | null;
};

export type MonthlyCsvExportResult = {
  kind: MonthlyCsvKind;
  month: string;
  privacyMode: CsvPrivacyMode;
  filename: string;
  contentType: string;
  csv: string;
  columns: string[];
  rowCount: number;
};

type TripDetailGroupRecord = {
  id: string;
  serviceDate: Date | string;
  timeWindow: string;
  groupName: string;
  destinationSummary: string;
  status: MobilityStatus;
  members: {
    memberStatus: "ACTIVE" | "CANCELED" | "NO_SHOW";
    residentId: string;
    returnConfirmedAt: Date | string | null;
    resident: {
      name: string;
      phone: string;
    };
  }[];
  linker: {
    name: string;
  } | null;
  taxiReservation: {
    actualFare: number | null;
    expectedFare: number | null;
  } | null;
  settlement: {
    residentPerPersonShare: number;
    anchorSupportAmount: number;
    communityFundSupportAmount: number | null;
  } | null;
};

const performanceStatuses = ["RETURN_CONFIRMED", "SETTLED", "REPORTED"] as const;

function parseCsvKind(value?: string | null): MonthlyCsvKind {
  const kind = String(value ?? "").trim();
  if (MONTHLY_CSV_KINDS.includes(kind as MonthlyCsvKind)) {
    return kind as MonthlyCsvKind;
  }
  throw new Error("CSV 종류를 다시 선택해 주세요.");
}

function parsePrivacyMode(value?: string | null): CsvPrivacyMode {
  const mode = String(value ?? "").trim() || "masked";
  if (CSV_PRIVACY_MODES.includes(mode as CsvPrivacyMode)) {
    return mode as CsvPrivacyMode;
  }
  throw new Error("개인정보 표시 범위를 다시 선택해 주세요.");
}

function normalizeReason(value?: string | null) {
  const reason = String(value ?? "").trim().slice(0, 300);
  if (!reason) {
    throw new Error("CSV 내보내기 사유를 입력해야 합니다.");
  }
  return reason;
}

function formatDateOnly(value?: Date | string | null) {
  if (!value) {
    return "";
  }
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function latestDateOnly(values: (Date | string | null)[]) {
  const timestamps = values
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return "";
  }
  return new Date(Math.max(...timestamps)).toISOString().slice(0, 10);
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n|\r/g, " ");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(columns: CsvColumnContract[], rows: Record<string, unknown>[]) {
  const header = columns.map((column) => csvCell(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => csvCell(row[column.key])).join(","));
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}

function buildMonthlySummaryRows(report: MonthlyOperationReport) {
  const snapshot = report.snapshot;
  return [
    {
      month: report.month,
      tripCount: snapshot.tripCount,
      monthlyResidentCount: snapshot.monthlyResidentCount,
      activeLinkerCount: snapshot.activeLinkerCount,
      averageFare: snapshot.averageFare,
      totalAnchorSupport: snapshot.totalAnchorSupport,
      averageResidentShare: snapshot.averageResidentShare,
      satisfactionAverage: snapshot.satisfactionAverage,
      incidentComplaintCount: snapshot.incidentComplaintCount,
      communityFundAmount: snapshot.communityFundAmount,
      jobConsultationCount: snapshot.jobConsultationCount,
      mouCount: snapshot.mouCount,
    },
  ];
}

function activeMembers(group: TripDetailGroupRecord) {
  return group.members.filter((member) => member.memberStatus !== "CANCELED");
}

function visibleNames(group: TripDetailGroupRecord, privacyMode: CsvPrivacyMode) {
  if (privacyMode === "minimum") {
    return "";
  }
  return activeMembers(group)
    .map((member) => member.resident.name)
    .join(" / ");
}

function visiblePhones(group: TripDetailGroupRecord, privacyMode: CsvPrivacyMode) {
  if (privacyMode === "minimum") {
    return "";
  }
  return activeMembers(group)
    .map((member) =>
      privacyMode === "full" ? member.resident.phone : maskPhone(member.resident.phone),
    )
    .join(" / ");
}

function visibleLinkerName(group: TripDetailGroupRecord, privacyMode: CsvPrivacyMode) {
  if (privacyMode === "minimum") {
    return "";
  }
  return group.linker?.name ?? "";
}

function buildTripDetailRows(groups: TripDetailGroupRecord[], privacyMode: CsvPrivacyMode) {
  return groups.map((group) => ({
    serviceDate: formatDateOnly(group.serviceDate),
    timeWindow: group.timeWindow,
    groupName: group.groupName,
    residentNames: visibleNames(group, privacyMode),
    residentPhones: visiblePhones(group, privacyMode),
    destinationSummary: group.destinationSummary,
    linkerName: visibleLinkerName(group, privacyMode),
    taxiActualFare: group.taxiReservation?.actualFare ?? group.taxiReservation?.expectedFare ?? "",
    residentPerPersonShare: group.settlement?.residentPerPersonShare ?? "",
    anchorSupportAmount: group.settlement?.anchorSupportAmount ?? "",
    communityFundSupportAmount: group.settlement?.communityFundSupportAmount ?? "",
    returnConfirmedAt: latestDateOnly(activeMembers(group).map((member) => member.returnConfirmedAt)),
  }));
}

function buildTripGroupWhere(
  month: string,
  reportDateBasis: ReportDateBasis,
): Prisma.MobilityGroupWhereInput {
  const { startsAt, endsBefore } = getMonthRange(month);
  const dateFilter =
    reportDateBasis === "serviceDate"
      ? {
          serviceDate: {
            gte: startsAt,
            lt: endsBefore,
          },
        }
      : {
          members: {
            some: {
              returnConfirmedAt: {
                gte: startsAt,
                lt: endsBefore,
              },
            },
          },
        };

  return {
    deletedAt: null,
    status: {
      in: [...performanceStatuses],
    },
    ...dateFilter,
  };
}

function groupMatchesMonth(
  group: TripDetailGroupRecord,
  month: string,
  reportDateBasis: ReportDateBasis,
) {
  return (
    getReportMonth(
      {
        id: group.id,
        serviceDate: group.serviceDate,
        status: group.status,
        members: group.members,
      },
      reportDateBasis,
    ) === month
  );
}

async function listTripDetailGroups(month: string, reportDateBasis: ReportDateBasis) {
  const groups = await prisma.mobilityGroup.findMany({
    where: buildTripGroupWhere(month, reportDateBasis),
    orderBy: [{ serviceDate: "asc" }, { updatedAt: "asc" }],
    take: 500,
    select: {
      id: true,
      serviceDate: true,
      timeWindow: true,
      groupName: true,
      destinationSummary: true,
      status: true,
      members: {
        orderBy: { pickupOrder: "asc" },
        select: {
          memberStatus: true,
          residentId: true,
          returnConfirmedAt: true,
          resident: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
      linker: {
        select: {
          name: true,
        },
      },
      taxiReservation: {
        select: {
          actualFare: true,
          expectedFare: true,
        },
      },
      settlement: {
        select: {
          residentPerPersonShare: true,
          anchorSupportAmount: true,
          communityFundSupportAmount: true,
        },
      },
    },
  });

  return groups.filter((group) => groupMatchesMonth(group, month, reportDateBasis));
}

function filenameFor(kind: MonthlyCsvKind, month: string, privacyMode: CsvPrivacyMode) {
  const suffix = kind === "summary" ? "monthly-summary" : `trip-detail-${privacyMode}`;
  return `together-${suffix}-${month}.csv`;
}

function buildResult(input: {
  kind: MonthlyCsvKind;
  month: string;
  privacyMode: CsvPrivacyMode;
  columns: CsvColumnContract[];
  rows: Record<string, unknown>[];
}): MonthlyCsvExportResult {
  return {
    kind: input.kind,
    month: input.month,
    privacyMode: input.privacyMode,
    filename: filenameFor(input.kind, input.month, input.privacyMode),
    contentType: "text/csv; charset=utf-8",
    csv: buildCsv(input.columns, input.rows),
    columns: input.columns.map((column) => column.key),
    rowCount: input.rows.length,
  };
}

function assertPrivacyModeAllowed(user: AuthUser, privacyMode: CsvPrivacyMode) {
  if (privacyMode === "full" && user.role !== "SUPER_ADMIN") {
    throw new Error("전체 연락처 CSV는 SUPER_ADMIN만 다운로드할 수 있습니다.");
  }
}

export async function exportMonthlyCsv(
  user: AuthUser,
  input: MonthlyCsvExportInput,
): Promise<MonthlyCsvExportResult> {
  assertPermission(user, "csv:export");
  const month = parseReportMonth(input.month);
  const kind = parseCsvKind(input.kind);
  const reason = normalizeReason(input.reason);
  const privacyMode = kind === "summary" ? "minimum" : parsePrivacyMode(input.privacyMode);
  assertPrivacyModeAllowed(user, privacyMode);

  const result =
    kind === "summary"
      ? buildResult({
          kind,
          month,
          privacyMode,
          columns: MONTHLY_SUMMARY_CSV_COLUMNS,
          rows: buildMonthlySummaryRows(await getMonthlyReport(user, { month })),
        })
      : await (async () => {
          const settings = await getOperatingSettings();
          const groups = await listTripDetailGroups(month, settings.reportDateBasis);
          return buildResult({
            kind,
            month,
            privacyMode,
            columns: TRIP_DETAIL_CSV_COLUMNS,
            rows: buildTripDetailRows(groups, privacyMode),
          });
        })();

  await recordCsvExportAudit(user, {
    targetType: "MonthlyReport",
    targetId: `${kind}:${month}`,
    reason: `${reason} / 개인정보 범위: ${privacyMode}`,
    columns: result.columns,
  });

  return result;
}

const previewTripGroups: TripDetailGroupRecord[] = [
  {
    id: "preview-trip-detail-1",
    serviceDate: "2026-06-03",
    timeWindow: "오전",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    destinationSummary: "백천종합병원",
    status: "SETTLED",
    members: [
      {
        memberStatus: "ACTIVE",
        residentId: "preview-resident-1",
        returnConfirmedAt: "2026-06-03",
        resident: { name: "홍길순", phone: "010-1234-5678" },
      },
      {
        memberStatus: "ACTIVE",
        residentId: "preview-resident-2",
        returnConfirmedAt: "2026-06-03",
        resident: { name: "박순자", phone: "010-2222-3333" },
      },
    ],
    linker: { name: "김동행" },
    taxiReservation: { actualFare: 28000, expectedFare: 28000 },
    settlement: {
      residentPerPersonShare: 14000,
      anchorSupportAmount: 0,
      communityFundSupportAmount: null,
    },
  },
  {
    id: "preview-trip-detail-2",
    serviceDate: "2026-06-05",
    timeWindow: "오후",
    groupName: "2026-06-05 오후 백천보건소 이동",
    destinationSummary: "백천보건소",
    status: "RETURN_CONFIRMED",
    members: [
      {
        memberStatus: "ACTIVE",
        residentId: "preview-resident-3",
        returnConfirmedAt: "2026-06-05",
        resident: { name: "이영희", phone: "010-4444-5555" },
      },
    ],
    linker: { name: "이도움" },
    taxiReservation: { actualFare: null, expectedFare: 32000 },
    settlement: null,
  },
];

export function createPreviewMonthlyCsvExport(
  input: MonthlyCsvExportInput = {},
): MonthlyCsvExportResult {
  const month = parseReportMonth(input.month ?? "2026-06");
  const kind = parseCsvKind(input.kind ?? "summary");
  const privacyMode = kind === "summary" ? "minimum" : parsePrivacyMode(input.privacyMode);
  return kind === "summary"
    ? buildResult({
        kind,
        month,
        privacyMode,
        columns: MONTHLY_SUMMARY_CSV_COLUMNS,
        rows: buildMonthlySummaryRows(createPreviewMonthlyReport(month)),
      })
    : buildResult({
        kind,
        month,
        privacyMode,
        columns: TRIP_DETAIL_CSV_COLUMNS,
        rows: buildTripDetailRows(previewTripGroups, privacyMode),
      });
}
