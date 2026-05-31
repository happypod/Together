import { type MobilityStatus } from "@/domain/definitions";
import { type ReportDateBasis } from "@/server/settings/defaults";

const PERFORMANCE_STATUSES = new Set<MobilityStatus>([
  "RETURN_CONFIRMED",
  "SETTLED",
  "REPORTED",
]);

const CANCELED_STATUSES = new Set<MobilityStatus>([
  "CANCELED_BY_RESIDENT",
  "CANCELED_BY_OPERATOR",
  "CANCELED_BY_TAXI",
  "CANCELED_BY_WEATHER",
  "CANCELED_BY_OTHER",
]);

type DateLike = Date | string;

export type ReportGroupMemberRecord = {
  residentId: string;
  memberStatus?: "ACTIVE" | "CANCELED" | "NO_SHOW";
  returnConfirmedAt?: DateLike | null;
};

export type ReportSettlementRecord = {
  groupId: string;
  totalFare: number;
  residentTotalShare: number;
  residentPerPersonShare: number;
  anchorSupportAmount: number;
  isSettled?: boolean;
};

export type ReportGroupRecord = {
  id: string;
  serviceDate: DateLike;
  status: MobilityStatus;
  linkerId?: string | null;
  members?: ReportGroupMemberRecord[];
  settlement?: ReportSettlementRecord | null;
};

export type ReportRequestRecord = {
  desiredDate: DateLike;
  status: MobilityStatus;
};

export type ReportLinkerRecord = {
  id: string;
  status: string;
};

export type ReportSurveyRecord = {
  groupId: string;
  emotionalRecovery?: number | null;
  userSatisfaction: number;
  linkerSatisfaction?: number | null;
  taxiSatisfaction?: number | null;
};

export type ReportIncidentRecord = {
  groupId: string;
};

export type ReportCommunityFundRecord = {
  month: string;
  amount: number;
  fundType: "CONTRIBUTION" | "SUPPORT_RECORD";
};

export type ReportJobConsultationRecord = {
  consultedAt: DateLike;
  status?: string | null;
};

export type ReportMouRecord = {
  signedAt: DateLike;
  status?: string | null;
};

export type DashboardSummaryInput = {
  today?: DateLike;
  requests?: ReportRequestRecord[];
  groups?: ReportGroupRecord[];
  settlements?: ReportSettlementRecord[];
  linkers?: ReportLinkerRecord[];
};

export type MonthlyReportInput = {
  month: string;
  reportDateBasis?: ReportDateBasis;
  groups: ReportGroupRecord[];
  settlements?: ReportSettlementRecord[];
  surveys?: ReportSurveyRecord[];
  incidents?: ReportIncidentRecord[];
  communityFunds?: ReportCommunityFundRecord[];
  jobConsultations?: ReportJobConsultationRecord[];
  mouRecords?: ReportMouRecord[];
};

function toDate(value: DateLike) {
  return value instanceof Date ? value : new Date(value);
}

function dateKey(value: DateLike) {
  return toDate(value).toISOString().slice(0, 10);
}

function monthKey(value: DateLike) {
  return toDate(value).toISOString().slice(0, 7);
}

function averageInteger(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function averageOneDecimal(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function activeMembers(group: ReportGroupRecord) {
  return (group.members ?? []).filter((member) => member.memberStatus !== "CANCELED");
}

function latestReturnConfirmedAt(group: ReportGroupRecord) {
  const timestamps = activeMembers(group)
    .map((member) => member.returnConfirmedAt)
    .filter((value): value is DateLike => Boolean(value))
    .map((value) => toDate(value).getTime());

  if (timestamps.length === 0) {
    return null;
  }
  return new Date(Math.max(...timestamps));
}

function uniqueResidentCount(groups: ReportGroupRecord[]) {
  const residentIds = new Set<string>();
  for (const group of groups) {
    for (const member of activeMembers(group)) {
      residentIds.add(member.residentId);
    }
  }
  return residentIds.size;
}

function settlementMapFromInput(input: MonthlyReportInput) {
  const settlementMap = new Map<string, ReportSettlementRecord>();
  for (const settlement of input.settlements ?? []) {
    settlementMap.set(settlement.groupId, settlement);
  }
  for (const group of input.groups) {
    if (group.settlement) {
      settlementMap.set(group.id, group.settlement);
    }
  }
  return settlementMap;
}

export function isConfirmedPerformanceStatus(status: MobilityStatus) {
  return PERFORMANCE_STATUSES.has(status);
}

export function getMonthRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month 값은 YYYY-MM 형식이어야 합니다.");
  }

  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const startsAt = new Date(Date.UTC(year, monthIndex, 1));
  const endsBefore = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { startsAt, endsBefore };
}

export function getReportMonth(
  group: ReportGroupRecord,
  basis: ReportDateBasis = "serviceDate",
) {
  if (basis === "serviceDate") {
    return monthKey(group.serviceDate);
  }

  const confirmedAt = latestReturnConfirmedAt(group);
  return confirmedAt ? monthKey(confirmedAt) : null;
}

