import { type Prisma } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { SURVEY_SCORE_MAX, SURVEY_SCORE_MIN } from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo, hasForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { getMonthRange, getReportMonth } from "@/server/reports/report-calculator";
import { getOperatingSettings } from "@/server/settings/settings-service";

export type SurveyChannel = "operator" | "mobile";

export type ParticipantSurveyInput = {
  groupId: string;
  residentId?: string | null;
  emotionalRecovery: number;
  userSatisfaction: number;
  linkerSatisfaction?: number | null;
  taxiSatisfaction?: number | null;
  costBurdenFeeling?: number | null;
  reuseIntent: number;
  inconvenience?: string | null;
  comment?: string | null;
  hasIncident?: boolean;
  hasComplaint?: boolean;
  issueTypes?: string[];
  collectedVia?: SurveyChannel;
};

export type SatisfactionStatsFilters = {
  month?: string;
};

export type SatisfactionScoreMetric = {
  key:
    | "userSatisfaction"
    | "linkerSatisfaction"
    | "taxiSatisfaction"
    | "costBurdenFeeling"
    | "reuseIntent"
    | "emotionalRecovery";
  label: string;
  average: number | null;
  responseCount: number;
  positiveCount: number;
  positiveRate: number;
};

export type SatisfactionIssueTypeRow = {
  label: string;
  count: number;
};

export type SatisfactionFeedbackItem = {
  id: string;
  type: "inconvenience" | "improvement";
  typeLabel: string;
  text: string;
  groupLabel: string;
  collectedVia: string;
};

export type SatisfactionStats = {
  month: string;
  reportDateBasis: "serviceDate" | "returnConfirmedAt";
  responseCount: number;
  groupCount: number;
  mobileResponseCount: number;
  operatorResponseCount: number;
  issueSurveyCount: number;
  incidentReportCount: number;
  metrics: SatisfactionScoreMetric[];
  issueTypeRows: SatisfactionIssueTypeRow[];
  feedbackItems: SatisfactionFeedbackItem[];
  feedbackAccess: "full" | "aggregateOnly";
  privacyOmittedCount: number;
};

function parseScore(value: FormDataEntryValue | null): number {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 0) {
    return Number.NaN;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.trunc(num) : Number.NaN;
}

function parseOptionalScore(value: FormDataEntryValue | null): number | null {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 0) {
    return null;
  }
  const score = parseScore(value);
  return Number.isFinite(score) ? score : null;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on";
}

export function parseParticipantSurveyForm(
  formData: FormData,
  overrides: Partial<ParticipantSurveyInput> = {},
): ParticipantSurveyInput {
  return {
    groupId: overrides.groupId ?? String(formData.get("groupId") ?? ""),
    residentId: overrides.residentId ?? optionalText(formData.get("residentId")),
    emotionalRecovery: parseScore(formData.get("emotionalRecovery")),
    userSatisfaction: parseScore(formData.get("userSatisfaction")),
    linkerSatisfaction: parseOptionalScore(formData.get("linkerSatisfaction")),
    taxiSatisfaction: parseOptionalScore(formData.get("taxiSatisfaction")),
    costBurdenFeeling: parseOptionalScore(formData.get("costBurdenFeeling")),
    reuseIntent: parseScore(formData.get("reuseIntent")),
    inconvenience: optionalText(formData.get("inconvenience")),
    comment: optionalText(formData.get("improvementRequest")),
    hasIncident: parseCheckbox(formData.get("hasIncident")),
    hasComplaint: parseCheckbox(formData.get("hasComplaint")),
    issueTypes: formData.getAll("issueTypes").map(String).filter(Boolean),
    collectedVia: overrides.collectedVia ?? "operator",
  };
}

function assertScore(label: string, value: number) {
  if (!Number.isInteger(value) || value < SURVEY_SCORE_MIN || value > SURVEY_SCORE_MAX) {
    throw new Error(`${label} 항목을 선택해 주세요.`);
  }
}

