import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { ResidentRequestWorkspace } from "@/features/resident-requests/resident-request-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listMobilityRequests,
  listResidentOptions,
  type ResidentOption,
  type ResidentRequestListFilters,
  type ResidentRequestListItem,
} from "@/server/residents/resident-request-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import { getOperatingSettings } from "@/server/settings/settings-service";

export const dynamic = "force-dynamic";

type RequestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: RequestsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    query: firstValue(params.query) ?? "",
    villageName: firstValue(params.villageName) ?? "",
    desiredDate: firstValue(params.desiredDate) ?? "",
    purpose: firstValue(params.purpose) ?? "",
    status: firstValue(params.status) ?? "",
  } satisfies ResidentRequestListFilters;
}

const previewRequests: ResidentRequestListItem[] = [
  {
    id: "preview-request",
    residentId: "preview-resident",
    residentName: "홍길순",
    villageName: "백천마을",
    phoneMasked: "010-****-5678",
    guardianPhoneMasked: "010-****-3333",
    desiredDate: "2026-06-03",
    desiredTimeWindow: "오전",
    purpose: "HOSPITAL",
    purposeLabel: "병원",
    origin: "백천마을 회관",
    destination: "백천종합병원",
    status: "REQUESTED",
    statusLabel: "신청접수",
    needsCompanion: true,
    privacyReady: true,
    createdAt: "2026-05-30T00:00:00.000Z",
  },
];

export default async function ResidentRequestsPage({ searchParams }: RequestsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  const canRead = hasPermission(user, "request:read");
  const canWrite = hasPermission(user, "request:write");
  const canIssueMobileLink = hasPermission(user, "mobile-token:write");
  let settings = DEFAULT_OPERATING_SETTINGS;
  let residents: ResidentOption[] = [];
  let requests = previewRequests;
  let notice = user
    ? "미리보기 데이터가 표시됩니다."
    : "권한이 있으면 실제 신청을 저장할 수 있습니다.";

  if (canRead) {
    try {
      const [operatingSettings, residentOptions, requestItems] = await Promise.all([
        getOperatingSettings(),
        listResidentOptions(),
        listMobilityRequests(filters),
      ]);
      settings = operatingSettings;
      residents = residentOptions;
      requests = requestItems;
      notice = "";
    } catch {
      notice = "데이터베이스 연결 전 미리보기 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/participants">
      <main className="page request-page">
        <section className="page-heading" aria-labelledby="requests-title">
          <div>
            <p className="eyebrow">주민 신청</p>
            <h1 id="requests-title">주민 등록과 이동 신청</h1>
            <p className="lead">
              관리자가 직접 주민 정보와 이동 신청을 입력합니다.
              <br />
              민감정보는 입력하지 않습니다.
            </p>
          </div>
        </section>
        {user && !canRead ? (
          <AccessDeniedPanel description="이 역할은 주민 신청 정보를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <ResidentRequestWorkspace
            canIssueMobileLink={canIssueMobileLink}
            canWrite={canWrite}
            filters={filters}
            notice={notice}
            requests={requests}
            residents={residents}
            settings={settings}
          />
        )}
      </main>
    </AppShell>
  );
}
