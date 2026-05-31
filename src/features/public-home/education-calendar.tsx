"use client";

import { useState } from "react";

export type EducationScheduleItem = {
  id: string;
  courseType: "collective" | "linker-qualification";
  title: string;
  date: string;   // YYYY-MM-DD
  time: string;
  target: string;
  place: string;
  status: "접수 중" | "사전 신청" | "마감" | "완료";
};

type EducationCalendarProps = {
  schedules: EducationScheduleItem[];
  /** 신청 폼 앵커 id (클릭 시 스크롤) */
  applyAnchor?: string;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const COURSE_TONE = {
  "collective": "teal" as const,
  "linker-qualification": "blue" as const,
} satisfies Record<EducationScheduleItem["courseType"], "teal" | "blue">;

const COURSE_LABEL = {
  "collective": "집체교육",
  "linker-qualification": "민간자격과정",
} satisfies Record<EducationScheduleItem["courseType"], string>;

const STATUS_TONE: Record<EducationScheduleItem["status"], string> = {
  "접수 중": "recruiting",
  "사전 신청": "progress",
  "마감": "done",
  "완료": "done",
};

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseYear(key: string) { return Number(key.slice(0, 4)); }
function parseMonth(key: string) { return Number(key.slice(5, 7)); }

export function EducationCalendar({ schedules, applyAnchor = "#education-apply-title" }: EducationCalendarProps) {
  // 첫 교육이 있는 달을 기본 달로 설정한다.
  const firstDate = schedules.length > 0 ? schedules[0]!.date : new Date().toISOString().slice(0, 10);
  const [year, setYear] = useState(parseYear(firstDate));
  const [month, setMonth] = useState(parseMonth(firstDate));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 날짜 → 교육 목록 맵
  const byDate: Record<string, EducationScheduleItem[]> = {};
  for (const s of schedules) {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date]!.push(s);
  }

  // 현재 달에 교육이 있는 달 범위 계산 (prev/next 버튼 비활성화 기준)
  const allMonths = [...new Set(schedules.map((s) => s.date.slice(0, 7)))].sort();
  const firstMonth = allMonths[0] ?? `${year}-${String(month).padStart(2, "0")}`;
  const lastMonth = allMonths[allMonths.length - 1] ?? firstMonth;
  const currentMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const canPrev = currentMonthKey > firstMonth;
  const canNext = currentMonthKey < lastMonth;

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
    setSelectedKey(null);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
    setSelectedKey(null);
  }

  const cells = buildMonthCells(year, month);
  const todayKey = new Date().toISOString().slice(0, 10);
  const selectedSchedules = selectedKey ? (byDate[selectedKey] ?? []) : [];

  return (
    <div className="edu-cal-root">
      {/* ── 월 네비게이션 ── */}
      <div className="edu-cal-nav">
        <button
          aria-label="이전 달"
          className="edu-cal-nav-btn"
          disabled={!canPrev}
          onClick={prevMonth}
          type="button"
        >
          ◀
        </button>
        <strong className="edu-cal-month-label" aria-live="polite">
          {year}년 {month}월 교육 일정
        </strong>
        <button
          aria-label="다음 달"
          className="edu-cal-nav-btn"
          disabled={!canNext}
          onClick={nextMonth}
          type="button"
        >
          ▶
        </button>
      </div>

      {/* ── 요일 헤더 ── */}
      <div className="edu-cal-grid edu-cal-weekdays" role="row" aria-label="요일">
        {DAY_LABELS.map((d, i) => (
          <div
            className={`edu-cal-weekday${i === 0 ? " edu-cal-weekday--sun" : i === 6 ? " edu-cal-weekday--sat" : ""}`}
            key={d}
            role="columnheader"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── 날짜 그리드 ── */}
      <div className="edu-cal-grid" role="grid" aria-label={`${year}년 ${month}월 교육 달력`}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <div aria-hidden="true" className="edu-cal-cell edu-cal-cell--empty" key={`empty-${idx}`} />;
          }
          const key = dateKey(year, month, day);
          const items = byDate[key] ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const hasEvent = items.length > 0;
          const colIdx = idx % 7;
          const tones = [...new Set(items.map((s) => COURSE_TONE[s.courseType]))];

          return (
            <button
              aria-label={`${month}월 ${day}일${hasEvent ? `, 교육 ${items.length}건` : ""}`}
              aria-pressed={isSelected}
              className={[
                "edu-cal-cell",
                hasEvent ? "edu-cal-cell--has-event" : "",
                isToday ? "edu-cal-cell--today" : "",
                isSelected ? "edu-cal-cell--selected" : "",
                tones.includes("teal") && tones.includes("blue") ? "edu-cal-cell--multi" :
                  tones[0] ? `edu-cal-cell--${tones[0]}` : "",
                colIdx === 0 ? "edu-cal-cell--sun" : colIdx === 6 ? "edu-cal-cell--sat" : "",
              ].filter(Boolean).join(" ")}
              disabled={!hasEvent}
              key={key}
              onClick={() => setSelectedKey(isSelected ? null : key)}
              type="button"
            >
              <span className="edu-cal-day-num">{day}</span>
              {hasEvent ? (
                <span className="edu-cal-dots" aria-hidden="true">
                  {items.map((s, i) => (
                    <span
                      className={`edu-cal-dot edu-cal-dot--${COURSE_TONE[s.courseType]}`}
                      key={i}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ── 선택 날짜 상세 ── */}
      {selectedKey && selectedSchedules.length > 0 ? (
        <div
          className="edu-cal-detail"
          role="region"
          aria-label={`${selectedKey} 교육 일정`}
          aria-live="polite"
        >
          {selectedSchedules.map((s) => {
            const tone = COURSE_TONE[s.courseType];
            const canApply = s.status === "접수 중" || s.status === "사전 신청";
            return (
              <div className={`edu-cal-event edu-cal-event--${tone}`} key={s.id}>
                <div className="edu-cal-event-head">
                  <span className={`edu-cal-badge edu-cal-badge--${tone}`}>
                    {COURSE_LABEL[s.courseType]}
                  </span>
                  <span className={`edu-cal-status cal-event--${STATUS_TONE[s.status]}`}>
                    {s.status}
                  </span>
                </div>
                <strong className="edu-cal-event-title">{s.title}</strong>
                <dl className="edu-cal-event-dl">
                  <div>
                    <dt>일시</dt>
                    <dd>{s.date} {s.time}</dd>
                  </div>
                  <div>
                    <dt>대상</dt>
                    <dd>{s.target}</dd>
                  </div>
                  <div>
                    <dt>장소</dt>
                    <dd>{s.place}</dd>
                  </div>
                </dl>
                {canApply ? (
                  <a className="edu-cal-apply-btn" href={applyAnchor}>
                    이 교육 신청하기 →
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ── 범례 ── */}
      <dl className="edu-cal-legend" aria-label="교육 종류 안내">
        <div className="edu-cal-legend-item">
          <dt><span aria-hidden="true" className="edu-cal-dot edu-cal-dot--teal" style={{ width: 14, height: 14, borderRadius: 4, display: "inline-block" }} /></dt>
          <dd>집체교육</dd>
        </div>
        <div className="edu-cal-legend-item">
          <dt><span aria-hidden="true" className="edu-cal-dot edu-cal-dot--blue" style={{ width: 14, height: 14, borderRadius: 4, display: "inline-block" }} /></dt>
          <dd>민간자격과정</dd>
        </div>
        <div className="edu-cal-legend-item">
          <dt><span aria-hidden="true" className="edu-cal-dot" style={{ width: 14, height: 14, borderRadius: 4, background: "#e0e0e0", display: "inline-block" }} /></dt>
          <dd>날짜 클릭 시 상세 표시</dd>
        </div>
      </dl>
    </div>
  );
}
