import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { FaIcon } from "@/components/ui/fa-icon";
import { MobilityCalendarWorkspace } from "@/features/mobility-calendar/mobility-calendar-workspace";
import {
  type CalendarEvent,
  type CalendarSummary,
  type CalendarWindow,
} from "@/server/calendar/calendar-service";
import { type DashboardSummaryView } from "@/server/settlements/settlement-service";

export type DashboardTab = "overview" | "calendar";

type DashboardCalendarView = {
  events: CalendarEvent[];
  summary: CalendarSummary;
  window: CalendarWindow;
  status?: string;
  notice?: string;
};

type DashboardHomeProps = {
  summary: DashboardSummaryView;
  notice?: string;
  activeTab?: DashboardTab;
  calendar?: DashboardCalendarView;
};

const dashboardTabs: {
  id: DashboardTab;
  href: string;
  icon: "dashboard" | "calendar";
  label: string;
}[] = [
  { id: "overview", href: "/admin", icon: "dashboard", label: "운영 현황" },
  { id: "calendar", href: "/admin?tab=calendar", icon: "calendar", label: "통합 캘린더" },
];

export function DashboardHome({
  activeTab = "overview",
  calendar,
  summary,
  notice,
}: DashboardHomeProps) {
  return (
    <AppShell currentHref="/admin">
      <main className="page">
        <section className="page-heading" aria-labelledby="dashboard-title">
          <div>
            <p className="eyebrow">운영 대시보드</p>
            <h1 id="dashboard-title">운영 대시보드</h1>
            <p className="lead">
              오늘 현황과 통합 캘린더를 한 화면에서 점검합니다.
            </p>
          </div>
        </section>

        <nav className="tablist dashboard-tabs" role="tablist" aria-label="대시보드 보기">
          {dashboardTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Link
                aria-current={selected ? "page" : undefined}
                aria-selected={selected ? "true" : "false"}
                className="tab-trigger dashboard-tab-trigger"
                href={tab.href}
                key={tab.id}
                prefetch
                role="tab"
              >
                <span aria-hidden="true" className="tab-icon">
                  <FaIcon name={tab.icon} />
                </span>
                <span className="tab-label">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {activeTab === "calendar" ? (
          <section className="tabpanel dashboard-tabpanel" role="tabpanel" tabIndex={0}>
            {calendar ? (
              <MobilityCalendarWorkspace
                events={calendar.events}
                notice={calendar.notice}
                status={calendar.status}
                summary={calendar.summary}
                window={calendar.window}
              />
            ) : (
              <p className="request-notice" role="status">
                캘린더 데이터를 불러올 수 없습니다.
              </p>
            )}
          </section>
        ) : (
          <section className="tabpanel dashboard-tabpanel" role="tabpanel" tabIndex={0}>
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
          </section>
        )}
      </main>
    </AppShell>
  );
}
