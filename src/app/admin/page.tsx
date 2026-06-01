import { DashboardHome } from "@/features/dashboard/dashboard-home";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import {
  buildCalendarWindow,
  listCalendarEvents,
  previewCalendarEvents,
  summarizeCalendarEvents,
  type CalendarEvent,
  type CalendarEventFilters,
} from "@/server/calendar/calendar-service";
import {
  getDashboardSummaryView,
  previewDashboardSummary,
} from "@/server/settlements/settlement-service";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function normalizeParams(searchParams?: AdminPageProps["searchParams"]) {
  const params = (await searchParams) ?? {};
  return {
    tab: firstValue(params.tab) === "calendar" ? "calendar" : "overview",
    calendarFilters: {
      view: firstValue(params.view) ?? "month",
      date: firstValue(params.date) ?? "",
      status: firstValue(params.status) ?? "",
    } satisfies CalendarEventFilters,
  };
}

function canReadCalendar(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return (
    hasPermission(user, "request:read") ||
    hasPermission(user, "group:read") ||
    hasPermission(user, "trip:read") ||
    hasPermission(user, "taxi:read") ||
    hasPermission(user, "setting:manage")
  );
}

function filterPreviewEvents(events: CalendarEvent[], window: ReturnType<typeof buildCalendarWindow>) {
  return events.filter((event) => event.date >= window.gridStart && event.date < window.gridEnd);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { calendarFilters, tab } = await normalizeParams(searchParams);
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
  const hasCalendarAccess = canReadCalendar(user);
  if (tab === "overview" && canReadDashboard) {
    try {
      summary = await getDashboardSummaryView();
      notice = "";
    } catch {
      notice = "미리보기 대시보드 데이터가 표시됩니다.";
    }
  }

  if (user && tab === "overview" && !canReadDashboard) {
    return (
      <AppShell>
        <main className="page">
          <AccessDeniedPanel description="이 역할은 운영 대시보드를 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  if (user && tab === "calendar" && !hasCalendarAccess) {
    return (
      <AppShell currentHref="/admin">
        <main className="page">
          <AccessDeniedPanel description="접속할 수 있는 통합 운영 캘린더 권한이 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  if (tab === "calendar") {
    const calendarWindow = buildCalendarWindow(calendarFilters);
    let events = filterPreviewEvents(previewCalendarEvents, calendarWindow);
    let calendarNotice = user
      ? "미리보기 통합 캘린더 데이터가 표시됩니다."
      : "로그인 후 실제 공동예약과 교육 일정을 볼 수 있습니다.";

    if (hasCalendarAccess) {
      try {
        events = await listCalendarEvents(user, calendarFilters);
        calendarNotice = "";
      } catch {
        events = filterPreviewEvents(previewCalendarEvents, calendarWindow);
        calendarNotice = "미리보기 통합 캘린더 데이터가 표시됩니다.";
      }
    }

    const calendarSummary = summarizeCalendarEvents(
      events.filter(
        (event) => event.date >= calendarWindow.periodStart && event.date < calendarWindow.periodEnd,
      ),
    );

    return (
      <DashboardHome
        activeTab="calendar"
        calendar={{
          events,
          notice: calendarNotice,
          status: calendarFilters.status,
          summary: calendarSummary,
          window: calendarWindow,
        }}
        notice={notice}
        summary={summary}
      />
    );
  }

  return <DashboardHome activeTab="overview" notice={notice} summary={summary} />;
}