export function assertParticipantSurvey(input: ParticipantSurveyInput) {
  if (!input.groupId) {
    throw new Error("설문 대상 운행을 찾을 수 없습니다.");
  }
  assertScore("정서회복", input.emotionalRecovery);
  assertScore("만족도", input.userSatisfaction);
  if (input.linkerSatisfaction !== null && input.linkerSatisfaction !== undefined) {
    assertScore("동행링커 만족도", input.linkerSatisfaction);
  }
  if (input.taxiSatisfaction !== null && input.taxiSatisfaction !== undefined) {
    assertScore("택시 만족도", input.taxiSatisfaction);
  }
  if (input.costBurdenFeeling !== null && input.costBurdenFeeling !== undefined) {
    assertScore("비용 부담", input.costBurdenFeeling);
  }
  assertScore("재이용 의향", input.reuseIntent);
  assertNoForbiddenSensitiveInfo({
    불편사항: input.inconvenience ?? "",
    한마디: input.comment ?? "",
  });
}

function buildSurveyCreateData(
  input: ParticipantSurveyInput,
): Prisma.SatisfactionSurveyUncheckedCreateInput {
  return {
    groupId: input.groupId,
    residentId: input.residentId ?? null,
    emotionalRecovery: input.emotionalRecovery,
    userSatisfaction: input.userSatisfaction,
    linkerSatisfaction: input.linkerSatisfaction ?? null,
    taxiSatisfaction: input.taxiSatisfaction ?? null,
    costBurdenFeeling: input.costBurdenFeeling ?? null,
    reuseIntent: input.reuseIntent,
    inconvenience: input.inconvenience ?? null,
    improvementRequest: input.comment ?? null,
    collectedVia: input.collectedVia ?? "operator",
    hasIncident: Boolean(input.hasIncident),
    hasComplaint: Boolean(input.hasComplaint),
    issueTypes: input.issueTypes ?? [],
  };
}

/** 트랜잭션 안에서 설문을 저장한다(모바일 토큰 제출 흐름에서 재사용). */
export async function recordParticipantSurveyTx(
  tx: Prisma.TransactionClient,
  input: ParticipantSurveyInput,
  auditUserId: string,
) {
  assertParticipantSurvey(input);
  const survey = await tx.satisfactionSurvey.create({ data: buildSurveyCreateData(input) });
  await writeAuditLog(tx, {
    userId: auditUserId,
    action: "CREATE",
    targetType: "SatisfactionSurvey",
    targetId: survey.id,
    afterValue: {
      groupId: survey.groupId,
      emotionalRecovery: survey.emotionalRecovery,
      userSatisfaction: survey.userSatisfaction,
      linkerSatisfaction: survey.linkerSatisfaction,
      taxiSatisfaction: survey.taxiSatisfaction,
      costBurdenFeeling: survey.costBurdenFeeling,
      reuseIntent: survey.reuseIntent,
      hasIncident: survey.hasIncident,
      hasComplaint: survey.hasComplaint,
      issueTypes: survey.issueTypes,
      collectedVia: survey.collectedVia,
    },
  });
  return survey;
}

/** 운영자 현장 입력 흐름. trip:write 권한이 필요하다. */
export async function submitParticipantSurvey(user: AuthUser, input: ParticipantSurveyInput) {
  assertPermission(user, "trip:write");
  return prisma.$transaction((tx) =>
    recordParticipantSurveyTx(tx, { ...input, collectedVia: "operator" }, user.id),
  );
}

export type GroupSurveySummary = {
  count: number;
  emotionalRecoveryAvg: number | null;
  satisfactionAvg: number | null;
  reuseAvg: number | null;
  recoveredCount: number;
  recommendCount: number;
};

type SurveyRow = {
  emotionalRecovery: number | null;
  userSatisfaction: number;
  reuseIntent: number;
};

function average(values: number[]): number | null {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) {
    return null;
  }
  return Number((finite.reduce((sum, value) => sum + value, 0) / finite.length).toFixed(1));
}

export function summarizeSurveys(rows: SurveyRow[]): GroupSurveySummary {
  return {
    count: rows.length,
    emotionalRecoveryAvg: average(
      rows.map((row) => (row.emotionalRecovery ?? Number.NaN)),
    ),
    satisfactionAvg: average(rows.map((row) => row.userSatisfaction)),
    reuseAvg: average(rows.map((row) => row.reuseIntent)),
    recoveredCount: rows.filter((row) => (row.emotionalRecovery ?? 0) >= 4).length,
    recommendCount: rows.filter((row) => row.reuseIntent >= 4).length,
  };
}

