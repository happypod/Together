import { type Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  LINKER_STATUSES,
  LINKER_STATUS_LABELS,
  MOBILITY_STATUS_LABELS,
  type LinkerStatus,
  type MobilityStatus,
} from "@/domain/definitions";
import {
  getMonthRange,
  getReportMonth,
  isConfirmedPerformanceStatus,
} from "@/server/reports/report-calculator";
import { getOperatingSettings } from "@/server/settings/settings-service";
import { type ReportDateBasis } from "@/server/settings/defaults";
import { prisma } from "@/server/db/prisma";

export type LinkerActivityStatsFilters = {
  month?: string;
  status?: string;
};

export type LinkerActivityStatusOption = {
  value: LinkerStatus;
  label: string;
};

export type LinkerActivityAssignmentRow = {
  id: string;
  groupName: string;
  serviceDate: string;
  destinationSummary: string;
  status: MobilityStatus;
  statusLabel: string;
  memberCount: number;
  incidentReportCount: number;
  issueSurveyCount: number;
  satisfactionAverage: number | null;
};

export type LinkerActivityRow = {
  linkerId: string;
  name: string;
  villageName: string;
  status: LinkerStatus;
  statusLabel: string;
  readyForAssignment: boolean;
  totalActivityCount: number;
  monthlyAssignmentCount: number;
  completedTripCount: number;
  incidentComplaintCount: number;
  averageSatisfaction: number | null;
  lastServiceDate: string | null;
  assignments: LinkerActivityAssignmentRow[];
};

export type LinkerActivityStats = {
  month: string;
  reportDateBasis: ReportDateBasis;
  statusFilter: LinkerStatus | null;
  totalLinkerCount: number;
  readyLinkerCount: number;
  assignedLinkerCount: number;
  activeLinkerCount: number;
  monthlyAssignmentCount: number;
  completedTripCount: number;
  incidentComplaintCount: number;
  averageLinkerSatisfaction: number | null;
  statusOptions: LinkerActivityStatusOption[];
  rows: LinkerActivityRow[];
};

type LinkerActivityGroupRecord = {
  id: string;
  groupName: string;
  serviceDate: Date | string;
  destinationSummary: string;
  status: MobilityStatus;
  members: {
    residentId: string;
    memberStatus: "ACTIVE" | "CANCELED" | "NO_SHOW";
    returnConfirmedAt: Date | string | null;
  }[];
  surveys: {
    linkerSatisfaction: number | null;
    hasIncident: boolean;
    hasComplaint: boolean;
  }[];
  incidentReports: { id: string }[];
};

type LinkerActivityLinkerRecord = {
  id: string;
  name: string;
  villageName: string;
  status: LinkerStatus;
  activityCount: number;
  trainingCompleted: boolean;
  fieldPracticeCompleted: boolean;
  privacyPledgeSigned: boolean;
  insuranceRegistered: boolean;
  groups: LinkerActivityGroupRecord[];
};

const assignmentReadyStatuses = new Set<LinkerStatus>(["AVAILABLE", "ACTIVE"]);

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function dateKey(value: Date | string) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

function averageOneDecimal(values: (number | null | undefined)[]) {
  const scores = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (scores.length === 0) {
    return null;
  }
  return Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1));
}

function parseLinkerActivityStatsMonth(value?: string | null) {
  const month = String(value ?? "").trim() || currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("대상 월은 YYYY-MM 형식이어야 합니다.");
  }
  getMonthRange(month);
  return month;
}

function parseLinkerStatusFilter(value?: string | null) {
  const status = String(value ?? "").trim();
  if (!status) {
    return null;
  }
  return status in LINKER_STATUS_LABELS ? (status as LinkerStatus) : null;
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

function buildGroupWhere(
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
    linkerId: {
      not: null,
    },
    ...dateFilter,
  };
}

