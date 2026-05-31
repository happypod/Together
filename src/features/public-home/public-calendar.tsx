"use client";

import { useState } from "react";
import { type CalendarDayData, type CalendarMonthData } from "@/server/public/public-calendar-service";

type ViewMode = "month" | "week" | "day";

type PublicCalendarProps = {
  months: CalendarMonthData[];
  /** 신청 페이지 링크. 지정 시 해당 날짜 이벤트에 "신청하기" CTA를 표시한다. */
  applyHref?: string;
  /** 처음에 표시할 달 인덱스 (0 = months[0]) */
  initialMonthIndex?: number;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const WEEK_DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

const TONE_CLASS: Record<CalendarDayData["primaryTone"], string> = {
  recruiting: "cal-day--recruiting",
  confirmed: "cal-day--confirmed",
  progress: "cal-day--progress",
  done: "cal-day--done",
  none: "",
};

const TONE_LABEL: Record<CalendarDayData["primaryTone"], string> = {
  recruiting: "신청 가능",
  confirmed: "그룹 확정",
  progress: "이동 예정",
  done: "완료",
  none: "",
};

const EVENT_TONE_CLASS: Record<string, string> = {
  RECRUITING: "cal-event--recruiting",
  GROUP_READY: "cal-event--confirmed",
  LINKER_RECRUITING: "cal-event--confirmed",
  LINKER_ASSIGNED: "cal-event--confirmed",
  TAXI_REQUESTED: "cal-event--progress",
  TAXI_CONFIRMED: "cal-event--progress",
  IN_PROGRESS: "cal-event--progress",
  RETURN_CONFIRMED: "cal-event--done",
  SETTLED: "cal-event--done",
  REPORTED: "cal-event--done",
};

/** YYYY-MM-DD → Date (UTC 기준) */
function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

/** Date → YYYY-MM-DD */
function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 해당 달의 캘린더 셀(빈 칸 + 날짜) 배열 생성 */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=일
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(i);
  }
  // 6행 고정
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

