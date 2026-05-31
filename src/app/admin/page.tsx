import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import {
  getDashboardSummaryView,
  previewDashboardSummary,
} from "@/server/settlements/settlement-service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  let summary = previewDashboardSummary;
  let notice = user
    ? "미리보기 대시보드 데이터가 표시됩니다."
    : "로그인 후 실제 운영 현황을 볼 수 있습니다.";

  const canReadDashboard = hasPermission(user, "dashboard:read");
  const canManageUsers = hasPermission(user, "user:manage");
  if (canReadDashboard) {
    try {
      summary = await getDashboardSummaryView();
      notice = "";
    } catch {
      notice = "미리보기 대시보드 데이터가 표시됩니다.";
    }
  }

  if (user && !canReadDashboard) {
    return (
      <AppShell>
        <main className="page">
          <AccessDeniedPanel description="이 역할은 운영 대시보드를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  return <DashboardHome canManageUsers={canManageUsers} notice={notice} summary={summary} />;
}
