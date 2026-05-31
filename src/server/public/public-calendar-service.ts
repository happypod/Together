import { type MobilityStatus, MOBILITY_PURPOSE_LABELS } from "@/domain/definitions";
import { prisma } from "@/server/db/prisma";

/** 개인정보 없는 캘린더 이벤트 */
export type CalendarEventItem = {
  groupId: string;
  timeWindow: string;
  directionLabel: string;
  purposeLabel: string;
  status: MobilityStatus;
  statusLabel: string;
  memberCount: number;
  canApply: boolean;
};

/** 하루치 캘린더 데이터 */
export type CalendarDayData = {
  dateKey: string; // YYYY-MM-DD
  events: CalendarEventItem[];
  /** 가장 눈에 띄는 상태 (색 코딩용) */
  primaryTone: "recruiting" | "confirmed" | "progress" | "done" | "none";
};

/** 한 달치 캘린더 데이터 */
export type CalendarMonthData = {
  year: number;
  month: number; // 1-12
  byDate: Record<string, CalendarDayData>; // key: YYYY-MM-DD
};

const ACTIVE_TONES: Record<string, CalendarDayData["primaryTone"]> = {
  RECRUITING: "recruiting",
  GROUP_READY: "confirmed",
  LINKER_RECRUITING: "confirmed",
  LINKER_ASSIGNED: "confirmed",
  TAXI_REQUESTED: "progress",
  TAXI_CONFIRMED: "progress",
  IN_PROGRESS: "progress",
  RETURN_CONFIRMED: "done",
  SETTLED: "done",
  REPORTED: "done",
};

const CANCEL_STATUSES = new Set<MobilityStatus>([
  "CANCELED_BY_RESIDENT",
  "CANCELED_BY_OPERATOR",
  "CANCELED_BY_TAXI",
  "CANCELED_BY_WEATHER",
  "CANCELED_BY_OTHER",
]);

export const PUBLIC_STATUS_SHORT: Partial<Record<MobilityStatus, string>> = {
  RECRUITING: "모집 중",
  GROUP_READY: "그룹 확정",
  LINKER_RECRUITING: "링커 확인",
  LINKER_ASSIGNED: "링커 배정",
  TAXI_REQUESTED: "택시 확인 중",
  TAXI_CONFIRMED: "이동 확정",
  IN_PROGRESS: "이동 중",
  RETURN_CONFIRMED: "귀가완료",
  SETTLED: "정산완료",
  REPORTED: "완료",
};

function toneOf(status: MobilityStatus): CalendarDayData["primaryTone"] {
  return ACTIVE_TONES[status] ?? "none";
}

function dominantTone(events: CalendarEventItem[]): CalendarDayData["primaryTone"] {
  const priority: CalendarDayData["primaryTone"][] = [
    "recruiting",
    "progress",
    "confirmed",
    "done",
    "none",
  ];
  for (const tone of priority) {
    if (events.some((e) => toneOf(e.status) === tone)) {
      return tone;
    }
  }
  return "none";
}

function buildMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** DB에서 특정 달의 공개 캘린더 데이터를 조회한다. */
export async function getPublicCalendarMonth(
  year: number,
  month: number,
): Promise<CalendarMonthData> {
  const { start, end } = buildMonthRange(year, month);

  const groups = await prisma.mobilityGroup.findMany({
    where: {
      serviceDate: { gte: start, lte: end },
      deletedAt: null,
      status: { notIn: [...CANCEL_STATUSES] as MobilityStatus[] },
    },
    include: {
      members: {
        where: { memberStatus: "ACTIVE" },
        select: { request: { select: { purpose: true } } },
      },
    },
    orderBy: [{ serviceDate: "asc" }, { timeWindow: "asc" }],
  });

  const byDate: Record<string, CalendarDayData> = {};

  for (const g of groups) {
    const key = toDateKey(new Date(g.serviceDate));
    const purposes = g.members.map((m) => m.request.purpose);
    const purposeLabel =
      purposes.length > 0
        ? [...new Set(purposes)].map((p) => MOBILITY_PURPOSE_LABELS[p]).join("·")
        : "생활이동";

    const event: CalendarEventItem = {
      groupId: g.id,
      timeWindow: g.timeWindow,
      directionLabel: `소원권역 → ${g.destinationSummary}`,
      purposeLabel,
      status: g.status,
      statusLabel: PUBLIC_STATUS_SHORT[g.status] ?? g.status,
      memberCount: g.members.length,
      canApply: g.status === "RECRUITING" && g.members.length < 3,
    };

    if (!byDate[key]) {
      byDate[key] = { dateKey: key, events: [], primaryTone: "none" };
    }
    byDate[key]!.events.push(event);
  }

  for (const day of Object.values(byDate)) {
    day.primaryTone = dominantTone(day.events);
  }

  return { year, month, byDate };
}

