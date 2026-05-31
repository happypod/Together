import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { MobilityGroupWorkspace } from "@/features/mobility-groups/mobility-group-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listGroupCandidateRequests,
  listMobilityGroups,
  previewGroupCandidates,
  previewGroups,
  type GroupCandidateRequest,
  type MobilityGroupListFilters,
  type MobilityGroupListItem,
} from "@/server/groups/mobility-group-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export const dynamic = "force-dynamic";

type GroupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: GroupsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    query: firstValue(params.query) ?? "",
    serviceDate: firstValue(params.serviceDate) ?? "",
    status: firstValue(params.status) ?? "",
  } satisfies MobilityGroupListFilters;
}

export default async function MobilityGroupsPage({ searchParams }: GroupsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "group:read");
  const canWrite = hasPermission(user, "group:write");
  let settings = DEFAULT_OPERATING_SETTINGS;
  let candidates: GroupCandidateRequest[] = previewGroupCandidates;
  let groups: MobilityGroupListItem[] = previewGroups;
  let notice = user
    ? "미리보기 공동예약 데이터가 표시됩니다."
    : "로그인 후 실제 그룹을 저장할 수 있습니다.";

  if (canRead) {
    try {
      const [operatingSettings, candidateItems, groupItems] = await Promise.all([
        getOperatingSettings(),
        listGroupCandidateRequests(),
        listMobilityGroups(filters),
      ]);
      settings = operatingSettings;
      candidates = candidateItems;
      groups = groupItems;
      notice = "";
    } catch {
      notice = "미리보기 공동예약 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/groups">
      <main className="page group-page">
        <section className="page-heading" aria-labelledby="groups-title">
          <div>
            <p className="eyebrow">공동예약</p>
            <h1 id="groups-title">그룹 편성과 픽업 순서</h1>
            <p className="lead">
              신청을 최대 {settings.maxGroupResidents}명까지 묶습니다.
              <br />
              운영자가 직접 판단합니다.
            </p>
          </div>
        </section>
        {user && !canRead ? (
          <AccessDeniedPanel description="이 역할은 공동예약 그룹 정보를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <MobilityGroupWorkspace
            canWrite={canWrite}
            candidates={candidates}
            filters={filters}
            groups={groups}
            notice={notice}
            settings={settings}
          />
        )}
      </main>
    </AppShell>
  );
}
