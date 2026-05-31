import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { MobilityCalendarWorkspace } from "@/features/mobility-calendar/mobility-calendar-workspace";
import { getCurrentUser } from "@/server/auth/session";
import {
  buildCalendarWindow,
  listCalendarEvents,
  previewCalendarEvents,
  summarizeCalendarEvents,
  type CalendarEvent,
  type CalendarEventFilters,
} from "@/server/calendar/calendar-service";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeFilters(searchParams?: CalendarPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    view: firstValue(params.view) ?? "month",
    date: firstValue(params.date) ?? "",
    status: firstValue(params.status) ?? "",
  } satisfies CalendarEventFilters;
}

function filterPreviewEvents(events: CalendarEvent[], window: ReturnType<typeof buildCalendarWindow>) {
  return events.filter((event) => event.date >= window.gridStart && event.date < window.gridEnd);
}

export default async function MobilityCalendarPage({ searchParams }: CalendarPageProps) {
  const filters = await normalizeFilters(searchParams);
  const window = buildCalendarWindow(filters);
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const canReadCalendar =
    hasPermission(user, "request:read") ||
    hasPermission(user, "group:read") ||
    hasPermission(user, "trip:read") ||
    hasPermission(user, "taxi:read");

  let events = filterPreviewEvents(previewCalendarEvents, window);
  let notice = user
    ? "미리보기 이동 캘린더 데이터가 표시됩니다."
    : "로그인 후 실제 이동 일정을 볼 수 있습니다.";

  if (canReadCalendar) {
    try {
      events = await listCalendarEvents(user, filters);
      notice = "";
    } catch {
      events = filterPreviewEvents(previewCalendarEvents, window);
      notice = "미리보기 이동 캘린더 데이터가 표시됩니다.";
    }
  }

  const summary = summarizeCalendarEvents(
    events.filter((event) => event.date >= window.periodStart && event.date < window.periodEnd),
  );

  return (
    <AppShell currentHref="/admin/calendar">
      <main className="page calendar-page">
        <section className="page-heading" aria-labelledby="calendar-title">
          <div>
            <p className="eyebrow">이동 캘린더</p>
            <h1 id="calendar-title">월간·주간·일간 이동 일정</h1>
            <p className="lead">
              신청, 그룹, 택시예약 상태를 날짜별로 확인합니다.
              <br />
              모바일에서는 일정 목록 중심으로 표시합니다.
            </p>
          </div>
        </section>

        {user && !canReadCalendar ? (
          <AccessDeniedPanel description="이 역할은 이동 캘린더를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        ) : (
          <MobilityCalendarWorkspace
            events={events}
            notice={notice}
            status={filters.status}
            summary={summary}
            window={window}
          />
        )}
      </main>
    </AppShell>
  );
}
