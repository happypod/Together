import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { canUseProtectedAction } from "@/domain/auth/rbac-policy";
import { JobConsultationWorkspace } from "@/features/jobs/job-consultation-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewJobConsultationView,
  listJobConsultations,
  type JobConsultationFilters,
  type JobConsultationView,
} from "@/server/jobs/job-consultation-service";

export const dynamic = "force-dynamic";

type JobConsultationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: JobConsultationsPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    month: firstValue(params.month) ?? "",
    status: firstValue(params.status) ?? "",
    targetType: firstValue(params.targetType) ?? "",
  } satisfies JobConsultationFilters;
}

export default async function JobConsultationsPage({ searchParams }: JobConsultationsPageProps) {
  const filters = await normalizeFilters(searchParams);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "report:read");
  const canWrite = canUseProtectedAction(user, "createJobConsultation");
  let view: JobConsultationView = createPreviewJobConsultationView(filters);
  let notice = user
    ? "미리보기 취업연계 상담 데이터가 표시됩니다."
    : "로그인 후 실제 취업연계 상담 기록을 저장할 수 있습니다.";

  if (canRead && user) {
    try {
      view = await listJobConsultations(user, filters);
      notice = "";
    } catch {
      view = createPreviewJobConsultationView(filters);
      notice = "미리보기 취업연계 상담 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page job-consultation-page">
        <section className="page-heading" aria-labelledby="job-consultation-title">
          <div>
            <p className="eyebrow">취업연계</p>
            <h1 id="job-consultation-title">취업연계 상담관리</h1>
            <p className="lead">
              동행링커와 주민의 취업연계 진행 상태를 기록하고 월간 운영리포트에 건수로 반영합니다.
              <br />
              전화번호와 민감 세부 기록은 화면에 표시하지 않습니다.
            </p>
          </div>
        </section>

        {user && !canRead ? (
          <AccessDeniedPanel description="취업연계 상담 현황을 볼 수 없습니다. 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <JobConsultationWorkspace canWrite={canWrite} notice={notice} view={view} />
        )}
      </main>
    </AppShell>
  );
}
