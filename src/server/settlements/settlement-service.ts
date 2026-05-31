import { Prisma } from "@prisma/client";
import {
  assertPermission,
  hasPermission,
  type AuthUser,
} from "@/domain/auth/permissions";
import {
  MOBILITY_STATUS_LABELS,
  ROUNDING_POLICY_LABELS,
  SETTLEMENT_MODE_LABELS,
  type RoundingPolicy,
  type SettlementMode,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo, maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { recordCsvExportAudit } from "@/server/reports/export-audit";
import {
  calculateDashboardSummary,
  getMonthRange,
} from "@/server/reports/report-calculator";
import { calculateSettlement } from "@/server/settlements/calculator";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export type SettlementListFilters = {
  query?: string;
  serviceDate?: string;
  settled?: string;
  fundMonth?: string;
  settlementMonth?: string;
  monthlySettled?: string;
  receipt?: string;
  tab?: string;
};

export type SettlementGroupMemberItem = {
  id: string;
  residentName: string;
  phoneMasked: string;
  pickupOrder: number;
  returnConfirmedAt: string;
};

export type SettlementListItem = {
  groupId: string;
  groupName: string;
  serviceDate: string;
  statusLabel: string;
  destinationSummary: string;
  residentCount: number;
  members: SettlementGroupMemberItem[];
  taxiActualFare: number | null;
  taxiExpectedFare: number | null;
  settlement: {
    id: string;
    settlementMode: SettlementMode;
    settlementModeLabel: string;
    roundingPolicy: RoundingPolicy;
    roundingPolicyLabel: string;
    totalFare: number;
    residentCount: number;
    residentTotalShare: number;
    residentPerPersonShare: number;
    anchorSupportAmount: number;
    linkerActivityFee: number | null;
    communityFundSupportAmount: number | null;
    receiptUrl: string;
    isSettled: boolean;
    settledAt: string;
    lockedAt: string;
    updatedReason: string;
  } | null;
};

export type SettlementPreview = {
  settlementMode: SettlementMode;
  roundingPolicy: RoundingPolicy;
  totalFare: number;
  residentCount: number;
  residentTotalShare: number;
  residentPerPersonShare: number;
  anchorSupportAmount: number;
  communityFundSupportAmount: number | null;
  linkerActivityFee: number | null;
  roundingAdjustmentAmount: number;
};

export type MonthlySettlementRow = {
  groupId: string;
  groupName: string;
  serviceDate: string;
  reportMonth: string;
  destinationSummary: string;
  residentCount: number;
  settlementStatus: "settled" | "unsettled";
  settlementStatusLabel: string;
  receiptStatus: "attached" | "missing";
  receiptStatusLabel: string;
  totalFare: number;
  residentTotalShare: number;
  residentPerPersonShare: number;
  anchorSupportAmount: number;
  communityFundSupportAmount: number;
  taxiActualFare: number | null;
  taxiExpectedFare: number | null;
  settledAt: string;
};

export type MonthlySettlementSummary = {
  month: string;
  reportDateBasis: "serviceDate" | "returnConfirmedAt";
  rowCount: number;
  settledCount: number;
  unsettledCount: number;
  receiptMissingCount: number;
  totalFareSum: number;
  residentTotalShareSum: number;
  anchorSupportAmountSum: number;
  communityFundSupportAmountSum: number;
  averageResidentShare: number;
};

export type MonthlySettlementTable = {
  rows: MonthlySettlementRow[];
  summary: MonthlySettlementSummary;
};

export type SaveSettlementInput = {
  groupId: string;
  settlementMode?: string;
  roundingPolicy?: string;
  totalFare?: string | number | null;
  residentCount?: string | number | null;
  communityFundSupportAmount?: string | number | null;
  customResidentTotalShare?: string | number | null;
  linkerActivityFee?: string | number | null;
  receiptUrl?: string;
  isSettled?: boolean;
  updatedReason?: string;
};

export type RecordSettlementCsvInput = {
  reason?: string;
  month?: string;
};

export type DashboardMetricItem = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardTaskItem = {
  state: string;
  title: string;
  description: string;
  tone: "neutral" | "warning" | "info" | "success";
};

export type DashboardSettlementRow = {
  label: string;
  value: string;
  note: string;
};

export type DashboardSummaryView = {
  metrics: DashboardMetricItem[];
  tasks: DashboardTaskItem[];
  settlementRows: DashboardSettlementRow[];
};

const performanceStatuses = ["RETURN_CONFIRMED", "SETTLED", "REPORTED"] as const;
const numberFormatter = new Intl.NumberFormat("ko-KR");

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

function parseMonth(value: unknown) {
  const text = requireText("대상 월", value, 7);
  if (!/^\d{4}-\d{2}$/.test(text)) {
    throw new Error("대상 월은 YYYY-MM 형식이어야 합니다.");
  }
  getMonthRange(text);
  return text;
}

function parseOptionalMonth(value: unknown) {
  const text = optionalCleanText(value, 7);
  return text ? parseMonth(text) : currentMonth();
}

function parseOptionalInteger(label: string, value: unknown) {
  const text = optionalCleanText(value, 20);
  if (!text) {
    return undefined;
  }
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label}은 0 이상의 정수로 입력해 주세요.`);
  }
  return number;
}

function parseRequiredInteger(label: string, value: unknown) {
  const number = parseOptionalInteger(label, value);
  if (number === undefined) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return number;
}

function parseOptionalPositiveInteger(label: string, value: unknown) {
  const number = parseOptionalInteger(label, value);
  if (number === undefined) {
    return undefined;
  }
  if (number < 1) {
    throw new Error(`${label}은 1 이상의 정수로 입력해 주세요.`);
  }
  return number;
}

function parseRequiredPositiveInteger(label: string, value: unknown) {
  const number = parseOptionalPositiveInteger(label, value);
  if (number === undefined) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return number;
}

function parseSettlementMode(value: unknown): SettlementMode {
  const mode = requireText("정산 모드", value, 40) as SettlementMode;
  if (!(mode in SETTLEMENT_MODE_LABELS)) {
    throw new Error("정산 모드를 다시 선택해 주세요.");
  }
  return mode;
}

function parseRoundingPolicy(value: unknown): RoundingPolicy {
  const policy = requireText("원 단위 처리", value, 40) as RoundingPolicy;
  if (!(policy in ROUNDING_POLICY_LABELS)) {
    throw new Error("원 단위 처리 값을 다시 선택해 주세요.");
  }
  return policy;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date?: Date | null) {
  return date ? date.toISOString().slice(0, 16) : "";
}

function formatKrw(value: number) {
  return `${numberFormatter.format(value)}원`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

type SettlementGroupRecord = Prisma.MobilityGroupGetPayload<{
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
    taxiReservation: true;
    settlement: true;
  };
}>;

function activeMembers(group: Pick<SettlementGroupRecord, "members">) {
  return group.members.filter((member) => member.memberStatus === "ACTIVE");
}

function latestReturnConfirmedAt(group: Pick<SettlementGroupRecord, "members">) {
  const timestamps = activeMembers(group)
    .map((member) => member.returnConfirmedAt)
    .filter((value): value is Date => Boolean(value))
    .map((value) => value.getTime());

  if (timestamps.length === 0) {
    return null;
  }
  return new Date(Math.max(...timestamps));
}

function getSettlementReportMonth(
  group: Pick<SettlementGroupRecord, "serviceDate" | "members">,
  reportDateBasis: "serviceDate" | "returnConfirmedAt",
) {
  if (reportDateBasis === "serviceDate") {
    return monthKey(group.serviceDate);
  }
  const confirmedAt = latestReturnConfirmedAt(group);
  return confirmedAt ? monthKey(confirmedAt) : null;
}

function toSettlementListItem(group: SettlementGroupRecord): SettlementListItem {
  const settlement = group.settlement;
  const members = activeMembers(group);

  return {
    groupId: group.id,
    groupName: group.groupName,
    serviceDate: formatDateOnly(group.serviceDate),
    statusLabel: MOBILITY_STATUS_LABELS[group.status],
    destinationSummary: group.destinationSummary,
    residentCount: members.length,
    members: members.map((member) => ({
      id: member.id,
      residentName: member.resident.name,
      phoneMasked: maskPhone(member.resident.phone),
      pickupOrder: member.pickupOrder,
      returnConfirmedAt: formatDateTime(member.returnConfirmedAt),
    })),
    taxiActualFare: group.taxiReservation?.actualFare ?? null,
    taxiExpectedFare: group.taxiReservation?.expectedFare ?? null,
    settlement: settlement
      ? {
          id: settlement.id,
          settlementMode: settlement.settlementMode,
          settlementModeLabel: SETTLEMENT_MODE_LABELS[settlement.settlementMode],
          roundingPolicy: settlement.roundingPolicy,
          roundingPolicyLabel: ROUNDING_POLICY_LABELS[settlement.roundingPolicy],
          totalFare: settlement.totalFare,
          residentCount: settlement.residentCount,
          residentTotalShare: settlement.residentTotalShare,
          residentPerPersonShare: settlement.residentPerPersonShare,
          anchorSupportAmount: settlement.anchorSupportAmount,
          linkerActivityFee: settlement.linkerActivityFee,
          communityFundSupportAmount: settlement.communityFundSupportAmount,
          receiptUrl: settlement.receiptUrl ?? "",
          isSettled: settlement.isSettled,
          settledAt: formatDateTime(settlement.settledAt),
          lockedAt: formatDateTime(settlement.lockedAt),
          updatedReason: settlement.updatedReason ?? "",
        }
      : null,
  };
}

function toMonthlySettlementRow(
  group: SettlementGroupRecord,
  reportDateBasis: "serviceDate" | "returnConfirmedAt",
): MonthlySettlementRow {
  const settlement = group.settlement;
  const settlementStatus = settlement?.isSettled ? "settled" : "unsettled";
  const receiptAttached = Boolean(
    settlement?.receiptUrl ||
      group.taxiReservation?.receiptAttached ||
      group.taxiReservation?.receiptUrl,
  );
  const totalFare =
    settlement?.totalFare ??
    group.taxiReservation?.actualFare ??
    group.taxiReservation?.expectedFare ??
    0;
  return {
    groupId: group.id,
    groupName: group.groupName,
    serviceDate: formatDateOnly(group.serviceDate),
    reportMonth: getSettlementReportMonth(group, reportDateBasis) ?? "",
    destinationSummary: group.destinationSummary,
    residentCount: activeMembers(group).length,
    settlementStatus,
    settlementStatusLabel: settlementStatus === "settled" ? "정산완료" : "미정산",
    receiptStatus: receiptAttached ? "attached" : "missing",
    receiptStatusLabel: receiptAttached ? "영수증 확인" : "영수증 누락",
    totalFare,
    residentTotalShare: settlement?.residentTotalShare ?? 0,
    residentPerPersonShare: settlement?.residentPerPersonShare ?? 0,
    anchorSupportAmount: settlement?.anchorSupportAmount ?? 0,
    communityFundSupportAmount: settlement?.communityFundSupportAmount ?? 0,
    taxiActualFare: group.taxiReservation?.actualFare ?? null,
    taxiExpectedFare: group.taxiReservation?.expectedFare ?? null,
    settledAt: formatDateTime(settlement?.settledAt),
  };
}

export function summarizeMonthlySettlementRows(
  month: string,
  reportDateBasis: "serviceDate" | "returnConfirmedAt",
  rows: MonthlySettlementRow[],
): MonthlySettlementSummary {
  const settledRows = rows.filter((row) => row.settlementStatus === "settled");
  return {
    month,
    reportDateBasis,
    rowCount: rows.length,
    settledCount: settledRows.length,
    unsettledCount: rows.length - settledRows.length,
    receiptMissingCount: rows.filter((row) => row.receiptStatus === "missing").length,
    totalFareSum: rows.reduce((sum, row) => sum + row.totalFare, 0),
    residentTotalShareSum: rows.reduce((sum, row) => sum + row.residentTotalShare, 0),
    anchorSupportAmountSum: rows.reduce((sum, row) => sum + row.anchorSupportAmount, 0),
    communityFundSupportAmountSum: rows.reduce(
      (sum, row) => sum + row.communityFundSupportAmount,
      0,
    ),
    averageResidentShare:
      settledRows.length > 0
        ? Math.round(
            settledRows.reduce((sum, row) => sum + row.residentPerPersonShare, 0) /
              settledRows.length,
          )
        : 0,
  };
}

async function findSettlementGroup(tx: Prisma.TransactionClient, groupId: string) {
  const group = await tx.mobilityGroup.findFirst({
    where: {
      id: cleanText(groupId, 80),
      deletedAt: null,
    },
    include: {
      members: {
        include: {
          resident: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
      taxiReservation: true,
      settlement: true,
    },
  });
  if (!group) {
    throw new Error("정산할 운행 그룹을 찾을 수 없습니다.");
  }
  if (!performanceStatuses.includes(group.status as (typeof performanceStatuses)[number])) {
    throw new Error("귀가확인 이후의 운행만 정산할 수 있습니다.");
  }
  return group;
}

export async function listSettlementGroups(filters: SettlementListFilters = {}) {
  const and: Prisma.MobilityGroupWhereInput[] = [
    {
      deletedAt: null,
      status: { in: [...performanceStatuses] },
    },
  ];
  const query = cleanText(filters.query, 80);
  const serviceDate = filters.serviceDate ? parseDateOnly(filters.serviceDate) : undefined;
  const settled = cleanText(filters.settled, 20);

  if (query) {
    and.push({
      OR: [
        { groupName: { contains: query, mode: "insensitive" } },
        { destinationSummary: { contains: query, mode: "insensitive" } },
        { taxiReservation: { is: { vehicleNumber: { contains: query, mode: "insensitive" } } } },
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
  if (settled === "settled") {
    and.push({ settlement: { is: { isSettled: true } } });
  } else if (settled === "unsettled") {
    and.push({
      OR: [{ settlement: null }, { settlement: { is: { isSettled: false } } }],
    });
  }

  const groups = await prisma.mobilityGroup.findMany({
    where: { AND: and },
    orderBy: [{ serviceDate: "desc" }, { updatedAt: "desc" }],
    take: 80,
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
      taxiReservation: true,
      settlement: true,
    },
  });

  return groups.map(toSettlementListItem);
}

export async function listMonthlySettlements(
  filters: SettlementListFilters = {},
): Promise<MonthlySettlementTable> {
  const month = parseOptionalMonth(filters.settlementMonth);
  const settings = await getOperatingSettings();
  const reportDateBasis = settings.reportDateBasis;
  const { startsAt, endsBefore } = getMonthRange(month);
  const and: Prisma.MobilityGroupWhereInput[] = [
    {
      deletedAt: null,
      status: { in: [...performanceStatuses] },
    },
  ];

  if (reportDateBasis === "serviceDate") {
    and.push({
      serviceDate: {
        gte: startsAt,
        lt: endsBefore,
      },
    });
  } else {
    and.push({
      members: {
        some: {
          returnConfirmedAt: {
            gte: startsAt,
            lt: endsBefore,
          },
        },
      },
    });
  }

  const groups = await prisma.mobilityGroup.findMany({
    where: { AND: and },
    orderBy: [{ serviceDate: "asc" }, { updatedAt: "desc" }],
    take: 160,
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
      taxiReservation: true,
      settlement: true,
    },
  });

  const settledFilter = cleanText(filters.monthlySettled, 20);
  const receiptFilter = cleanText(filters.receipt, 20);
  const rows = groups
    .map((group) => toMonthlySettlementRow(group, reportDateBasis))
    .filter((row) => row.reportMonth === month)
    .filter((row) =>
      settledFilter === "settled" || settledFilter === "unsettled"
        ? row.settlementStatus === settledFilter
        : true,
    )
    .filter((row) =>
      receiptFilter === "attached" || receiptFilter === "missing"
        ? row.receiptStatus === receiptFilter
        : true,
    );

  return {
    rows,
    summary: summarizeMonthlySettlementRows(month, reportDateBasis, rows),
  };
}

export async function saveSettlement(user: AuthUser, input: SaveSettlementInput) {
  assertPermission(user, "settlement:write");

  return prisma.$transaction(async (tx) => {
    const group = await findSettlementGroup(tx, input.groupId);
    const existing = group.settlement;
    const updateReason = optionalCleanText(input.updatedReason, 300);

    if (existing?.lockedAt) {
      if (!hasPermission(user, "settlement:unlock")) {
        throw new Error("정산 완료 후 수정은 잠금 해제 권한이 필요합니다.");
      }
      if (!updateReason) {
        throw new Error("정산 완료 후 수정하려면 수정 사유를 입력해 주세요.");
      }
    }

    const settings = await getOperatingSettings(tx);
    const members = activeMembers(group);
    const residentCount =
      parseOptionalPositiveInteger("주민 수", input.residentCount) ?? Math.max(1, members.length);
    const totalFare =
      parseOptionalInteger("총 택시요금", input.totalFare) ??
      group.taxiReservation?.actualFare ??
      group.taxiReservation?.expectedFare ??
      settings.defaultFare;
    const settlementMode = input.settlementMode
      ? parseSettlementMode(input.settlementMode)
      : existing?.settlementMode ?? "PILOT";
    const roundingPolicy = input.roundingPolicy
      ? parseRoundingPolicy(input.roundingPolicy)
      : existing?.roundingPolicy ?? settings.fareRoundingPolicy;
    const communityFundSupportAmount = parseOptionalInteger(
      "상생기금 지원금",
      input.communityFundSupportAmount,
    );
    const customResidentTotalShare = parseOptionalInteger(
      "주민 총 분담금",
      input.customResidentTotalShare,
    );
    const linkerActivityFee = parseOptionalInteger("동행링커 활동비", input.linkerActivityFee);

    const calculation = calculateSettlement({
      totalFare,
      residentCount,
      settlementMode,
      roundingPolicy,
      communityFundSupportAmount,
      customResidentTotalShare,
      linkerActivityFee,
    });

    const now = new Date();
    const willSettle = Boolean(input.isSettled);
    const receiptUrl = optionalCleanText(input.receiptUrl, 300);
    assertNoForbiddenSensitiveInfo({
      "영수증 링크": receiptUrl,
      "정산 수정 사유": updateReason,
    });

    const data = {
      settlementMode: calculation.settlementMode,
      roundingPolicy: calculation.roundingPolicy,
      totalFare: calculation.totalFare,
      residentCount: calculation.residentCount,
      residentTotalShare: calculation.residentTotalShare,
      residentPerPersonShare: calculation.residentPerPersonShare,
      anchorSupportAmount: calculation.anchorSupportAmount,
      linkerActivityFee: calculation.linkerActivityFee,
      communityFundSupportAmount: calculation.communityFundSupportAmount,
      receiptUrl,
      isSettled: existing?.isSettled || willSettle,
      settledAt: existing?.settledAt ?? (willSettle ? now : null),
      lockedAt: existing?.lockedAt ?? (willSettle ? now : null),
      updatedReason: updateReason,
    };

    const settlement = existing
      ? await tx.settlement.update({
          where: { id: existing.id },
          data,
        })
      : await tx.settlement.create({
          data: {
            groupId: group.id,
            ...data,
          },
        });

    if (settlement.isSettled) {
      await tx.mobilityGroup.update({
        where: { id: group.id },
        data: { status: "SETTLED" },
      });
      await tx.mobilityRequest.updateMany({
        where: {
          groupMembers: {
            some: {
              groupId: group.id,
              memberStatus: "ACTIVE",
            },
          },
        },
        data: { status: "SETTLED" },
      });
    }

    await writeAuditLog(tx, {
      userId: user.id,
      action: existing ? "UPDATE" : "CREATE",
      targetType: "Settlement",
      targetId: settlement.id,
      beforeValue: existing,
      afterValue: settlement,
      note: updateReason ?? (settlement.isSettled ? "정산 완료" : "정산 저장"),
    });

    if (!existing?.lockedAt && settlement.lockedAt) {
      await writeAuditLog(tx, {
        userId: user.id,
        action: "SETTLEMENT_LOCK",
        targetType: "Settlement",
        targetId: settlement.id,
        afterValue: {
          lockedAt: settlement.lockedAt,
          settledAt: settlement.settledAt,
        },
      });
    }

    if (existing?.lockedAt && updateReason) {
      await writeAuditLog(tx, {
        userId: user.id,
        action: "SETTLEMENT_UNLOCK",
        targetType: "Settlement",
        targetId: settlement.id,
        beforeValue: {
          lockedAt: existing.lockedAt,
          updatedReason: existing.updatedReason,
        },
        afterValue: {
          lockedAt: settlement.lockedAt,
          updatedReason: updateReason,
        },
        note: "정산 완료 후 수정",
      });
    }

    return settlement;
  });
}

export async function previewSettlement(input: SaveSettlementInput): Promise<SettlementPreview> {
  const settings = await getOperatingSettings();
  const settlementMode = input.settlementMode ? parseSettlementMode(input.settlementMode) : "PILOT";
  const roundingPolicy = input.roundingPolicy
    ? parseRoundingPolicy(input.roundingPolicy)
    : settings.fareRoundingPolicy;
  const totalFare = parseRequiredInteger("총 택시요금", input.totalFare);
  const residentCount = parseRequiredPositiveInteger("주민 수", input.residentCount);

  return calculateSettlement({
    totalFare,
    residentCount,
    settlementMode,
    roundingPolicy,
    communityFundSupportAmount: parseOptionalInteger(
      "상생기금 지원금",
      input.communityFundSupportAmount,
    ),
    customResidentTotalShare: parseOptionalInteger("주민 총 분담금", input.customResidentTotalShare),
    linkerActivityFee: parseOptionalInteger("동행링커 활동비", input.linkerActivityFee),
  });
}

export async function recordSettlementCsvPreparation(
  user: AuthUser,
  input: RecordSettlementCsvInput,
) {
  const reason = requireText("CSV 준비 사유", input.reason, 300);
  const month = optionalCleanText(input.month, 7) ?? currentMonth();
  return recordCsvExportAudit(user, {
    targetType: "User",
    targetId: user.id,
    reason: `${month} ${reason}`,
    columns: [
      "month",
      "groupName",
      "serviceDate",
      "totalFare",
      "residentPerPersonShare",
      "anchorSupportAmount",
      "communityFundSupportAmount",
    ],
  });
}

export async function getDashboardSummaryView(): Promise<DashboardSummaryView> {
  const [requests, groups, settlements, linkers, settings] = await Promise.all([
    prisma.mobilityRequest.findMany({
      where: { deletedAt: null },
      orderBy: { desiredDate: "desc" },
      take: 120,
      select: {
        desiredDate: true,
        status: true,
      },
    }),
    prisma.mobilityGroup.findMany({
      where: { deletedAt: null },
      orderBy: { serviceDate: "desc" },
      take: 120,
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
    }),
    prisma.settlement.findMany({
      orderBy: { settledAt: "desc" },
      take: 120,
      select: {
        groupId: true,
        totalFare: true,
        residentTotalShare: true,
        residentPerPersonShare: true,
        anchorSupportAmount: true,
        isSettled: true,
      },
    }),
    prisma.linker.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        status: true,
      },
    }),
    getOperatingSettings(),
  ]);

  const summary = calculateDashboardSummary({
    requests,
    groups,
    settlements,
    linkers,
  });
  const settledItems = settlements.filter((settlement) => settlement.isSettled);
  const totalFare = settledItems.reduce((sum, settlement) => sum + settlement.totalFare, 0);
  const anchorSupport = settledItems.reduce(
    (sum, settlement) => sum + settlement.anchorSupportAmount,
    0,
  );
  const averageResidentShare =
    settledItems.length > 0
      ? Math.round(
          settledItems.reduce((sum, settlement) => sum + settlement.residentPerPersonShare, 0) /
            settledItems.length,
        )
      : 0;

  return {
    metrics: [
      {
        label: "오늘 신청",
        value: `${summary.todayRequestCount}건`,
        detail: summary.todayRequestCount > 0 ? "오늘 처리 대상" : "접수 대기 없음",
      },
      {
        label: "공동예약",
        value: `${summary.todayGroupCount}그룹`,
        detail: summary.todayGroupCount > 0 ? "오늘 운행 그룹" : "오늘 그룹 없음",
      },
      {
        label: "귀가 확인",
        value: `${summary.returnConfirmedCount}건`,
        detail: "귀가확인 이상 누적",
      },
      {
        label: "정산 대기",
        value: `${summary.unsettledCount}건`,
        detail: summary.unsettledCount > 0 ? "정산 입력 필요" : "정산 대기 없음",
      },
    ],
    tasks: [
      {
        state: summary.todayRequestCount > 0 ? "확인" : "준비",
        title: "주민 신청 확인",
        description: "오늘 접수된 이동 신청의 연락처와 희망 일정을 확인합니다.",
        tone: summary.todayRequestCount > 0 ? "warning" : "neutral",
      },
      {
        state: summary.todayGroupCount > 0 ? "진행" : "대기",
        title: "공동예약 그룹 구성",
        description: "운행일과 목적지가 맞는 신청을 공동예약으로 묶습니다.",
        tone: summary.todayGroupCount > 0 ? "info" : "warning",
      },
      {
        state: `${summary.activeLinkerCount}명`,
        title: "동행링커 배정",
        description: "활동가능 동행링커와 택시 요청 상태를 함께 확인합니다.",
        tone: "info",
      },
      {
        state: summary.unsettledCount > 0 ? "필요" : "완료",
        title: "귀가와 정산 기록",
        description: "귀가 확인, 요금, 영수증 링크, 앵커 지원금을 빠짐없이 남깁니다.",
        tone: summary.unsettledCount > 0 ? "warning" : "success",
      },
    ],
    settlementRows: [
      {
        label: "정산 완료 요금",
        value: formatKrw(totalFare),
        note: `${settledItems.length}건 기준`,
      },
      {
        label: "앵커 지원금",
        value: formatKrw(anchorSupport),
        note: "정산 완료 기준",
      },
      {
        label: "주민 1인 평균",
        value: formatKrw(averageResidentShare),
        note: `원 단위 처리 ${settings.fareRoundingPolicy}`,
      },
    ],
  };
}

export const previewDashboardSummary: DashboardSummaryView = {
  metrics: [
    { label: "오늘 신청", value: "0건", detail: "접수 대기 없음" },
    { label: "공동예약", value: "0그룹", detail: "오늘 그룹 없음" },
    { label: "귀가 확인", value: "0건", detail: "귀가확인 이상 누적" },
    { label: "정산 대기", value: "0건", detail: "정산 대기 없음" },
  ],
  tasks: [
    {
      state: "준비",
      title: "주민 신청 확인",
      description: "접수된 이동 신청의 연락처와 희망 일정을 확인합니다.",
      tone: "neutral",
    },
    {
      state: "대기",
      title: "공동예약 그룹 구성",
      description: "이동 방향과 시간대가 맞는 주민을 최대 3명까지 묶습니다.",
      tone: "warning",
    },
    {
      state: "대기",
      title: "동행링커 배정",
      description: "배정 가능한 동행링커와 택시 요청 상태를 함께 확인합니다.",
      tone: "info",
    },
    {
      state: "확인",
      title: "귀가와 정산 기록",
      description: "귀가 확인, 요금, 영수증 링크, 앵커 지원금을 빠짐없이 남깁니다.",
      tone: "success",
    },
  ],
  settlementRows: [
    {
      label: "정산 완료 요금",
      value: "0원",
      note: "실제 DB 연결 후 집계",
    },
    {
      label: "앵커 지원금",
      value: "0원",
      note: "정산 완료 기준",
    },
    {
      label: "주민 1인 평균",
      value: "0원",
      note: `원 단위 처리 ${DEFAULT_OPERATING_SETTINGS.fareRoundingPolicy}`,
    },
  ],
};

export const previewSettlementGroups: SettlementListItem[] = [
  {
    groupId: "preview-settlement-group",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    serviceDate: "2026-06-03",
    statusLabel: "귀가확인",
    destinationSummary: "백천종합병원",
    residentCount: 2,
    members: [
      {
        id: "preview-member-1",
        residentName: "홍길순",
        phoneMasked: "010-****-5678",
        pickupOrder: 1,
        returnConfirmedAt: "2026-06-03T13:40",
      },
      {
        id: "preview-member-2",
        residentName: "박순자",
        phoneMasked: "010-****-2222",
        pickupOrder: 2,
        returnConfirmedAt: "2026-06-03T13:45",
      },
    ],
    taxiActualFare: 28000,
    taxiExpectedFare: 30000,
    settlement: {
      id: "preview-settlement",
      settlementMode: "SELF_RELIANCE",
      settlementModeLabel: "자립전환기",
      roundingPolicy: "FLOOR",
      roundingPolicyLabel: "절사",
      totalFare: 28000,
      residentCount: 2,
      residentTotalShare: 28000,
      residentPerPersonShare: 14000,
      anchorSupportAmount: 0,
      linkerActivityFee: 10000,
      communityFundSupportAmount: null,
      receiptUrl: "",
      isSettled: false,
      settledAt: "",
      lockedAt: "",
      updatedReason: "",
    },
  },
];

const previewMonthlySettlementRows: MonthlySettlementRow[] = [
  {
    groupId: "preview-settlement-group",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    serviceDate: "2026-06-03",
    reportMonth: "2026-06",
    destinationSummary: "백천종합병원",
    residentCount: 2,
    settlementStatus: "settled",
    settlementStatusLabel: "정산완료",
    receiptStatus: "attached",
    receiptStatusLabel: "영수증 확인",
    totalFare: 28000,
    residentTotalShare: 28000,
    residentPerPersonShare: 14000,
    anchorSupportAmount: 0,
    communityFundSupportAmount: 0,
    taxiActualFare: 28000,
    taxiExpectedFare: 30000,
    settledAt: "2026-06-03T14:10",
  },
  {
    groupId: "preview-settlement-group-2",
    groupName: "2026-06-05 오후 백천시장 이동",
    serviceDate: "2026-06-05",
    reportMonth: "2026-06",
    destinationSummary: "백천시장",
    residentCount: 3,
    settlementStatus: "unsettled",
    settlementStatusLabel: "미정산",
    receiptStatus: "missing",
    receiptStatusLabel: "영수증 누락",
    totalFare: 36000,
    residentTotalShare: 0,
    residentPerPersonShare: 0,
    anchorSupportAmount: 0,
    communityFundSupportAmount: 0,
    taxiActualFare: 36000,
    taxiExpectedFare: 38000,
    settledAt: "",
  },
];

export const previewMonthlySettlementTable: MonthlySettlementTable = {
  rows: previewMonthlySettlementRows,
  summary: summarizeMonthlySettlementRows("2026-06", "serviceDate", previewMonthlySettlementRows),
};
