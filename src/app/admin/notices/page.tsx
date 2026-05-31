import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { hasPermission } from "@/domain/auth/permissions";
import { NoticeAdminWorkspace } from "@/features/public-content/notice-admin-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  listNoticeAdminView,
  previewNoticeAdminView,
} from "@/server/public/public-content-admin-service";

export const dynamic = "force-dynamic";

export default async function NoticesAdminPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead = hasPermission(user, "setting:manage") || hasPermission(user, "request:read");
  let view = {
    ...previewNoticeAdminView,
    canManageNotices: hasPermission(user, "setting:manage"),
  };
  let notice = user
    ? "미리보기 공지사항 관리 데이터가 표시됩니다."
    : "로그인 후 공지사항을 관리할 수 있습니다.";

  if (canRead && user) {
    try {
      view = await listNoticeAdminView(user);
      notice = "";
    } catch {
      notice = "데이터베이스 연결 전 미리보기 공지사항 관리 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/notices">
      <main className="page public-admin-page">
        <section className="page-heading" aria-labelledby="notices-admin-title">
          <div>
            <p className="eyebrow">공지사항 관리</p>
            <h1 id="notices-admin-title">메인 공지사항 관리</h1>
            <p className="lead">
              공개 홈과 공지사항 화면에 노출되는 운영 공지, 안전 안내, 개인정보 안내를 관리합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="공지 관리 이동">
            <Link className="secondary-action" href="/public/notice">
              공지 화면
            </Link>
            <Link className="secondary-action" href="/admin/education-applications">
              교육 신청 관리
            </Link>
          </div>
        </section>

        {user && !canRead ? (
          <AccessDeniedPanel description="공지사항 관리 화면을 볼 권한이 없습니다. 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <NoticeAdminWorkspace notice={notice} view={view} />
        )}
      </main>
    </AppShell>
  );
}
