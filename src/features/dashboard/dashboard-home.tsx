import { AppShell } from "@/components/layout/app-shell";
import { type DashboardSummaryView } from "@/server/settlements/settlement-service";

type DashboardHomeProps = {
  summary: DashboardSummaryView;
  notice?: string;
  canManageUsers?: boolean;
};

export function DashboardHome({ canManageUsers = false, summary, notice }: DashboardHomeProps) {
  return (
    <AppShell>
      <main className="page">
        <section className="page-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="eyebrow">운영 대시보드</p>
            <h1 id="dashboard-title">오늘 접수와 이동 현황</h1>
            <p className="lead">
              운영 현황을 한 화면에서 점검합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="주요 작업">
            <a className="primary-action" href="/admin/participants">
              사용자현황
            </a>
            <a className="secondary-action" href="/admin/groups">
              공동예약
            </a>
            <a className="secondary-action" href="/admin/calendar">
              통합 캘린더
            </a>
            {canManageUsers ? (
              <a className="secondary-action" href="/admin/users">
                사용자 관리
              </a>
            ) : null}
          </div>
        </section>

        {notice ? (
          <p className="request-notice" role="status">
            {notice}
          </p>
        ) : null}

        <section className="kpi-grid" aria-label="핵심 현황">
          {summary.metrics.map((metric) => (
            <article className="kpi-card" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>{metric.detail}</span>
            </article>
          ))}
        </section>

        <div className="content-grid">
          <section className="operation-section" aria-labelledby="today-flow-title">
            <div className="section-header">
              <p className="eyebrow">오늘 처리 순서</p>
              <h2 id="today-flow-title">현장 운영 체크</h2>
            </div>
            <ol className="task-list">
              {summary.tasks.map((task) => (
                <li className="task-card" key={task.title}>
                  <span className={`task-state ${task.tone}`}>{task.state}</span>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="operation-section" aria-labelledby="settlement-title">
            <div className="section-header">
              <p className="eyebrow">정산 확인</p>
              <h2 id="settlement-title">이번 달 기준</h2>
            </div>
            <div className="settlement-list">
              {summary.settlementRows.map((row) => (
                <div className="settlement-row" key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                  <small>{row.note}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
