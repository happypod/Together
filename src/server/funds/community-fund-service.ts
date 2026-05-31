import {
  type CommunityFundType as PrismaCommunityFundType,
  type Prisma,
} from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  COMMUNITY_FUND_TYPE_LABELS,
  type CommunityFundType,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

export type CommunityFundFilters = {
  month?: string;
};

export type CommunityFundInput = {
  id?: string | null;
  groupId?: string | null;
  month?: string | null;
  amount?: string | number | null;
  fundType?: string | null;
  source?: string | null;
  note?: string | null;
};

export type CommunityFundListItem = {
  id: string;
  groupId: string;
  groupName: string;
  month: string;
  amount: number;
  fundType: CommunityFundType;
  fundTypeLabel: string;
  source: string;
  note: string;
  createdAt: string;
};

export type CommunityFundGroupOption = {
  id: string;
  label: string;
  month: string;
};

export type CommunityFundMonthlySummary = {
  month: string;
  contributionAmount: number;
  supportRecordAmount: number;
  recordCount: number;
};

type CommunityFundRecord = Prisma.CommunityFundGetPayload<{
  include: {
    group: {
      select: {
        groupName: true;
        serviceDate: true;
      };
    };
  };
}>;

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

function parseRequiredPositiveInteger(label: string, value: unknown) {
  const text = requireText(label, value, 20);
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${label}은 1 이상의 정수로 입력해 주세요.`);
  }
  return number;
}

function parseMonth(value: unknown) {
  const text = requireText("대상 월", value, 7);
  if (!/^\d{4}-\d{2}$/.test(text)) {
    throw new Error("대상 월은 YYYY-MM 형식이어야 합니다.");
  }
  const date = new Date(`${text}-01T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("대상 월을 다시 확인해 주세요.");
  }
  return text;
}

function optionalMonth(value: unknown) {
  const text = optionalCleanText(value, 7);
  return text ? parseMonth(text) : currentMonth();
}

