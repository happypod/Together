import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { canUseProtectedAction } from "@/domain/auth/rbac-policy";
import { MouRecordWorkspace } from "@/features/mous/mou-record-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewMouRecordView,
  listMouRecords,
  type MouRecordFilters,
  type MouRecordView,
} from "@/server/mous/mou-record-service";

export const dynamic = "force-dynamic";

type MouRecordsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: MouRecordsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    month: firstValue(params.month) ?? "",
    status: firstValue(params.status) ?? "",
  } satisfies MouRecordFilters;
}

export default async function MouRecordsPage({ searchParams }: MouRecordsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "report:read");
  const canWrite = canUseProtectedAction(user, "createMouRecord");
  let view: MouRecordView = createPreviewMouRecordView(filters, {
    viewerLimited: user?.role === "VIEWER",
  });
  let notice = user
    ? "미리보기 MOU 데이터가 표시됩니다."
    : "로그인 후 실제 MOU 기록을 저장할 수 있습니다.";

  if (canRead && user) {
    try {
      view = await listMouRecords(user, filters);
      notice = "";
    } catch {
      view = createPreviewMouRecordView(filters, {
        viewerLimited: user.role === "VIEWER",
      });
      notice = "미리보기 MOU 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page mou-record-page">
        <section className="page-heading" aria-labelledby="mou-record-title">
          <div>
            <p className="eyebrow">MOU</p>
            <h1 id="mou-record-title">MOU 관리</h1>
            <p className="lead">
              협력기관 MOU 체결일과 상태를 기록하고 월간 운영리포트에 체결 건수로 반영합니다.
              <br />
              VIEWER는 문서 링크와 내부 세부 범위를 볼 수 없습니다.
            </p>
          </div>
        </section>

        {user && !canRead ? (
          <AccessDeniedPanel description="MOU 현황을 볼 수 없습니다. 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <MouRecordWorkspace canWrite={canWrite} notice={notice} view={view} />
        )}
      </main>
    </AppShell>
  );
}
