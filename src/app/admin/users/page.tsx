import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewUserManagementView,
  getUserManagementView,
} from "@/server/users/user-management-service";
import { UserManagementWorkspace } from "@/features/users/user-management-workspace";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user && !hasPermission(user, "user:manage")) {
    return (
      <AppShell currentHref="/admin/users">
        <main className="page user-management-page">
          <AccessDeniedPanel description="사용자 관리는 운영 책임자 이상만 볼 수 있습니다. 필요한 경우 최고 관리자에게 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  let view = createPreviewUserManagementView(user);
  let notice = user
    ? "미리보기 사용자 관리 데이터가 표시됩니다."
    : "로그인 후 사용자 생성, 역할 변경, 비활성화를 실행할 수 있습니다.";

  if (user && hasPermission(user, "user:manage")) {
    try {
      view = await getUserManagementView(user);
      notice = "";
    } catch {
      view = createPreviewUserManagementView(user);
      notice = "미리보기 사용자 관리 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/users">
      <main className="page user-management-page">
        <section className="page-heading" aria-labelledby="user-management-title">
          <div>
            <p className="eyebrow">사용자 관리</p>
            <h1 id="user-management-title">역할과 접근 상태 관리</h1>
            <p className="lead">
              운영자 초대, 역할 변경, 계정 비활성화와 최근 로그인 기록을 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="관련 화면">
            <a className="secondary-action" href="/admin">
              대시보드
            </a>
            <a className="secondary-action" href="/admin/reports">
              리포트
            </a>
          </div>
        </section>
        <UserManagementWorkspace notice={notice} view={view} />
      </main>
    </AppShell>
  );
}