function groupMatchesReportMonth(
  group: LinkerActivityGroupRecord,
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

function countMembers(group: LinkerActivityGroupRecord) {
  return group.members.filter((member) => member.memberStatus !== "CANCELED").length;
}

function countSurveyIssues(group: LinkerActivityGroupRecord) {
  return group.surveys.filter((survey) => survey.hasIncident || survey.hasComplaint).length;
}

function countLinkedIssues(assignment: LinkerActivityAssignmentRow) {
  return Math.max(assignment.incidentReportCount, assignment.issueSurveyCount);
}

function toAssignmentRow(group: LinkerActivityGroupRecord): LinkerActivityAssignmentRow {
  return {
    id: group.id,
    groupName: group.groupName,
    serviceDate: dateKey(group.serviceDate),
    destinationSummary: group.destinationSummary,
    status: group.status,
    statusLabel: MOBILITY_STATUS_LABELS[group.status],
    memberCount: countMembers(group),
    incidentReportCount: group.incidentReports.length,
    issueSurveyCount: countSurveyIssues(group),
    satisfactionAverage: averageOneDecimal(
      group.surveys.map((survey) => survey.linkerSatisfaction),
    ),
  };
}

function toActivityRow(
  linker: LinkerActivityLinkerRecord,
  month: string,
  reportDateBasis: ReportDateBasis,
): LinkerActivityRow {
  const groups = linker.groups.filter((group) =>
    groupMatchesReportMonth(group, month, reportDateBasis),
  );
  const assignments = groups.map(toAssignmentRow).sort((left, right) => {
    if (left.serviceDate === right.serviceDate) {
      return left.groupName.localeCompare(right.groupName);
    }
    return right.serviceDate.localeCompare(left.serviceDate);
  });
  const completedTripCount = groups.filter((group) => isConfirmedPerformanceStatus(group.status))
    .length;
  const incidentComplaintCount = assignments.reduce(
    (sum, assignment) => sum + countLinkedIssues(assignment),
    0,
  );
  const averageSatisfaction = averageOneDecimal(
    groups.flatMap((group) => group.surveys.map((survey) => survey.linkerSatisfaction)),
  );

  return {
    linkerId: linker.id,
    name: linker.name,
    villageName: linker.villageName,
    status: linker.status,
    statusLabel: LINKER_STATUS_LABELS[linker.status],
    readyForAssignment: isAssignmentReady(linker),
    totalActivityCount: linker.activityCount,
    monthlyAssignmentCount: assignments.length,
    completedTripCount,
    incidentComplaintCount,
    averageSatisfaction,
    lastServiceDate: assignments[0]?.serviceDate ?? null,
    assignments,
  };
}

export function summarizeLinkerActivityStats(input: {
  month: string;
  reportDateBasis: ReportDateBasis;
  statusFilter?: LinkerStatus | null;
  linkers: LinkerActivityLinkerRecord[];
}): LinkerActivityStats {
  const statusFilter = input.statusFilter ?? null;
  const filteredLinkers = statusFilter
    ? input.linkers.filter((linker) => linker.status === statusFilter)
    : input.linkers;
  const rows = filteredLinkers
    .map((linker) => toActivityRow(linker, input.month, input.reportDateBasis))
    .sort((left, right) => {
      if (right.monthlyAssignmentCount !== left.monthlyAssignmentCount) {
        return right.monthlyAssignmentCount - left.monthlyAssignmentCount;
      }
      if (right.completedTripCount !== left.completedTripCount) {
        return right.completedTripCount - left.completedTripCount;
      }
      return left.name.localeCompare(right.name);
    });

  const assignmentRows = rows.flatMap((row) => row.assignments);
  return {
    month: input.month,
    reportDateBasis: input.reportDateBasis,
    statusFilter,
    totalLinkerCount: rows.length,
    readyLinkerCount: rows.filter((row) => row.readyForAssignment).length,
    assignedLinkerCount: rows.filter((row) => row.monthlyAssignmentCount > 0).length,
    activeLinkerCount: rows.filter((row) => row.completedTripCount > 0).length,
    monthlyAssignmentCount: rows.reduce((sum, row) => sum + row.monthlyAssignmentCount, 0),
    completedTripCount: rows.reduce((sum, row) => sum + row.completedTripCount, 0),
    incidentComplaintCount: rows.reduce((sum, row) => sum + row.incidentComplaintCount, 0),
    averageLinkerSatisfaction: averageOneDecimal(
      assignmentRows.map((assignment) => assignment.satisfactionAverage),
    ),
    statusOptions: LINKER_STATUSES.map((value) => ({
      value,
      label: LINKER_STATUS_LABELS[value],
    })),
    rows,
  };
}

export async function getLinkerActivityStats(
  user: AuthUser,
  filters: LinkerActivityStatsFilters = {},
): Promise<LinkerActivityStats> {
  assertPermission(user, "report:read");
  const month = parseLinkerActivityStatsMonth(filters.month);
  const statusFilter = parseLinkerStatusFilter(filters.status);
  const settings = await getOperatingSettings();
  const linkers = await prisma.linker.findMany({
    where: {
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 160,
    select: {
      id: true,
      name: true,
      villageName: true,
      status: true,
      activityCount: true,
      trainingCompleted: true,
      fieldPracticeCompleted: true,
      privacyPledgeSigned: true,
      insuranceRegistered: true,
      groups: {
        where: buildGroupWhere(month, settings.reportDateBasis),
        orderBy: [{ serviceDate: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          groupName: true,
          serviceDate: true,
          destinationSummary: true,
          status: true,
          members: {
            select: {
              residentId: true,
              memberStatus: true,
              returnConfirmedAt: true,
            },
          },
          surveys: {
            select: {
              linkerSatisfaction: true,
              hasIncident: true,
              hasComplaint: true,
            },
          },
          incidentReports: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  return summarizeLinkerActivityStats({
    month,
    reportDateBasis: settings.reportDateBasis,
    statusFilter,
    linkers,
  });
}

const previewLinkers: LinkerActivityLinkerRecord[] = [
  {
    id: "preview-linker-1",
    name: "김동행",
    villageName: "백천마을",
    status: "AVAILABLE",
    activityCount: 18,
    trainingCompleted: true,
    fieldPracticeCompleted: true,
    privacyPledgeSigned: true,
    insuranceRegistered: true,
    groups: [
      {
        id: "preview-linker-group-1",
        groupName: "2026-06-03 오전 백천종합병원 이동",
        serviceDate: "2026-06-03",
        destinationSummary: "백천종합병원",
        status: "SETTLED",
        members: [
          {
            residentId: "preview-resident-1",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-03",
          },
          {
            residentId: "preview-resident-2",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-03",
          },
        ],
        surveys: [
          { linkerSatisfaction: 5, hasIncident: false, hasComplaint: false },
          { linkerSatisfaction: 5, hasIncident: false, hasComplaint: true },
        ],
        incidentReports: [],
      },
      {
        id: "preview-linker-group-2",
        groupName: "2026-06-18 오후 백천시장 이동",
        serviceDate: "2026-06-18",
        destinationSummary: "백천시장",
        status: "RETURN_CONFIRMED",
        members: [
          {
            residentId: "preview-resident-3",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-18",
          },
          {
            residentId: "preview-resident-4",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-18",
          },
        ],
        surveys: [{ linkerSatisfaction: 4, hasIncident: false, hasComplaint: false }],
        incidentReports: [],
      },
    ],
  },
  {
    id: "preview-linker-2",
    name: "이도움",
    villageName: "백천마을",
    status: "ACTIVE",
    activityCount: 11,
    trainingCompleted: true,
    fieldPracticeCompleted: true,
    privacyPledgeSigned: true,
    insuranceRegistered: true,
    groups: [
      {
        id: "preview-linker-group-3",
        groupName: "2026-06-05 오후 백천보건소 이동",
        serviceDate: "2026-06-05",
        destinationSummary: "백천보건소",
        status: "RETURN_CONFIRMED",
        members: [
          {
            residentId: "preview-resident-5",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-05",
          },
          {
            residentId: "preview-resident-6",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-05",
          },
          {
            residentId: "preview-resident-7",
            memberStatus: "ACTIVE",
            returnConfirmedAt: "2026-06-05",
          },
        ],
        surveys: [{ linkerSatisfaction: 4, hasIncident: true, hasComplaint: false }],
        incidentReports: [{ id: "preview-incident-1" }],
      },
    ],
  },
  {
    id: "preview-linker-3",
    name: "박교육",
    villageName: "상동마을",
    status: "IN_TRAINING",
    activityCount: 0,
    trainingCompleted: true,
    fieldPracticeCompleted: false,
    privacyPledgeSigned: true,
    insuranceRegistered: true,
    groups: [],
  },
];

export function createPreviewLinkerActivityStats(
  filters: LinkerActivityStatsFilters = {},
): LinkerActivityStats {
  const month = parseLinkerActivityStatsMonth(filters.month ?? "2026-06");
  return summarizeLinkerActivityStats({
    month,
    reportDateBasis: "serviceDate",
    statusFilter: parseLinkerStatusFilter(filters.status),
    linkers: previewLinkers,
  });
}

export const previewLinkerActivityStats = createPreviewLinkerActivityStats();
