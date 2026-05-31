import { type CommunityFundType, type Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  listReportJobConsultationRecords,
  previewReportJobConsultations,
} from "@/server/jobs/job-consultation-service";
import {
  listReportMouRecords,
  previewReportMouRecords,
} from "@/server/mous/mou-record-service";
import {
  calculateMonthlyReportSnapshot,
  getMonthRange,
  type ReportCommunityFundRecord,
  type ReportGroupRecord,
  type ReportIncidentRecord,
  type ReportJobConsultationRecord,
  type ReportMouRecord,
  type ReportSurveyRecord,
} from "@/server/reports/report-calculator";
import { getOperatingSettings } from "@/server/settings/settings-service";
import { prisma } from "@/server/db/prisma";

const performanceStatuses = ["RETURN_CONFIRMED", "SETTLED", "REPORTED"] as const;
const reportMetricKeys = [
  "tripCount",
  "monthlyResidentCount",
  "activeLinkerCount",
  "averageFare",
  "totalAnchorSupport",
  "satisfactionAverage",
  "incidentComplaintCount",
  "communityFundAmount",
  "jobConsultationCount",
  "mouCount",
] as const;

export type MonthlyReportSnapshot = ReturnType<typeof calculateMonthlyReportSnapshot>;

export type MonthlyReportMetricKey = (typeof reportMetricKeys)[number];

export type MonthlyReportComparisonRow = {
  key: MonthlyReportMetricKey;
  label: string;
  format: "count" | "people" | "krw" | "score";
  currentValue: number;
  previousValue: number;
  delta: number;
};

export type MonthlyReportCommunityFundSummary = {
  month: string;
  contributionAmount: number;
  supportRecordAmount: number;
  recordCount: number;
};

export type MonthlyOperationReport = {
  month: string;
  previousMonth: string;
  reportDateBasis: MonthlyReportSnapshot["reportDateBasis"];
  generatedAt: string;
  sourceLabel: string;
  snapshot: MonthlyReportSnapshot;
  previousSnapshot: MonthlyReportSnapshot;
  comparisonRows: MonthlyReportComparisonRow[];
  communityFundSummary: MonthlyReportCommunityFundSummary;
};

export type MonthlyReportFilters = {
  month?: string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function parseReportMonth(value?: string | null) {
  const month = String(value ?? "").trim() || currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("대상 월은 YYYY-MM 형식이어야 합니다.");
  }
  getMonthRange(month);
  return month;
}