function parseFundType(value: unknown): PrismaCommunityFundType {
  const fundType = requireText("상생기금 유형", value, 40) as CommunityFundType;
  if (!(fundType in COMMUNITY_FUND_TYPE_LABELS)) {
    throw new Error("상생기금 유형을 다시 선택해 주세요.");
  }
  return fundType as PrismaCommunityFundType;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeDisplay(date?: Date | null) {
  return date ? date.toLocaleString("ko-KR") : "";
}

function formatKrw(value: number) {
  return `${numberFormatter.format(value)}원`;
}

function fundTypeLabel(fundType: PrismaCommunityFundType) {
  return COMMUNITY_FUND_TYPE_LABELS[fundType as CommunityFundType];
}

function toCommunityFundListItem(record: CommunityFundRecord): CommunityFundListItem {
  const fundType = record.fundType as CommunityFundType;
  return {
    id: record.id,
    groupId: record.groupId ?? "",
    groupName: record.group?.groupName ?? "월 기준",
    month: record.month,
    amount: record.amount,
    fundType,
    fundTypeLabel: fundTypeLabel(record.fundType),
    source: record.source,
    note: record.note ?? "",
    createdAt: formatDateTimeDisplay(record.createdAt),
  };
}

export function summarizeCommunityFunds(
  month: string,
  records: Pick<CommunityFundListItem, "amount" | "fundType">[],
): CommunityFundMonthlySummary {
  return {
    month,
    contributionAmount: records
      .filter((record) => record.fundType === "CONTRIBUTION")
      .reduce((sum, record) => sum + record.amount, 0),
    supportRecordAmount: records
      .filter((record) => record.fundType === "SUPPORT_RECORD")
      .reduce((sum, record) => sum + record.amount, 0),
    recordCount: records.length,
  };
}

async function findGroupForFund(tx: Prisma.TransactionClient, groupId: string | undefined) {
  if (!groupId) {
    return null;
  }
  const group = await tx.mobilityGroup.findFirst({
    where: {
      id: groupId,
      deletedAt: null,
    },
    select: {
      id: true,
      groupName: true,
      serviceDate: true,
    },
  });
  if (!group) {
    throw new Error("상생기금을 연결할 운행 그룹을 찾을 수 없습니다.");
  }
  return group;
}

export async function saveCommunityFundRecord(user: AuthUser, input: CommunityFundInput) {
  assertPermission(user, "settlement:write");

  return prisma.$transaction(async (tx) => {
    const recordId = optionalCleanText(input.id, 80);
    const groupId = optionalCleanText(input.groupId, 80);
    const group = await findGroupForFund(tx, groupId);
    const month =
      optionalCleanText(input.month, 7) ??
      (group ? formatDateOnly(group.serviceDate).slice(0, 7) : "");
    const parsedMonth = parseMonth(month);
    const fundType = parseFundType(input.fundType);
    const amount = parseRequiredPositiveInteger("상생기금 금액", input.amount);
    const source = requireText("출연처 또는 지원처", input.source, 80);
    const note = optionalCleanText(input.note, 300);
    assertNoForbiddenSensitiveInfo({
      "출연처 또는 지원처": source,
      "상생기금 메모": note,
    });

    const data = {
      groupId: group?.id ?? null,
      month: parsedMonth,
      amount,
      fundType,
      source,
      note: note ?? null,
    };

    const before = recordId
      ? await tx.communityFund.findUnique({
          where: {
            id: recordId,
          },
        })
      : null;
    if (recordId && !before) {
      throw new Error("수정할 상생기금 기록을 찾을 수 없습니다.");
    }

    const saved = before
      ? await tx.communityFund.update({
          where: {
            id: before.id,
          },
          data,
          include: {
            group: {
              select: {
                groupName: true,
                serviceDate: true,
              },
            },
          },
        })
      : await tx.communityFund.create({
          data,
          include: {
            group: {
              select: {
                groupName: true,
                serviceDate: true,
              },
            },
          },
        });

    await writeAuditLog(tx, {
      userId: user.id,
      action: before ? "UPDATE" : "CREATE",
      targetType: "CommunityFund",
      targetId: saved.id,
      beforeValue: before,
      afterValue: {
        id: saved.id,
        groupId: saved.groupId,
        groupName: saved.group?.groupName,
        month: saved.month,
        amount: saved.amount,
        amountLabel: formatKrw(saved.amount),
        fundType: saved.fundType,
        fundTypeLabel: fundTypeLabel(saved.fundType),
        source: saved.source,
        hasNote: Boolean(saved.note),
      },
      note: `${fundTypeLabel(saved.fundType)} ${formatKrw(saved.amount)} 기록`,
    });

    return toCommunityFundListItem(saved);
  });
}

export async function listCommunityFundRecords(filters: CommunityFundFilters = {}) {
  const month = optionalMonth(filters.month);
  const records = await prisma.communityFund.findMany({
    where: {
      month,
    },
    orderBy: [{ createdAt: "desc" }],
    take: 80,
    include: {
      group: {
        select: {
          groupName: true,
          serviceDate: true,
        },
      },
    },
  });
  const items = records.map(toCommunityFundListItem);
  return {
    month,
    records: items,
    summary: summarizeCommunityFunds(month, items),
  };
}

export async function getCommunityFundMonthlySummary(month = currentMonth()) {
  const normalizedMonth = parseMonth(month);
  const rows = await prisma.communityFund.findMany({
    where: {
      month: normalizedMonth,
    },
    select: {
      amount: true,
      fundType: true,
    },
  });
  return summarizeCommunityFunds(
    normalizedMonth,
    rows.map((row) => ({
      amount: row.amount,
      fundType: row.fundType as CommunityFundType,
    })),
  );
}

export async function listCommunityFundGroupOptions(): Promise<CommunityFundGroupOption[]> {
  const groups = await prisma.mobilityGroup.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: [{ serviceDate: "desc" }, { updatedAt: "desc" }],
    take: 80,
    select: {
      id: true,
      groupName: true,
      serviceDate: true,
      destinationSummary: true,
    },
  });

  return groups.map((group) => ({
    id: group.id,
    label: `${formatDateOnly(group.serviceDate)} · ${group.groupName} · ${group.destinationSummary}`,
    month: formatDateOnly(group.serviceDate).slice(0, 7),
  }));
}

export async function listReportCommunityFundRecords(month?: string) {
  const where: Prisma.CommunityFundWhereInput = {};
  if (month) {
    where.month = parseMonth(month);
  }
  return prisma.communityFund.findMany({
    where,
    select: {
      month: true,
      amount: true,
      fundType: true,
    },
  });
}

export const previewCommunityFundRecords: CommunityFundListItem[] = [
  {
    id: "preview-community-fund-1",
    groupId: "",
    groupName: "월 기준",
    month: "2026-06",
    amount: 30000,
    fundType: "CONTRIBUTION",
    fundTypeLabel: "조성액",
    source: "백천 상생기금",
    note: "월간 조성 시연 기록",
    createdAt: "2026. 6. 1. 오전 9:00:00",
  },
  {
    id: "preview-community-fund-2",
    groupId: "preview-settlement-group",
    groupName: "2026-06-03 오전 백천종합병원 이동",
    month: "2026-06",
    amount: 10000,
    fundType: "SUPPORT_RECORD",
    fundTypeLabel: "지원 기록",
    source: "백천 상생기금",
    note: "취약계층 이동 지원 시연 기록",
    createdAt: "2026. 6. 3. 오후 2:00:00",
  },
];

export const previewCommunityFundSummary = summarizeCommunityFunds(
  "2026-06",
  previewCommunityFundRecords,
);

export const previewCommunityFundGroupOptions: CommunityFundGroupOption[] = [
  {
    id: "preview-settlement-group",
    label: "2026-06-03 · 2026-06-03 오전 백천종합병원 이동 · 백천종합병원",
    month: "2026-06",
  },
];