/** 이번 주 월~일 날짜 배열 */
function getWeekDays(baseDate: Date): Date[] {
  const day = baseDate.getUTCDay(); // 0=일
  const monday = new Date(baseDate);
  monday.setUTCDate(baseDate.getUTCDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

export function PublicCalendar({
  months,
  applyHref,
  initialMonthIndex = 0,
}: PublicCalendarProps) {
  const [view, setView] = useState<ViewMode>("month");
  const [monthIndex, setMonthIndex] = useState(
    Math.min(Math.max(0, initialMonthIndex), months.length - 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekBase, setWeekBase] = useState<string>(() => toKey(new Date()));

  const currentMonth = months[monthIndex];
  if (!currentMonth) {
    return null;
  }

  const { year, month, byDate } = currentMonth;

  function prevMonth() {
    setMonthIndex((i) => Math.max(0, i - 1));
    setSelectedDate(null);
  }
  function nextMonth() {
    setMonthIndex((i) => Math.min(months.length - 1, i + 1));
    setSelectedDate(null);
  }

  const selectedDay = selectedDate ? byDate[selectedDate] : null;

  return (
    <div className="cal-root">
      {/* ── 뷰 전환 탭 ── */}
      <div className="cal-view-tabs" role="tablist" aria-label="캘린더 보기 선택">
        {(["month", "week", "day"] as const).map((v) => (
          <button
            aria-selected={view === v}
            className="cal-view-tab"
            key={v}
            onClick={() => setView(v)}
            role="tab"
            type="button"
          >
            {v === "month" ? "월" : v === "week" ? "주" : "일"}
          </button>
        ))}
      </div>

      {/* ── 월 뷰 ── */}
      {view === "month" && (
        <MonthView
          applyHref={applyHref}
          byDate={byDate}
          month={month}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
          year={year}
          canGoPrev={monthIndex > 0}
          canGoNext={monthIndex < months.length - 1}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      )}

      {/* ── 주 뷰 ── */}
      {view === "week" && (
        <WeekView
          allByDate={Object.assign({}, ...months.map((m) => m.byDate)) as Record<string, CalendarDayData>}
          applyHref={applyHref}
          baseKey={weekBase}
          onChangeWeek={setWeekBase}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
          year={year}
          month={month}
        />
      )}

      {/* ── 일 뷰 ── */}
      {view === "day" && (
        <DayView
          allByDate={Object.assign({}, ...months.map((m) => m.byDate)) as Record<string, CalendarDayData>}
          applyHref={applyHref}
          selectedDate={selectedDate ?? toKey(new Date())}
          onChangeDate={setSelectedDate}
        />
      )}

      {/* ── 선택 날짜 상세 (월·주 뷰 하단) ── */}
      {view !== "day" && selectedDay && selectedDay.events.length > 0 ? (
        <EventDetail day={selectedDay} applyHref={applyHref} />
      ) : null}

      {/* ── 범례 ── */}
      <CalendarLegend />
    </div>
  );
}

// ─────────────────────────────────────────────────
// 월 뷰
// ─────────────────────────────────────────────────

type MonthViewProps = {
  year: number;
  month: number;
  byDate: Record<string, CalendarDayData>;
  selectedDate: string | null;
  onSelectDate: (key: string | null) => void;
  applyHref?: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function MonthView({
  year, month, byDate, selectedDate,
  onSelectDate, canGoPrev, canGoNext, onPrev, onNext,
}: MonthViewProps) {
  const cells = buildMonthCells(year, month);
  const todayKey = toKey(new Date());

  return (
    <div className="cal-month">
      {/* 월 네비게이션 */}
      <div className="cal-month-nav">
        <button
          aria-label="이전 달"
          className="cal-nav-btn"
          disabled={!canGoPrev}
          onClick={onPrev}
          type="button"
        >
          ◀ 이전 달
        </button>
        <strong className="cal-month-label" aria-live="polite">
          {year}년 {month}월
        </strong>
        <button
          aria-label="다음 달"
          className="cal-nav-btn"
          disabled={!canGoNext}
          onClick={onNext}
          type="button"
        >
          다음 달 ▶
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="cal-grid cal-weekday-row" role="row" aria-label="요일">
        {DAY_LABELS.map((label, i) => (
          <div
            className={`cal-weekday ${i === 0 ? "cal-weekday--sun" : i === 6 ? "cal-weekday--sat" : ""}`}
            key={label}
            role="columnheader"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="cal-grid" role="grid" aria-label={`${year}년 ${month}월 달력`}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <div className="cal-cell cal-cell--empty" key={`empty-${idx}`} aria-hidden="true" />;
          }
          const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const data = byDate[key];
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const tone = data?.primaryTone ?? "none";
          const colIdx = idx % 7;

          return (
            <button
              aria-label={`${month}월 ${day}일${data ? `, ${TONE_LABEL[tone]}, ${data.events.length}건` : ""}`}
              aria-pressed={isSelected}
              className={[
                "cal-cell",
                TONE_CLASS[tone],
                isToday ? "cal-cell--today" : "",
                isSelected ? "cal-cell--selected" : "",
                colIdx === 0 ? "cal-cell--sun" : colIdx === 6 ? "cal-cell--sat" : "",
              ].filter(Boolean).join(" ")}
              key={key}
              onClick={() => onSelectDate(isSelected ? null : key)}
              type="button"
            >
              <span className="cal-day-num">{day}</span>
              {data && data.events.length > 0 ? (
                <span className="cal-day-dots">
                  {data.events.slice(0, 3).map((e, i) => (
                    <span
                      aria-hidden="true"
                      className={`cal-dot ${EVENT_TONE_CLASS[e.status] ?? ""}`}
                      key={i}
                    />
                  ))}
                  {data.events.length > 3 ? (
                    <span aria-hidden="true" className="cal-dot-more">+{data.events.length - 3}</span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 주 뷰
// ─────────────────────────────────────────────────

type WeekViewProps = {
  year: number;
  month: number;
  allByDate: Record<string, CalendarDayData>;
  baseKey: string;
  onChangeWeek: (key: string) => void;
  selectedDate: string | null;
  onSelectDate: (key: string | null) => void;
  applyHref?: string;
};

function WeekView({ allByDate, baseKey, onChangeWeek, selectedDate, onSelectDate }: WeekViewProps) {
  const base = parseKey(baseKey);
  const days = getWeekDays(base);
  const todayKey = toKey(new Date());

  function prevWeek() {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - 7);
    onChangeWeek(toKey(d));
  }
  function nextWeek() {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + 7);
    onChangeWeek(toKey(d));
  }

  const weekLabel = (() => {
    const first = days[0]!;
    const last = days[6]!;
    return `${first.getUTCMonth() + 1}월 ${first.getUTCDate()}일 ~ ${last.getUTCMonth() + 1}월 ${last.getUTCDate()}일`;
  })();

  return (
    <div className="cal-week">
      <div className="cal-month-nav">
        <button className="cal-nav-btn" onClick={prevWeek} type="button" aria-label="이전 주">
          ◀ 이전 주
        </button>
        <strong className="cal-month-label" aria-live="polite">{weekLabel}</strong>
        <button className="cal-nav-btn" onClick={nextWeek} type="button" aria-label="다음 주">
          다음 주 ▶
        </button>
      </div>

      <ul className="cal-week-list">
        {days.map((day, i) => {
          const key = toKey(day);
          const data = allByDate[key];
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const tone = data?.primaryTone ?? "none";

          return (
            <li
              className={[
                "cal-week-row",
                TONE_CLASS[tone].replace("cal-day--", "cal-week-row--"),
                isToday ? "cal-week-row--today" : "",
                isSelected ? "cal-week-row--selected" : "",
              ].filter(Boolean).join(" ")}
              key={key}
            >
              <button
                className="cal-week-date-btn"
                onClick={() => onSelectDate(isSelected ? null : key)}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${day.getUTCMonth() + 1}월 ${day.getUTCDate()}일 ${WEEK_DAY_LABELS[i] ?? ""}`}
              >
                <span className="cal-week-day-label">{WEEK_DAY_LABELS[i]}</span>
                <span className="cal-week-day-num">
                  {day.getUTCMonth() + 1}.{day.getUTCDate()}
                </span>
                {isToday ? <span className="cal-today-badge">오늘</span> : null}
              </button>
              <div className="cal-week-events">
                {data && data.events.length > 0 ? (
                  data.events.map((e, ei) => (
                    <span
                      className={`cal-week-event-pill ${EVENT_TONE_CLASS[e.status] ?? ""}`}
                      key={ei}
                    >
                      {e.timeWindow} {e.purposeLabel} · {e.statusLabel}
                    </span>
                  ))
                ) : (
                  <span className="cal-week-empty">일정 없음</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 일 뷰
// ─────────────────────────────────────────────────

type DayViewProps = {
  allByDate: Record<string, CalendarDayData>;
  selectedDate: string;
  onChangeDate: (key: string) => void;
  applyHref?: string;
};

function DayView({ allByDate, selectedDate, onChangeDate, applyHref }: DayViewProps) {
  const base = parseKey(selectedDate);
  const todayKey = toKey(new Date());
  const data = allByDate[selectedDate];

  function prevDay() {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - 1);
    onChangeDate(toKey(d));
  }
  function nextDay() {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + 1);
    onChangeDate(toKey(d));
  }

  const [y, m, d] = selectedDate.split("-").map(Number);
  const dayLabel = `${y}년 ${m}월 ${d}일`;
  const weekDay = DAY_LABELS[base.getUTCDay()];
  const isToday = selectedDate === todayKey;

  return (
    <div className="cal-day-view">
      <div className="cal-month-nav">
        <button className="cal-nav-btn" onClick={prevDay} type="button" aria-label="전날">
          ◀ 전날
        </button>
        <strong className="cal-month-label" aria-live="polite">
          {dayLabel} ({weekDay}){isToday ? " 오늘" : ""}
        </strong>
        <button className="cal-nav-btn" onClick={nextDay} type="button" aria-label="다음날">
          다음날 ▶
        </button>
      </div>

      {data && data.events.length > 0 ? (
        <ul className="cal-day-event-list">
          {data.events.map((e, i) => (
            <li
              className={`cal-day-event ${EVENT_TONE_CLASS[e.status] ?? ""}`}
              key={i}
            >
              <div className="cal-day-event-header">
                <strong className="cal-day-event-time">{e.timeWindow}</strong>
                <span className={`cal-day-event-status ${EVENT_TONE_CLASS[e.status] ?? ""}`}>
                  {e.statusLabel}
                </span>
              </div>
              <div className="cal-day-event-body">
                <span className="cal-day-event-direction">{e.directionLabel}</span>
                <span className="cal-day-event-purpose">{e.purposeLabel}</span>
                <span className="cal-day-event-members">{e.memberCount}명 신청 중</span>
              </div>
              {e.canApply && applyHref ? (
                <a className="cal-apply-btn" href={applyHref}>
                  함께 신청하기
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="cal-day-empty">
          <span aria-hidden="true" className="cal-day-empty-icon">📅</span>
          <p>이 날짜에 예정된 이동 일정이 없습니다.</p>
          {applyHref ? (
            <a className="pub-cta-primary" href={applyHref} style={{ display: "inline-flex", marginTop: "8px" }}>
              이 날짜로 신청하기
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
// 선택 날짜 상세 (월/주 뷰 하단)
// ─────────────────────────────────────────────────

function EventDetail({
  day,
  applyHref,
}: {
  day: CalendarDayData;
  applyHref?: string;
}) {
  const [y, m, d] = day.dateKey.split("-").map(Number);
  return (
    <div className="cal-detail" role="region" aria-label={`${m}월 ${d}일 일정 상세`}>
      <strong className="cal-detail-date">{y}년 {m}월 {d}일 일정</strong>
      <ul className="cal-day-event-list">
        {day.events.map((e, i) => (
          <li className={`cal-day-event ${EVENT_TONE_CLASS[e.status] ?? ""}`} key={i}>
            <div className="cal-day-event-header">
              <strong className="cal-day-event-time">{e.timeWindow}</strong>
              <span className={`cal-day-event-status ${EVENT_TONE_CLASS[e.status] ?? ""}`}>
                {e.statusLabel}
              </span>
            </div>
            <div className="cal-day-event-body">
              <span className="cal-day-event-direction">{e.directionLabel}</span>
              <span className="cal-day-event-purpose">{e.purposeLabel}</span>
              <span className="cal-day-event-members">{e.memberCount}명 신청 중</span>
            </div>
            {e.canApply && applyHref ? (
              <a className="cal-apply-btn" href={applyHref}>
                함께 신청하기
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────
// 범례
// ─────────────────────────────────────────────────

function CalendarLegend() {
  return (
    <dl className="cal-legend" aria-label="색상 안내">
      <div className="cal-legend-item">
        <dt><span className="cal-legend-dot cal-legend-dot--recruiting" aria-hidden="true" /></dt>
        <dd>신청 가능</dd>
      </div>
      <div className="cal-legend-item">
        <dt><span className="cal-legend-dot cal-legend-dot--confirmed" aria-hidden="true" /></dt>
        <dd>그룹 확정</dd>
      </div>
      <div className="cal-legend-item">
        <dt><span className="cal-legend-dot cal-legend-dot--progress" aria-hidden="true" /></dt>
        <dd>이동 예정</dd>
      </div>
      <div className="cal-legend-item">
        <dt><span className="cal-legend-dot cal-legend-dot--done" aria-hidden="true" /></dt>
        <dd>완료</dd>
      </div>
    </dl>
  );
}
