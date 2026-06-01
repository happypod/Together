import Link from "next/link";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
} from "@/domain/definitions";
import {
  CALENDAR_VIEWS,
  type CalendarEvent,
  type CalendarSummary,
  type CalendarView,
  type CalendarWindow,
} from "@/server/calendar/calendar-service";

type MobilityCalendarWorkspaceProps = {
  events: CalendarEvent[];
  summary: CalendarSummary;
  window: CalendarWindow;
  status?: string;
  notice?: string;
};

const viewLabels: Record<CalendarView, string> = {
  month: "월간",
  week: "주간",
  day: "일간",
};

const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

const dayTitleFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

function addDays(key: string, days: number) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function listDays(start: string, endExclusive: string) {
  const days: string[] = [];
  for (let day = start; day < endExclusive; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

function dayLabel(day: string) {
  return dayTitleFormatter.format(new Date(`${day}T00:00:00.000Z`));
}

function dayNumber(day: string) {
  return Number(day.slice(8, 10));
}

function buildHref(view: CalendarView, date: string, status?: string) {
  const params = new URLSearchParams({ tab: "calendar", view, date });
  if (status) {
    params.set("status", status);
  }
  return `/admin?${params.toString()}`;
}

function isInPeriod(day: string, window: CalendarWindow) {
  return day >= window.periodStart && day < window.periodEnd;
}

function groupEventsByDate(events: CalendarEvent[]) {
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = byDate.get(event.date) ?? [];
    list.push(event);
    byDate.set(event.date, list);
  }
  return byDate;
}

function filterPeriodEvents(events: CalendarEvent[], window: CalendarWindow) {
  return events.filter((event) => isInPeriod(event.date, window));
}

function EventCard({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const kindLabel =
    event.kind === "education" ? "교육" : event.kind === "request" ? "신청" : "공동예약";

  return (
    <Link className={compact ? "calendar-event-chip" : "calendar-event-card"} href={event.href}>
      <span className="calendar-event-topline">
        <span className="calendar-event-kind">{kindLabel}</span>
        <mark className="status-badge" data-status={event.status}>
          {event.statusLabel}
        </mark>
      </span>
      <strong>{event.title}</strong>
      {!compact ? (
        <>
          <span>{event.subtitle}</span>
          {event.kind === "education" ? (
            <>
              <span>
                {event.timeWindow} · {event.residentSummary}
              </span>
              <span>{event.taxiLabel}</span>
            </>
          ) : (
            <>
              <span>
                {event.timeWindow} · {event.residentSummary} · {event.memberCount}명
              </span>
              <span>
                {event.linkerName} · {event.taxiLabel}
              </span>
            </>
          )}
        </>
      ) : (
        <span>
          {event.timeWindow} · {event.taxiLabel}
        </span>
      )}
    </Link>
  );
}

export function MobilityCalendarWorkspace({
  events,
  summary,
  window,
  status = "",
  notice,
}: MobilityCalendarWorkspaceProps) {
  const gridDays = listDays(window.gridStart, window.gridEnd);
  const periodDays = listDays(window.periodStart, window.periodEnd);
  const byDate = groupEventsByDate(events);
  const periodEvents = filterPeriodEvents(events, window);

  return (
    <div className="calendar-workspace">
      {notice ? (
        <p className="request-notice" role="status">
          {notice}
        </p>
      ) : null}

      <section className="calendar-toolbar" aria-label="캘린더 보기 설정">
        <div className="calendar-view-switch" role="list" aria-label="보기 전환">
          {CALENDAR_VIEWS.map((view) => (
            <Link
              aria-current={window.view === view ? "page" : undefined}
              className="calendar-view-link"
              href={buildHref(view, window.anchorDate, status)}
              key={view}
              role="listitem"
            >
              {viewLabels[view]}
            </Link>
          ))}
        </div>
        <div className="calendar-period-control">
          <Link className="secondary-action" href={buildHref(window.view, window.previousDate, status)}>
            이전
          </Link>
          <strong>{window.title}</strong>
          <Link className="secondary-action" href={buildHref(window.view, window.nextDate, status)}>
            다음
          </Link>
          <Link className="secondary-action" href={buildHref(window.view, window.todayDate, status)}>
            오늘
          </Link>
        </div>
        <form action="/admin" className="calendar-filter-form">
          <input name="tab" type="hidden" value="calendar" />
          <input name="view" type="hidden" value={window.view} />
          <input name="date" type="hidden" value={window.anchorDate} />
          <label>
            이동 상태 필터
            <select defaultValue={status} name="status">
              <option value="">전체 상태</option>
              {MOBILITY_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {MOBILITY_STATUS_LABELS[item]}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-action" type="submit">
            필터 적용
          </button>
        </form>
      </section>

      <section className="calendar-summary-grid" aria-label="캘린더 요약">
        <div>
          <span>미그룹 신청</span>
          <strong>{summary.requestCount}건</strong>
        </div>
        <div>
          <span>운행 그룹</span>
          <strong>{summary.groupCount}그룹</strong>
        </div>
        <div>
          <span>교육 일정</span>
          <strong>{summary.educationCount}건</strong>
        </div>
        <div>
          <span>택시 확인 필요</span>
          <strong>{summary.taxiPendingCount}건</strong>
        </div>
        <div>
          <span>링커 미배정</span>
          <strong>{summary.linkerPendingCount}건</strong>
        </div>
      </section>

      <section className="calendar-grid-panel" aria-label={`${viewLabels[window.view]} 캘린더`}>
        {window.view !== "day" ? (
          <div className="calendar-weekdays" aria-hidden="true">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
        ) : null}
        <div className={`calendar-grid calendar-grid-${window.view}`}>
          {gridDays.map((day) => {
            const dayEvents = byDate.get(day) ?? [];
            const visibleEvents = dayEvents.slice(0, window.view === "month" ? 3 : 6);
            const hiddenCount = dayEvents.length - visibleEvents.length;

            return (
              <article
                className={isInPeriod(day, window) ? "calendar-day-cell" : "calendar-day-cell outside-period"}
                key={day}
              >
                <div className="calendar-day-head">
                  <span>{window.view === "month" ? dayNumber(day) : dayLabel(day)}</span>
                  {day === window.todayDate ? <mark>오늘</mark> : null}
                </div>
                <div className="calendar-day-events">
                  {visibleEvents.map((event) => (
                    <EventCard compact event={event} key={`${event.kind}-${event.id}`} />
                  ))}
                  {hiddenCount > 0 ? (
                    <span className="calendar-more">+{hiddenCount}개 더 있음</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="calendar-agenda" aria-label="모바일 일정 목록">
        <div className="section-header">
          <p className="eyebrow">일정 목록</p>
          <h2>{viewLabels[window.view]} 이동 일정</h2>
        </div>
        {periodEvents.length === 0 ? (
          <p className="request-empty">선택한 기간에 표시할 일정이 없습니다.</p>
        ) : (
          <div className="calendar-agenda-list">
            {periodDays.map((day) => {
              const dayEvents = byDate.get(day)?.filter((event) => isInPeriod(event.date, window)) ?? [];
              if (dayEvents.length === 0) {
                return null;
              }
              return (
                <section className="calendar-agenda-day" key={day}>
                  <h3>
                    <FaIcon name="calendar" /> {dayLabel(day)}
                  </h3>
                  <div className="calendar-agenda-events">
                    {dayEvents.map((event) => (
                      <EventCard event={event} key={`${event.kind}-${event.id}`} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