export async function listGroupSurveySummaries(
  groupIds: string[],
): Promise<Record<string, GroupSurveySummary>> {
  const uniqueIds = [...new Set(groupIds)].filter(Boolean);
  if (uniqueIds.length === 0) {
    return {};
  }
  const rows = await prisma.satisfactionSurvey.findMany({
    where: { groupId: { in: uniqueIds } },
    select: {
      groupId: true,
      emotionalRecovery: true,
      userSatisfaction: true,
      reuseIntent: true,
    },
  });

  const byGroup = new Map<string, SurveyRow[]>();
  for (const row of rows) {
    const list = byGroup.get(row.groupId) ?? [];
    list.push(row);
    byGroup.set(row.groupId, list);
  }

  const summaries: Record<string, GroupSurveySummary> = {};
  for (const [groupId, list] of byGroup) {
    summaries[groupId] = summarizeSurveys(list);
  }
  return summaries;
}

export const previewSurveySummaries: Record<string, GroupSurveySummary> = {
  "preview-trip-group": {
    count: 2,
    emotionalRecoveryAvg: 4.0,
    satisfactionAvg: 5.0,
    reuseAvg: 5.0,
    recoveredCount: 2,
    recommendCount: 2,
  },
};

type SatisfactionStatsGroup = {
  id: string;
  groupName: string;
  serviceDate: Date | string;
  status: string;
  members: {
    residentId: string;
    memberStatus?: "ACTIVE" | "CANCELED" | "NO_SHOW";
    returnConfirmedAt?: Date | string | null;
  }[];
  surveys: SatisfactionStatsSurvey[];
  incidentReports: { id: string }[];
};

type SatisfactionStatsSurvey = {
  id: string;
  groupId: string;
  emotionalRecovery: number | null;
  userSatisfaction: number;
  linkerSatisfaction: number | null;
  taxiSatisfaction: number | null;
  costBurdenFeeling: number | null;
  reuseIntent: number;
  inconvenience: string | null;
  improvementRequest: string | null;
  collectedVia: string;
  hasIncident: boolean;
  hasComplaint: boolean;
  issueTypes: string[];
  groupName?: string;
  serviceDate?: Date | string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function parseSatisfactionStatsMonth(value?: string | null) {
  const month = String(value ?? "").trim() || currentMonth();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("대상 월은 YYYY-MM 형식이어야 합니다.");
  }
  getMonthRange(month);
  return month;
}

function buildGroupWhere(
  month: string,
  reportDateBasis: SatisfactionStats["reportDateBasis"],
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
      in: ["RETURN_CONFIRMED", "SETTLED", "REPORTED"],
    },
    surveys: {
      some: {},
    },
    ...dateFilter,
  };
}

function averageScore(values: (number | null | undefined)[]) {
  const scores = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (scores.length === 0) {
    return null;
  }
  return Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1));
}

function positiveRate(positiveCount: number, responseCount: number) {
  if (responseCount === 0) {
    return 0;
  }
  return Math.round((positiveCount / responseCount) * 100);
}

function buildMetric(
  key: SatisfactionScoreMetric["key"],
  label: string,
  values: (number | null | undefined)[],
): SatisfactionScoreMetric {
  const scores = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const positiveCount = scores.filter((value) => value >= 4).length;
  return {
    key,
    label,
    average: averageScore(scores),
    responseCount: scores.length,
    positiveCount,
    positiveRate: positiveRate(positiveCount, scores.length),
  };
}

function safeFeedbackText(value: string | null | undefined) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text || hasForbiddenSensitiveInfo(text)) {
    return null;
  }
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function formatGroupLabel(survey: SatisfactionStatsSurvey) {
  const date =
    survey.serviceDate instanceof Date
      ? survey.serviceDate.toISOString().slice(0, 10)
      : String(survey.serviceDate ?? "").slice(0, 10);
  return [date, survey.groupName].filter(Boolean).join(" · ");
}

