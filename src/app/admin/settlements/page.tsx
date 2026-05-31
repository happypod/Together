import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { SettlementWorkspace } from "@/features/settlements/settlement-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listCommunityFundGroupOptions,
  listCommunityFundRecords,
  previewCommunityFundGroupOptions,
  previewCommunityFundRecords,
  previewCommunityFundSummary,
  type CommunityFundGroupOption,
  type CommunityFundListItem,
  type CommunityFundMonthlySummary,
} from "@/server/funds/community-fund-service";
import {
  listMonthlySettlements,
  listSettlementGroups,
  previewMonthlySettlementTable,
  previewSettlementGroups,
  type MonthlySettlementTable,
  type SettlementListFilters,
  type SettlementListItem,
} from "@/server/settlements/settlement-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export const dynamic = "force-dynamic";

type SettlementsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: SettlementsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    query: firstValue(params.query) ?? "",
    serviceDate: firstValue(params.serviceDate) ?? "",
    settled: firstValue(params.settled) ?? "",
    fundMonth: firstValue(params.fundMonth) ?? "",
    settlementMonth: firstValue(params.settlementMonth) ?? "",
    monthlySettled: firstValue(params.monthlySettled) ?? "",
    receipt: firstValue(params.receipt) ?? "",
    tab: firstValue(params.tab) ?? "",
  } satisfies SettlementListFilters;
}

export default async function SettlementsPage({ searchParams }: SettlementsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "settlement:read");
  const canWrite = hasPermission(user, "settlement:write");
  const canPrepareCsv = hasPermission(user, "csv:export");
  let groups: SettlementListItem[] = previewSettlementGroups;
  let monthlySettlementTable: MonthlySettlementTable = previewMonthlySettlementTable;
  let communityFundRecords: CommunityFundListItem[] = previewCommunityFundRecords;
  let communityFundSummary: CommunityFundMonthlySummary = previewCommunityFundSummary;
  let communityFundGroupOptions: CommunityFundGroupOption[] = previewCommunityFundGroupOptions;
  let settings = DEFAULT_OPERATING_SETTINGS;
  let notice = user
    ? "미리보기 정산 데이터가 표시됩니다."
    : "로그인 후 실제 정산 정보를 저장할 수 있습니다.";

  if (canRead) {
    try {
      const [
        settlementGroups,
        operatingSettings,
        monthlySettlements,
        communityFunds,
        fundGroupOptions,
      ] =
        await Promise.all([
          listSettlementGroups(filters),
          getOperatingSettings(),
          listMonthlySettlements(filters),
          listCommunityFundRecords({ month: filters.fundMonth }),
          listCommunityFundGroupOptions(),
        ]);
      groups = settlementGroups;
      settings = operatingSettings;
      monthlySettlementTable = monthlySettlements;
      communityFundRecords = communityFunds.records;
      communityFundSummary = communityFunds.summary;
      communityFundGroupOptions = fundGroupOptions;
      notice = "";
    } catch {
      notice = "미리보기 정산 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/settlements">
      <main className="page settlement-page">
        <section className="page-heading" aria-labelledby="settlements-title">
          <div>
            <p className="eyebrow">정산</p>
            <h1 id="settlements-title">요금과 지원금 정산</h1>
            <p className="lead">
              주민 1/N 분담, 앵커 지원금, 영수증을 기록합니다.
              <br />
              정산 완료 후 수정은 사유를 남깁니다.
            </p>
          </div>
        </section>
        {user && !canRead ? (
          <AccessDeniedPanel description="이 역할은 정산 정보를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <SettlementWorkspace
            canPrepareCsv={canPrepareCsv}
            canWrite={canWrite}
            communityFundGroupOptions={communityFundGroupOptions}
            communityFundRecords={communityFundRecords}
            communityFundSummary={communityFundSummary}
            filters={filters}
            groups={groups}
            monthlySettlementTable={monthlySettlementTable}
            notice={notice}
            settings={settings}
          />
        )}
      </main>
    </AppShell>
  );
}
