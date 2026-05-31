import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { EducationApplicationsAdminWorkspace } from "@/features/public-content/education-applications-admin-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listEducationApplicationsAdminView,
  previewEducationApplicationsAdminView,
} from "@/server/public/public-content-admin-service";

export const dynamic = "force-dynamic";

export default async function EducationApplicationsAdminPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "setting:manage") || hasPermission(user, "request:read");
  let view = {
    ...previewEducationApplicationsAdminView,
    canManageEducation: hasPermission(user, "setting:manage") || hasPermission(user, "request:write"),
  };
  let notice = user
    ? "미리보기 교육 신청 관리 데이터가 표시됩니다."
    : "로그인 후 교육 신청을 관리할 수 있습니다.";

  if (canRead && user) {
    try {
      view = await listEducationApplicationsAdminView(user);
      notice = "";
    } catch {
      notice = "데이터베이스 연결 전 미리보기 교육 신청 관리 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/education-applications">
      <main className="page public-admin-page">
        <section className="page-heading" aria-labelledby="education-applications-admin-title">
          <div>
            <p className="eyebrow">교육 신청 관리</p>
            <h1 id="education-applications-admin-title">참여자 교육 신청 관리</h1>
            <p className="lead">
              집체교육과 동행링커 민간자격과정 신청을 확인하고 접수, 확정, 이수 상태를 관리합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="교육 신청 관리 이동">
            <Link className="secondary-action" href="/public/education">
              교육 신청 화면
            </Link>
            <Link className="secondary-action" href="/admin/notices">
              공지사항 관리
            </Link>
          </div>
        </section>

        {user && !canRead ? (
          <AccessDeniedPanel description="교육 신청 관리 화면을 볼 권한이 없습니다. 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <EducationApplicationsAdminWorkspace notice={notice} view={view} />
        )}
      </main>
    </AppShell>
  );
}
