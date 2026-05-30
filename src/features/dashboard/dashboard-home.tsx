import { AppShell } from "@/components/layout/app-shell";
import { dashboardMetrics, settlementRows, todayTasks } from "@/lib/dashboard-data";

export function DashboardHome() {
  return (
    <AppShell>
      <main className="page">
        <section className="page-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="eyebrow">운영 대시보드</p>
            <h1 id="dashboard-title">오늘 접수와 이동 현황</h1>
            <p className="lead">
              주민 신청, 공동예약, 동행링커 배정, 귀가 확인을 한 화면에서 점검합니다.
            </p>
          </div>
          <div className="heading-actions" aria-label="주요 작업">
            <button className="primary-action" type="button">
              주민 등록
            </button>
            <button className="secondary-action" type="button">
              공동예약
            </button>
          </div>
        </section>

        <section className="kpi-grid" aria-label="핵심 현황">
          {dashboardMetrics.map((metric) => (
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
              {todayTasks.map((task) => (
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
              {settlementRows.map((row) => (
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