export function summarizeSatisfactionStats(input: {
  month: string;
  reportDateBasis: SatisfactionStats["reportDateBasis"];
  groups: SatisfactionStatsGroup[];
  feedbackAccess?: SatisfactionStats["feedbackAccess"];
}): SatisfactionStats {
  const groupRecords = input.groups.filter((group) => {
    const reportMonth = getReportMonth(
      {
        id: group.id,
        serviceDate: group.serviceDate,
        status: group.status as never,
        members: group.members,
      },
      input.reportDateBasis,
    );
    return reportMonth === input.month;
  });
  const surveys = groupRecords.flatMap((group) =>
    group.surveys.map((survey) => ({
      ...survey,
      groupName: group.groupName,
      serviceDate: group.serviceDate,
    })),
  );
  const issueSurveyCount = surveys.filter(
    (survey) => survey.hasIncident || survey.hasComplaint || survey.issueTypes.length > 0,
  ).length;
  const issueTypeCounts = new Map<string, number>();
  for (const survey of surveys) {
    for (const issueType of survey.issueTypes) {
      const label = issueType.trim();
      if (label) {
        issueTypeCounts.set(label, (issueTypeCounts.get(label) ?? 0) + 1);
      }
    }
  }

  let privacyOmittedCount = 0;
  const canShowFeedback = input.feedbackAccess !== "aggregateOnly";
  const feedbackItems = canShowFeedback
    ? surveys
        .flatMap((survey) => {
          const inconvenience = safeFeedbackText(survey.inconvenience);
          const improvement = safeFeedbackText(survey.improvementRequest);
          privacyOmittedCount +=
            (survey.inconvenience && !inconvenience ? 1 : 0) +
            (survey.improvementRequest && !improvement ? 1 : 0);
          return [
            inconvenience
              ? {
                  id: `${survey.id}-inconvenience`,
                  type: "inconvenience" as const,
                  typeLabel: "불편사항",
                  text: inconvenience,
                  groupLabel: formatGroupLabel(survey),
                  collectedVia: survey.collectedVia,
                }
              : null,
            improvement
              ? {
                  id: `${survey.id}-improvement`,
                  type: "improvement" as const,
                  typeLabel: "개선 요청",
                  text: improvement,
                  groupLabel: formatGroupLabel(survey),
                  collectedVia: survey.collectedVia,
                }
              : null,
          ];
        })
        .filter((item): item is SatisfactionFeedbackItem => Boolean(item))
        .slice(0, 8)
    : [];

  return {
    month: input.month,
    reportDateBasis: input.reportDateBasis,
    responseCount: surveys.length,
    groupCount: groupRecords.length,
    mobileResponseCount: surveys.filter((survey) => survey.collectedVia === "mobile").length,
    operatorResponseCount: surveys.filter((survey) => survey.collectedVia !== "mobile").length,
    issueSurveyCount,
    incidentReportCount: groupRecords.reduce(
      (sum, group) => sum + group.incidentReports.length,
      0,
    ),
    metrics: [
      buildMetric(
        "userSatisfaction",
        "이용자 만족도",
        surveys.map((survey) => survey.userSatisfaction),
      ),
      buildMetric(
        "linkerSatisfaction",
        "동행링커 만족도",
        surveys.map((survey) => survey.linkerSatisfaction),
      ),
      buildMetric(
        "taxiSatisfaction",
        "택시 만족도",
        surveys.map((survey) => survey.taxiSatisfaction),
      ),
      buildMetric(
        "costBurdenFeeling",
        "비용 부담 체감",
        surveys.map((survey) => survey.costBurdenFeeling),
      ),
      buildMetric(
        "reuseIntent",
        "재이용 의향",
        surveys.map((survey) => survey.reuseIntent),
      ),
      buildMetric(
        "emotionalRecovery",
        "정서회복",
        surveys.map((survey) => survey.emotionalRecovery),
      ),
    ],
    issueTypeRows: [...issueTypeCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    feedbackItems,
    feedbackAccess: input.feedbackAccess ?? "full",
    privacyOmittedCount,
  };
}

export async function getSatisfactionStats(
  user: AuthUser,
  filters: SatisfactionStatsFilters = {},
): Promise<SatisfactionStats> {
  assertPermission(user, "report:read");
  const month = parseSatisfactionStatsMonth(filters.month);
  const settings = await getOperatingSettings();
  const groups = await prisma.mobilityGroup.findMany({
    where: buildGroupWhere(month, settings.reportDateBasis),
    orderBy: [{ serviceDate: "asc" }, { updatedAt: "asc" }],
    take: 160,
    select: {
      id: true,
      groupName: true,
      serviceDate: true,
      status: true,
      members: {
        select: {
          residentId: true,
          memberStatus: true,
          returnConfirmedAt: true,
        },
      },
      surveys: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          groupId: true,
          emotionalRecovery: true,
          userSatisfaction: true,
          linkerSatisfaction: true,
          taxiSatisfaction: true,
          costBurdenFeeling: true,
          reuseIntent: true,
          inconvenience: true,
          improvementRequest: true,
          collectedVia: true,
          hasIncident: true,
          hasComplaint: true,
          issueTypes: true,
        },
      },
      incidentReports: {
        select: {
          id: true,
        },
      },
    },
  });

  return summarizeSatisfactionStats({
    month,
    reportDateBasis: settings.reportDateBasis,
    groups,
    feedbackAccess: user.role === "VIEWER" ? "aggregateOnly" : "full",
  });
}

