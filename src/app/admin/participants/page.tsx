import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { ParticipantManagementWorkspace } from "@/features/participants/participant-management-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewParticipantManagementView,
  getParticipantManagementView,
} from "@/server/participants/participant-management-service";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canRead =
    hasPermission(user, "resident:read") ||
    hasPermission(user, "linker:read") ||
    hasPermission(user, "user:manage");

  if (user && !canRead) {
    return (
      <AppShell currentHref="/admin/participants">
        <main className="page participant-page">
          <AccessDeniedPanel description="주민 및 동행링커 사용자현황은 운영 권한이 있는 관리자만 볼 수 있습니다." />
        </main>
      </AppShell>
    );
  }

  let view = createPreviewParticipantManagementView(user);
  let notice = user
    ? "미리보기 사용자현황 데이터가 표시됩니다."
    : "로그인 후 주민·동행링커 기본 정보, 비밀번호, 개인 공지를 관리할 수 있습니다.";

  if (user && canRead) {
    try {
      view = await getParticipantManagementView(user);
      notice = "";
    } catch {
      view = createPreviewParticipantManagementView(user);
      notice = "데이터베이스 연결 전 미리보기 사용자현황 데이터가 표시됩니다.";
    }
  }

  return (
    <AppShell currentHref="/admin/participants">
      <main className="page participant-page">
        <section className="page-heading" aria-labelledby="participant-management-title">
          <div>
            <p className="eyebrow">사용자현황</p>
            <h1 id="participant-management-title">주민과 동행링커 관리</h1>
            <p className="lead">
              기본 정보, 로그인 비밀번호, 활동내역, 개인 공지 발송 기록을 한 화면에서 확인하고
              관리합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="관련 화면">
            <a className="secondary-action" href="/admin/requests">
              주민 등록·신청
            </a>
            <a className="secondary-action" href="/admin/groups">
              공동예약 편성
            </a>
            <a className="secondary-action" href="/admin/trips">
              동행링커
            </a>
          </div>
        </section>
        <ParticipantManagementWorkspace notice={notice} view={view} />
      </main>
    </AppShell>
  );
}
