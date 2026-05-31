import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { TripOperationWorkspace } from "@/features/trip-operations/trip-operation-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listAssignableLinkerOptions,
  listLinkers,
  listTripGroups,
  previewLinkerOptions,
  previewLinkers,
  previewTripGroups,
  type LinkerListFilters,
  type LinkerListItem,
  type LinkerOption,
  type TripGroupFilters,
  type TripGroupListItem,
} from "@/server/trips/trip-operation-service";
import {
  listGroupSurveySummaries,
  previewSurveySummaries,
  type GroupSurveySummary,
} from "@/server/surveys/satisfaction-survey-service";

export const dynamic = "force-dynamic";

type TripsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: TripsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    linker: {
      query: firstValue(params.linkerQuery) ?? "",
      status: firstValue(params.linkerStatus) ?? "",
    },
    trip: {
      query: firstValue(params.query) ?? "",
      serviceDate: firstValue(params.serviceDate) ?? "",
      status: firstValue(params.status) ?? "",
    },
  } satisfies {
    linker: LinkerListFilters;
    trip: TripGroupFilters;
  };
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canReadLinkers = hasPermission(user, "linker:read");
  const canManageLinkers = hasPermission(user, "linker:write");
  const canAssignLinker = hasPermission(user, "group:write");
  const canTaxiWrite = hasPermission(user, "taxi:write");
  const canTripWrite = hasPermission(user, "trip:write");
  const canIncidentWrite = hasPermission(user, "incident:write");
  const canReadTrips =
    hasPermission(user, "trip:read") || hasPermission(user, "taxi:read") || canAssignLinker;

  let linkers: LinkerListItem[] = previewLinkers;
  let linkerOptions: LinkerOption[] = previewLinkerOptions;
  let groups: TripGroupListItem[] = previewTripGroups;
  let notice = user
    ? "미리보기 운행 데이터가 표시됩니다."
    : "로그인 후 실제 정보를 저장할 수 있습니다.";

  let surveySummaries: Record<string, GroupSurveySummary> = previewSurveySummaries;

  if (user && (canReadLinkers || canReadTrips)) {
    try {
      const [linkerItems, optionItems, groupItems] = await Promise.all([
        canReadLinkers ? listLinkers(filters.linker) : Promise.resolve([]),
        canReadLinkers ? listAssignableLinkerOptions() : Promise.resolve([]),
        canReadTrips ? listTripGroups(user, filters.trip) : Promise.resolve([]),
      ]);
      linkers = linkerItems;
      linkerOptions = optionItems;
      groups = groupItems;
      notice = "";
    } catch {
      notice = "미리보기 운행 데이터가 표시됩니다.";
    }

    try {
      surveySummaries = await listGroupSurveySummaries(groups.map((group) => group.id));
    } catch {
      surveySummaries = previewSurveySummaries;
    }
  }

  const canSubmitSurvey = canTripWrite;
  const canIssueMobileLink = hasPermission(user, "mobile-token:write");

  return (
    <AppShell currentHref="/admin/trips">
      <main className="page trip-page">
        <section className="page-heading" aria-labelledby="trips-title">
          <div>
            <p className="eyebrow">동행링커</p>
            <h1 id="trips-title">동행링커와 운행 확인</h1>
            <p className="lead">
              링커 배정, 택시 예약, 탑승을 처리합니다.
              <br />
              귀가확인은 큰 버튼으로 순서대로 진행합니다.
            </p>
          </div>
        </section>
        {user && !canReadLinkers && !canReadTrips ? (
          <AccessDeniedPanel description="이 역할은 동행링커와 운행 정보를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <TripOperationWorkspace
            canAssignLinker={canAssignLinker}
            canIncidentWrite={canIncidentWrite}
            canIssueMobileLink={canIssueMobileLink}
            canManageLinkers={canManageLinkers}
            canSubmitSurvey={canSubmitSurvey}
            canTaxiWrite={canTaxiWrite}
            canTripWrite={canTripWrite}
            filters={filters}
            groups={groups}
            linkerOptions={linkerOptions}
            linkers={linkers}
            notice={notice}
            surveySummaries={surveySummaries}
          />
        )}
      </main>
    </AppShell>
  );
}