export function calculateDashboardSummary(input: DashboardSummaryInput = {}) {
  const today = dateKey(input.today ?? new Date());
  const groups = input.groups ?? [];
  const settlements = [...(input.settlements ?? [])];
  for (const group of groups) {
    if (group.settlement && !settlements.some((settlement) => settlement.groupId === group.id)) {
      settlements.push(group.settlement);
    }
  }

  const settledGroupIds = new Set(
    settlements.filter((settlement) => settlement.isSettled).map((settlement) => settlement.groupId),
  );
  const existingSettlementGroupIds = new Set(settlements.map((settlement) => settlement.groupId));

  return {
    todayRequestCount: (input.requests ?? []).filter(
      (request) =>
        dateKey(request.desiredDate) === today && !CANCELED_STATUSES.has(request.status),
    ).length,
    todayGroupCount: groups.filter((group) => dateKey(group.serviceDate) === today).length,
    returnConfirmedCount: groups.filter((group) => isConfirmedPerformanceStatus(group.status))
      .length,
    unsettledCount: groups.filter((group) => {
      if (!isConfirmedPerformanceStatus(group.status)) {
        return false;
      }
      if (!existingSettlementGroupIds.has(group.id)) {
        return true;
      }
      return !settledGroupIds.has(group.id);
    }).length,
    activeLinkerCount: (input.linkers ?? []).filter((linker) =>
      ["AVAILABLE", "ACTIVE"].includes(linker.status),
    ).length,
  };
}

export function calculateMonthlyReportSnapshot(input: MonthlyReportInput) {
  getMonthRange(input.month);

  const reportDateBasis = input.reportDateBasis ?? "serviceDate";
  const completedGroups = input.groups.filter((group) =>
    isConfirmedPerformanceStatus(group.status),
  );
  const monthGroups = completedGroups.filter(
    (group) => getReportMonth(group, reportDateBasis) === input.month,
  );
  const cumulativeGroups = completedGroups.filter((group) => {
    const reportMonth = getReportMonth(group, reportDateBasis);
    return Boolean(reportMonth && reportMonth <= input.month);
  });
  const monthGroupIds = new Set(monthGroups.map((group) => group.id));
  const settlementMap = settlementMapFromInput(input);
  const monthSettlements = monthGroups
    .map((group) => settlementMap.get(group.id))
    .filter(
      (settlement): settlement is ReportSettlementRecord =>
        Boolean(settlement && settlement.isSettled !== false),
    );
  const monthSurveys = (input.surveys ?? []).filter((survey) =>
    monthGroupIds.has(survey.groupId),
  );
  const isFiniteScore = (value: number | null | undefined): value is number =>
    typeof value === "number" && Number.isFinite(value);
  const satisfactionScores = monthSurveys
    .flatMap((survey) => [
      survey.userSatisfaction,
      survey.linkerSatisfaction,
      survey.taxiSatisfaction,
    ])
    .filter(isFiniteScore);
  const emotionalRecoveryScores = monthSurveys
    .map((survey) => survey.emotionalRecovery)
    .filter(isFiniteScore);
  const activeLinkerIds = new Set(
    monthGroups
      .map((group) => group.linkerId)
      .filter((linkerId): linkerId is string => Boolean(linkerId)),
  );

  const totalAnchorSupport = monthSettlements.reduce(
    (sum, settlement) => sum + settlement.anchorSupportAmount,
    0,
  );

  return {
    month: input.month,
    reportDateBasis,
    tripCount: monthGroups.length,
    monthlyResidentCount: uniqueResidentCount(monthGroups),
    cumulativeResidentCount: uniqueResidentCount(cumulativeGroups),
    linkerActivityCount: monthGroups.filter((group) => Boolean(group.linkerId)).length,
    activeLinkerCount: activeLinkerIds.size,
    averageFare: averageInteger(monthSettlements.map((settlement) => settlement.totalFare)),
    totalAnchorSupport,
    averageResidentShare: averageInteger(
      monthSettlements.map((settlement) => settlement.residentPerPersonShare),
    ),
    estimatedSaving: totalAnchorSupport,
    satisfactionAverage: averageOneDecimal(satisfactionScores),
    emotionalRecoveryAverage: averageOneDecimal(emotionalRecoveryScores),
    incidentComplaintCount: (input.incidents ?? []).filter((incident) =>
      monthGroupIds.has(incident.groupId),
    ).length,
    communityFundAmount: (input.communityFunds ?? [])
      .filter((fund) => fund.month === input.month && fund.fundType === "CONTRIBUTION")
      .reduce((sum, fund) => sum + fund.amount, 0),
    jobConsultationCount: (input.jobConsultations ?? []).filter(
      (record) => monthKey(record.consultedAt) === input.month,
    ).length,
    mouCount: (input.mouRecords ?? []).filter(
      (record) => monthKey(record.signedAt) === input.month,
    ).length,
  };
}
