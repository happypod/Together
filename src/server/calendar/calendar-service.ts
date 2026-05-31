import {
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
  type MobilityStatus,
} from "@/domain/definitions";
import {
  AuthorizationError,
  hasPermission,
  type AuthUser,
} from "@/domain/auth/permissions";
import { maskPhone } from "@/domain/privacy";
import { prisma } from "@/server/db/prisma";

export const CALENDAR_VIEWS = ["month", "week", "day"] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export type CalendarEventKind = "request" | "group";

export type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  date: string;
  title: string;
  subtitle: string;
  timeWindow: string;
  status: MobilityStatus;
  statusLabel: string;
  href: string;
  memberCount: number;
  residentSummary: string;
  linkerName: string;
  taxiState: "none" | "requested" | "confirmed";
  taxiLabel: string;
};

export type CalendarEventFilters = {
  view?: string;
  date?: string;
  status?: string;
};

export type CalendarWindow = {
  view: CalendarView;
  anchorDate: string;
  periodStart: string;
  periodEnd: string;
  gridStart: string;
  gridEnd: string;
  previousDate: string;
  nextDate: string;
  todayDate: string;
  title: string;
};

export type CalendarSummary = {
  requestCount: number;
  groupCount: number;
  taxiPendingCount: number;
  linkerPendingCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

const monthTitleFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
});

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function parseDateOnly(value: unknown, fallback = new Date()) {
  const text = cleanText(value, 10);
  const safeText = /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : formatDateOnly(fallback);
  const date = new Date(`${safeText}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return parseDateOnly(undefined, fallback);
  }

  return date;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  return next;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayOffset);
}

function formatRangeTitle(start: Date, endExclusive: Date) {
  const end = addDays(endExclusive, -1);
  return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
}

function normalizeView(value: unknown): CalendarView {
  return CALENDAR_VIEWS.includes(value as CalendarView) ? (value as CalendarView) : "month";
}

function normalizeStatus(value: unknown) {
  const status = cleanText(value, 40);
  return MOBILITY_STATUSES.includes(status as MobilityStatus) ? (status as MobilityStatus) : undefined;
}

export function buildCalendarWindow(filters: CalendarEventFilters = {}): CalendarWindow {
  const view = normalizeView(filters.view);
  const todayDate = formatDateOnly(new Date());
  const anchor = parseDateOnly(filters.date);

  if (view === "day") {
    const end = addDays(anchor, 1);
    return {
      view,
      anchorDate: formatDateOnly(anchor),
      periodStart: formatDateOnly(anchor),
      periodEnd: formatDateOnly(end),
      gridStart: formatDateOnly(anchor),
      gridEnd: formatDateOnly(end),
      previousDate: formatDateOnly(addDays(anchor, -1)),
      nextDate: formatDateOnly(addDays(anchor, 1)),
      todayDate,
      title: dateFormatter.format(anchor),
    };
  }

  if (view === "week") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 7);
    return {
      view,
      anchorDate: formatDateOnly(anchor),
      periodStart: formatDateOnly(start),
      periodEnd: formatDateOnly(end),
      gridStart: formatDateOnly(start),
      gridEnd: formatDateOnly(end),
      previousDate: formatDateOnly(addDays(start, -7)),
      nextDate: formatDateOnly(addDays(start, 7)),
      todayDate,
      title: formatRangeTitle(start, end),
    };
  }

  const monthStart = startOfMonth(anchor);
  const nextMonthStart = addMonths(monthStart, 1);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(addDays(nextMonthStart, 6)), 7);

  return {
    view,
    anchorDate: formatDateOnly(anchor),
    periodStart: formatDateOnly(monthStart),
    periodEnd: formatDateOnly(nextMonthStart),
    gridStart: formatDateOnly(gridStart),
    gridEnd: formatDateOnly(gridEnd),
    previousDate: formatDateOnly(addMonths(monthStart, -1)),
    nextDate: formatDateOnly(addMonths(monthStart, 1)),
    todayDate,
    title: monthTitleFormatter.format(monthStart),
  };
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

function toTaxiState(taxiReservation: { reservationConfirmed: boolean } | null) {
  if (!taxiReservation) {
    return { taxiState: "none" as const, taxiLabel: "택시 미요청" };
  }
  if (taxiReservation.reservationConfirmed) {
    return { taxiState: "confirmed" as const, taxiLabel: "택시 확정" };
  }
  return { taxiState: "requested" as const, taxiLabel: "택시 요청" };
}

function summarizeNames(names: string[]) {
  if (names.length === 0) {
    return "주민 없음";
  }
  if (names.length === 1) {
    return names[0];
  }
  return `${names[0]} 외 ${names.length - 1}명`;
}

export async function listCalendarEvents(
  user: AuthUser | null | undefined,
  filters: CalendarEventFilters = {},
) {
  const canReadRequests = hasPermission(user, "request:read");
  const canReadGroups =
    hasPermission(user, "group:read") ||
    hasPermission(user, "trip:read") ||
    hasPermission(user, "taxi:read");

  if (!canReadRequests && !canReadGroups) {
    throw new AuthorizationError();
  }

  const window = buildCalendarWindow(filters);
  const status = normalizeStatus(filters.status);
  const start = dateFromKey(window.gridStart);
  const end = dateFromKey(window.gridEnd);

  const [requests, groups] = await Promise.all([
    canReadRequests
      ? prisma.mobilityRequest.findMany({
          where: {
            deletedAt: null,
            desiredDate: { gte: start, lt: end },
            ...(status ? { status } : {}),
            groupMembers: { none: {} },
          },
          orderBy: [{ desiredDate: "asc" }, { createdAt: "asc" }],
          take: 160,
          include: {
            resident: {
              select: {
                name: true,
                phone: true,
                villageName: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    canReadGroups
      ? prisma.mobilityGroup.findMany({
          where: {
            deletedAt: null,
            serviceDate: { gte: start, lt: end },
            ...(status ? { status } : {}),
          },
          orderBy: [{ serviceDate: "asc" }, { timeWindow: "asc" }, { updatedAt: "desc" }],
          take: 180,
          include: {
            linker: { select: { name: true } },
            taxiReservation: { select: { reservationConfirmed: true } },
            members: {
              where: { memberStatus: "ACTIVE" },
              orderBy: { pickupOrder: "asc" },
              include: {
                resident: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const requestEvents: CalendarEvent[] = requests.map((request) => ({
    id: request.id,
    kind: "request",
    date: formatDateOnly(request.desiredDate),
    title: `${request.resident.name} 이동 신청`,
    subtitle: `${request.origin} → ${request.destination}`,
    timeWindow: request.desiredTimeWindow,
    status: request.status,
    statusLabel: MOBILITY_STATUS_LABELS[request.status],
    href: `/admin/requests?desiredDate=${formatDateOnly(request.desiredDate)}&status=${request.status}`,
    memberCount: 1,
    residentSummary: `${request.resident.name} · ${maskPhone(request.resident.phone)}`,
    linkerName: "미배정",
    taxiState: "none",
    taxiLabel: "택시 미요청",
  }));

  const groupEvents: CalendarEvent[] = groups.map((group) => {
    const taxi = toTaxiState(group.taxiReservation);
    const memberNames = group.members.map((member) => member.resident.name);
    const date = formatDateOnly(group.serviceDate);

    return {
      id: group.id,
      kind: "group",
      date,
      title: group.groupName,
      subtitle: group.destinationSummary,
      timeWindow: group.timeWindow,
      status: group.status,
      statusLabel: MOBILITY_STATUS_LABELS[group.status],
      href: `/admin/trips?serviceDate=${date}&status=${group.status}`,
      memberCount: group.members.length,
      residentSummary: summarizeNames(memberNames),
      linkerName: group.linker?.name ?? "링커 미배정",
      ...taxi,
    };
  });

  return [...requestEvents, ...groupEvents].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date.localeCompare(right.date);
    }
    if (left.timeWindow !== right.timeWindow) {
      return left.timeWindow.localeCompare(right.timeWindow);
    }
    return left.kind.localeCompare(right.kind);
  });
}

export function summarizeCalendarEvents(events: CalendarEvent[]): CalendarSummary {
  return {
    requestCount: events.filter((event) => event.kind === "request").length,
    groupCount: events.filter((event) => event.kind === "group").length,
    taxiPendingCount: events.filter(
      (event) => event.kind === "group" && event.taxiState !== "confirmed",
    ).length,
    linkerPendingCount: events.filter(
      (event) => event.kind === "group" && event.linkerName === "링커 미배정",
    ).length,
  };
}

const previewToday = formatDateOnly(new Date());
const previewNextServiceDate = formatDateOnly(addDays(new Date(), 2));

export const previewCalendarEvents: CalendarEvent[] = [
  {
    id: "preview-calendar-request",
    kind: "request",
    date: previewToday,
    title: "홍길순 이동 신청",
    subtitle: "백천마을 회관 → 백천종합병원",
    timeWindow: "오전",
    status: "REQUESTED",
    statusLabel: MOBILITY_STATUS_LABELS.REQUESTED,
    href: `/admin/requests?desiredDate=${previewToday}&status=REQUESTED`,
    memberCount: 1,
    residentSummary: "홍길순 · 010-****-5678",
    linkerName: "미배정",
    taxiState: "none",
    taxiLabel: "택시 미요청",
  },
  {
    id: "preview-calendar-group",
    kind: "group",
    date: previewToday,
    title: `${previewToday} 오전 백천종합병원 이동`,
    subtitle: "백천종합병원",
    timeWindow: "오전",
    status: "LINKER_ASSIGNED",
    statusLabel: MOBILITY_STATUS_LABELS.LINKER_ASSIGNED,
    href: `/admin/trips?serviceDate=${previewToday}&status=LINKER_ASSIGNED`,
    memberCount: 2,
    residentSummary: "홍길순 외 1명",
    linkerName: "박동행",
    taxiState: "requested",
    taxiLabel: "택시 요청",
  },
  {
    id: "preview-calendar-return",
    kind: "group",
    date: previewNextServiceDate,
    title: `${previewNextServiceDate} 오후 장보기 이동`,
    subtitle: "읍내시장",
    timeWindow: "오후",
    status: "TAXI_CONFIRMED",
    statusLabel: MOBILITY_STATUS_LABELS.TAXI_CONFIRMED,
    href: `/admin/trips?serviceDate=${previewNextServiceDate}&status=TAXI_CONFIRMED`,
    memberCount: 3,
    residentSummary: "박순자 외 2명",
    linkerName: "김동행",
    taxiState: "confirmed",
    taxiLabel: "택시 확정",
  },
];
