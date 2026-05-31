import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { PublicContentAdminWorkspace } from "@/features/public-content/public-content-admin-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listPublicContentAdminView,
  previewPublicContentAdminView,
} from "@/server/public/public-content-admin-service";

export const dynamic = "force-dynamic";

export default async function PublicContentAdminPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "setting:manage") || hasPermission(user, "request:read");
  let view = {
    ...previewPublicContentAdminView,
    canManageNotices: hasPermission(user, "setting:manage"),
    canManageEducation: hasPermission(user, "setting:manage") || hasPermission(user, "request:write"),
  };
  let notice = user
    ? "미리보기 공개 홈 관리 데이터가 표시됩니다."
    : "로그인 후 공지사항과 교육 신청을 관리할 수 있습니다.";

  if (canRead && user) {
    try {
      view = await listPublicContentAdminView(user);
      notice = "";
    } catch {
      notice = "데이터베이스 연결 전 미리보기 공개 홈 관리 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/public-content">
      <main className="page public-admin-page">
        <section className="page-heading" aria-labelledby="public-content-title">
          <div>
            <p className="eyebrow">공개 홈 관리</p>
            <h1 id="public-content-title">공지사항과 교육 신청 관리</h1>
            <p className="lead">
              메인 화면에 노출되는 공지사항을 관리하고 참여자 교육 신청 접수 상태를 확인합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="공개 화면 바로가기">
            <Link className="secondary-action" href="/public/notice">
              공지 화면
            </Link>
            <Link className="secondary-action" href="/public/education">
              교육 신청 화면
            </Link>
          </div>
        </section>

        {user && !canRead ? (
          <AccessDeniedPanel description="공지사항과 교육 신청 관리 화면을 볼 권한이 없습니다. 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <PublicContentAdminWorkspace notice={notice} view={view} />
        )}
      </main>
    </AppShell>
  );
}