function shiftMonth(month: string, delta: number) {
  const [yearText, monthText] = month.split("-");
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

function formatGeneratedAt(date = new Date()) {
  return date.toLocaleString("ko-KR");
}

function summarizeCommunityFunds(
  month: string,
  records: ReportCommunityFundRecord[],
): MonthlyReportCommunityFundSummary {
  const monthRecords = records.filter((record) => record.month === month);
  return {
    month,
    contributionAmount: monthRecords
      .filter((record) => record.fundType === "CONTRIBUTION")
      .reduce((sum, record) => sum + record.amount, 0),
    supportRecordAmount: monthRecords
      .filter((record) => record.fundType === "SUPPORT_RECORD")
      .reduce((sum, record) => sum + record.amount, 0),
    recordCount: monthRecords.length,
  };
}

const comparisonLabels: Record<
  MonthlyReportMetricKey,
  Pick<MonthlyReportComparisonRow, "label" | "format">
> = {
  tripCount: { label: "운행건수", format: "count" },
  monthlyResidentCount: { label: "이용 주민", format: "people" },
  activeLinkerCount: { label: "활동 링커", format: "people" },
  averageFare: { label: "평균 택시요금", format: "krw" },
  totalAnchorSupport: { label: "총 이동지원비", format: "krw" },
  satisfactionAverage: { label: "만족도 평균", format: "score" },
  incidentComplaintCount: { label: "사고·민원", format: "count" },
  communityFundAmount: { label: "상생기금 조성", format: "krw" },
  jobConsultationCount: { label: "취업연계 상담", format: "count" },
  mouCount: { label: "MOU", format: "count" },
};

function buildComparisonRows(
  current: MonthlyReportSnapshot,
  previous: MonthlyReportSnapshot,
): MonthlyReportComparisonRow[] {
  return reportMetricKeys.map((key) => ({
    key,
    ...comparisonLabels[key],
    currentValue: current[key],
    previousValue: previous[key],
    delta: Number((current[key] - previous[key]).toFixed(1)),
  }));
}

function buildMonthlyOperationReport(input: {
  month: string;
  previousMonth: string;
  sourceLabel: string;
  current: MonthlyReportSnapshot;
  previous: MonthlyReportSnapshot;
  communityFunds: ReportCommunityFundRecord[];
}): MonthlyOperationReport {
  return {
    month: input.month,
    previousMonth: input.previousMonth,
    reportDateBasis: input.current.reportDateBasis,
    generatedAt: formatGeneratedAt(),
    sourceLabel: input.sourceLabel,
    snapshot: input.current,
    previousSnapshot: input.previous,
    comparisonRows: buildComparisonRows(input.current, input.previous),
    communityFundSummary: summarizeCommunityFunds(input.month, input.communityFunds),
  };
}

function buildGroupWhere(
  month: string,
  reportDateBasis: MonthlyReportSnapshot["reportDateBasis"],
): Prisma.MobilityGroupWhereInput {
  const { endsBefore } = getMonthRange(month);
  const dateFilter =
    reportDateBasis === "serviceDate"
      ? {
          serviceDate: {
            lt: endsBefore,
          },
        }
      : {
          members: {
            some: {
              returnConfirmedAt: {
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

export async function getMonthlyReport(
  user: AuthUser,
  filters: MonthlyReportFilters = {},
): Promise<MonthlyOperationReport> {
  assertPermission(user, "report:read");

  const month = parseReportMonth(filters.month);
  const previousMonth = shiftMonth(month, -1);
  const settings = await getOperatingSettings();
  const groups = await prisma.mobilityGroup.findMany({
    where: buildGroupWhere(month, settings.reportDateBasis),
    orderBy: [{ serviceDate: "asc" }, { updatedAt: "asc" }],
    include: {
      members: {
        select: {
          residentId: true,
          memberStatus: true,
          returnConfirmedAt: true,
        },
      },
      settlement: {
        select: {
          groupId: true,
          totalFare: true,
          residentTotalShare: true,
          residentPerPersonShare: true,
          anchorSupportAmount: true,
          isSettled: true,
        },
      },
    },
  });
  const groupIds = groups.map((group) => group.id);
  const [surveys, incidents, communityFunds, jobConsultations, mouRecords] = await Promise.all([
    groupIds.length > 0
      ? prisma.satisfactionSurvey.findMany({
          where: {
            groupId: {
              in: groupIds,
            },
          },
          select: {
            groupId: true,
            emotionalRecovery: true,
            userSatisfaction: true,
            linkerSatisfaction: true,
            taxiSatisfaction: true,
          },
        })
      : Promise.resolve([]),
    groupIds.length > 0
      ? prisma.incidentReport.findMany({
          where: {
            groupId: {
              in: groupIds,
            },
          },
          select: {
            groupId: true,
          },
        })
      : Promise.resolve([]),
    prisma.communityFund.findMany({
      where: {
        month: {
          in: [month, previousMonth],
        },
      },
      select: {
        month: true,
        amount: true,
        fundType: true,
      },
    }),
    listReportJobConsultationRecords([month, previousMonth]),
    listReportMouRecords([month, previousMonth]),
  ]);

  const reportGroups: ReportGroupRecord[] = groups.map((group) => ({
    id: group.id,
    serviceDate: group.serviceDate,
    status: group.status,
    linkerId: group.linkerId,
    members: group.members,
    settlement: group.settlement,
  }));
  const reportSurveys: ReportSurveyRecord[] = surveys;
  const reportIncidents: ReportIncidentRecord[] = incidents;
  const reportCommunityFunds: ReportCommunityFundRecord[] = communityFunds.map((fund) => ({
    month: fund.month,
    amount: fund.amount,
    fundType: fund.fundType as CommunityFundType,
  }));
  const reportJobConsultations: ReportJobConsultationRecord[] = jobConsultations;
  const reportMouRecords: ReportMouRecord[] = mouRecords;
  const input = {
    reportDateBasis: settings.reportDateBasis,
    groups: reportGroups,
    surveys: reportSurveys,
    incidents: reportIncidents,
    communityFunds: reportCommunityFunds,
    jobConsultations: reportJobConsultations,
    mouRecords: reportMouRecords,
  };

  return buildMonthlyOperationReport({
    month,
    previousMonth,
    sourceLabel: "실시간 집계",
    current: calculateMonthlyReportSnapshot({ ...input, month }),
    previous: calculateMonthlyReportSnapshot({ ...input, month: previousMonth }),
    communityFunds: reportCommunityFunds,
  });
}

const previewGroups: ReportGroupRecord[] = [
  {
    id: "preview-report-group-1",
    serviceDate: "2026-05-16",
    status: "SETTLED",
    linkerId: "preview-linker-1",
    members: [
      { residentId: "preview-resident-1", memberStatus: "ACTIVE", returnConfirmedAt: "2026-05-16" },
      { residentId: "preview-resident-2", memberStatus: "ACTIVE", returnConfirmedAt: "2026-05-16" },
    ],
    settlement: {
      groupId: "preview-report-group-1",
      totalFare: 32000,
      residentTotalShare: 22000,
      residentPerPersonShare: 11000,
      anchorSupportAmount: 10000,
      isSettled: true,
    },
  },
  {
    id: "preview-report-group-2",
    serviceDate: "2026-06-03",
    status: "SETTLED",
    linkerId: "preview-linker-1",
    members: [
      { residentId: "preview-resident-1", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-03" },
      { residentId: "preview-resident-3", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-03" },
    ],
    settlement: {
      groupId: "preview-report-group-2",
      totalFare: 28000,
      residentTotalShare: 28000,
      residentPerPersonShare: 14000,
      anchorSupportAmount: 0,
      isSettled: true,
    },
  },
  {
    id: "preview-report-group-3",
    serviceDate: "2026-06-05",
    status: "RETURN_CONFIRMED",
    linkerId: "preview-linker-2",
    members: [
      { residentId: "preview-resident-2", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-05" },
      { residentId: "preview-resident-4", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-05" },
      { residentId: "preview-resident-5", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-05" },
    ],
    settlement: null,
  },
  {
    id: "preview-report-group-4",
    serviceDate: "2026-06-12",
    status: "SETTLED",
    linkerId: "preview-linker-2",
    members: [
      { residentId: "preview-resident-5", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-12" },
      { residentId: "preview-resident-6", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-12" },
    ],
    settlement: {
      groupId: "preview-report-group-4",
      totalFare: 36000,
      residentTotalShare: 24000,
      residentPerPersonShare: 12000,
      anchorSupportAmount: 12000,
      isSettled: true,
    },
  },
];

const previewSurveys: ReportSurveyRecord[] = [
  {
    groupId: "preview-report-group-1",
    emotionalRecovery: 4,
    userSatisfaction: 4,
    linkerSatisfaction: 5,
    taxiSatisfaction: 4,
  },
  {
    groupId: "preview-report-group-2",
    emotionalRecovery: 5,
    userSatisfaction: 5,
    linkerSatisfaction: 5,
    taxiSatisfaction: 4,
  },
  {
    groupId: "preview-report-group-3",
    emotionalRecovery: 4,
    userSatisfaction: 4,
    linkerSatisfaction: 4,
    taxiSatisfaction: 4,
  },
  {
    groupId: "preview-report-group-4",
    emotionalRecovery: 5,
    userSatisfaction: 5,
    linkerSatisfaction: 4,
    taxiSatisfaction: 5,
  },
];

const previewIncidents: ReportIncidentRecord[] = [{ groupId: "preview-report-group-3" }];

const previewCommunityFunds: ReportCommunityFundRecord[] = [
  { month: "2026-05", amount: 20000, fundType: "CONTRIBUTION" },
  { month: "2026-06", amount: 30000, fundType: "CONTRIBUTION" },
  { month: "2026-06", amount: 10000, fundType: "SUPPORT_RECORD" },
];

export function createPreviewMonthlyReport(month = "2026-06"): MonthlyOperationReport {
  const normalizedMonth = parseReportMonth(month);
  const previousMonth = shiftMonth(normalizedMonth, -1);
  const input = {
    reportDateBasis: "serviceDate" as const,
    groups: previewGroups,
    surveys: previewSurveys,
    incidents: previewIncidents,
    communityFunds: previewCommunityFunds,
    jobConsultations: previewReportJobConsultations,
    mouRecords: previewReportMouRecords,
  };

  return buildMonthlyOperationReport({
    month: normalizedMonth,
    previousMonth,
    sourceLabel: "시연 데이터",
    current: calculateMonthlyReportSnapshot({ ...input, month: normalizedMonth }),
    previous: calculateMonthlyReportSnapshot({ ...input, month: previousMonth }),
    communityFunds: previewCommunityFunds,
  });
}

export const previewMonthlyOperationReport = createPreviewMonthlyReport();