const previewSatisfactionGroups: SatisfactionStatsGroup[] = [
  {
    id: "preview-report-group-2",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    serviceDate: "2026-06-03",
    status: "SETTLED",
    members: [
      { residentId: "preview-resident-1", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-03" },
      { residentId: "preview-resident-3", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-03" },
    ],
    incidentReports: [],
    surveys: [
      {
        id: "preview-survey-1",
        groupId: "preview-report-group-2",
        emotionalRecovery: 5,
        userSatisfaction: 5,
        linkerSatisfaction: 5,
        taxiSatisfaction: 4,
        costBurdenFeeling: 4,
        reuseIntent: 5,
        inconvenience: null,
        improvementRequest: "예약 시간이 더 크게 보이면 좋겠습니다.",
        collectedVia: "mobile",
        hasIncident: false,
        hasComplaint: false,
        issueTypes: [],
      },
      {
        id: "preview-survey-2",
        groupId: "preview-report-group-2",
        emotionalRecovery: 4,
        userSatisfaction: 4,
        linkerSatisfaction: 5,
        taxiSatisfaction: 4,
        costBurdenFeeling: 3,
        reuseIntent: 5,
        inconvenience: "귀가 확인 안내가 조금 늦었습니다.",
        improvementRequest: "도착 전 안내 전화를 한 번 더 받으면 좋겠습니다.",
        collectedVia: "operator",
        hasIncident: false,
        hasComplaint: true,
        issueTypes: ["안내 지연"],
      },
    ],
  },
  {
    id: "preview-report-group-3",
    groupName: "2026-06-05 오후 백천시장 이동",
    serviceDate: "2026-06-05",
    status: "RETURN_CONFIRMED",
    members: [
      { residentId: "preview-resident-2", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-05" },
      { residentId: "preview-resident-4", memberStatus: "ACTIVE", returnConfirmedAt: "2026-06-05" },
    ],
    incidentReports: [{ id: "preview-incident-1" }],
    surveys: [
      {
        id: "preview-survey-3",
        groupId: "preview-report-group-3",
        emotionalRecovery: 4,
        userSatisfaction: 4,
        linkerSatisfaction: 4,
        taxiSatisfaction: 4,
        costBurdenFeeling: 3,
        reuseIntent: 4,
        inconvenience: "차량 승하차 위치를 더 미리 알려주면 좋겠습니다.",
        improvementRequest: null,
        collectedVia: "mobile",
        hasIncident: true,
        hasComplaint: false,
        issueTypes: ["승하차 안내"],
      },
    ],
  },
];

export function createPreviewSatisfactionStats(month = "2026-06") {
  return summarizeSatisfactionStats({
    month: parseSatisfactionStatsMonth(month),
    reportDateBasis: "serviceDate",
    groups: previewSatisfactionGroups,
    feedbackAccess: "full",
  });
}

export const previewSatisfactionStats = createPreviewSatisfactionStats();