/** 3개월치 데이터를 한 번에 조회한다 (현재 달 + 앞뒤 각 1달). */
export async function getPublicCalendarRange(
  baseYear: number,
  baseMonth: number,
): Promise<CalendarMonthData[]> {
  const months: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const m = baseMonth + i;
    if (m > 12) {
      months.push([baseYear + 1, m - 12]);
    } else {
      months.push([baseYear, m]);
    }
  }
  return Promise.all(months.map(([y, m]) => getPublicCalendarMonth(y, m)));
}

// ── 미리보기 데이터 ─────────────────────────────────────────────────────────

function makeKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function makePreviewMonth(year: number, month: number): CalendarMonthData {
  const events: { day: number; tone: CalendarDayData["primaryTone"]; timeWindow: string; purpose: string; status: MobilityStatus }[] = [
    { day: 3, tone: "recruiting", timeWindow: "오전", purpose: "병원·약국", status: "RECRUITING" },
    { day: 5, tone: "recruiting", timeWindow: "오후", purpose: "장보기", status: "RECRUITING" },
    { day: 7, tone: "confirmed", timeWindow: "오전", purpose: "공공기관", status: "GROUP_READY" },
    { day: 10, tone: "progress", timeWindow: "오전", purpose: "병원·약국", status: "TAXI_CONFIRMED" },
    { day: 12, tone: "recruiting", timeWindow: "오후", purpose: "장보기", status: "RECRUITING" },
    { day: 14, tone: "done", timeWindow: "오전", purpose: "병원·약국", status: "RETURN_CONFIRMED" },
    { day: 17, tone: "recruiting", timeWindow: "오전", purpose: "병원·약국", status: "RECRUITING" },
    { day: 19, tone: "confirmed", timeWindow: "오후", purpose: "장보기", status: "LINKER_ASSIGNED" },
    { day: 21, tone: "progress", timeWindow: "오전", purpose: "공공기관", status: "IN_PROGRESS" },
    { day: 24, tone: "recruiting", timeWindow: "오전", purpose: "병원·약국", status: "RECRUITING" },
    { day: 26, tone: "recruiting", timeWindow: "오후", purpose: "장보기", status: "RECRUITING" },
  ];

  const byDate: Record<string, CalendarDayData> = {};
  for (const e of events) {
    const key = makeKey(year, month, e.day);
    byDate[key] = {
      dateKey: key,
      primaryTone: e.tone,
      events: [
        {
          groupId: `prev-${key}`,
          timeWindow: e.timeWindow,
          directionLabel: "소원권역 → 태안읍",
          purposeLabel: e.purpose,
          status: e.status,
          statusLabel: PUBLIC_STATUS_SHORT[e.status] ?? "",
          memberCount: e.tone === "recruiting" ? 1 : 3,
          canApply: e.tone === "recruiting",
        },
      ],
    };
  }

  return { year, month, byDate };
}

export function makePreviewCalendarMonths(): CalendarMonthData[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return [0, 1, 2].map((offset) => {
    const mo = m + offset;
    return makePreviewMonth(mo > 12 ? y + 1 : y, mo > 12 ? mo - 12 : mo);
  });
}
