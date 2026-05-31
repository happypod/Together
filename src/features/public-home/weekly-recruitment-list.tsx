import Link from "next/link";
import { type PublicRecruitmentRow } from "@/server/public/public-home-service";

type Props = {
  applyHref?: string;
  rows: PublicRecruitmentRow[];
};

const statusToneMap: Record<string, string> = {
  RECRUITING: "teal",
  GROUP_READY: "blue",
  LINKER_ASSIGNED: "blue",
  LINKER_RECRUITING: "amber",
};

export function WeeklyRecruitmentList({ applyHref = "/public/apply", rows }: Props) {
  return (
    <section className="pub-section pub-section-alt" id="schedule" aria-labelledby="schedule-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">공동예약 모집현황</p>
          <h2 className="pub-section-title" id="schedule-title">이번 주 함께 이동할 수 있는 일정</h2>
          <p className="pub-section-desc">
            같은 날짜와 방향으로 신청하면 공동예약 그룹으로 편성됩니다.
            개인 신청 정보는 표시되지 않습니다.
          </p>
        </div>

        {rows.length > 0 ? (
          <ul className="pub-recruitment-list">
            {rows.map((row) => {
              const tone = statusToneMap[row.status] ?? "teal";
              return (
                <li className="pub-recruitment-row" key={row.id}>
                  <div className="pub-recruitment-meta">
                    <span className="pub-recruitment-date">{row.serviceDate}</span>
                    <span className="pub-recruitment-time">{row.timeWindow}</span>
                  </div>
                  <div className="pub-recruitment-info">
                    <strong className="pub-recruitment-direction">{row.directionLabel}</strong>
                    <span className="pub-recruitment-purpose">{row.purposeLabel}</span>
                  </div>
                  <div className="pub-recruitment-right">
                    <span className={`pub-recruitment-status pub-recruitment-status--${tone}`}>
                      {row.recruitmentStatusLabel}
                    </span>
                    {row.canApply ? (
                      <Link className="pub-cta-small" href={applyHref}>
                        함께 신청하기
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pub-empty">
            이번 주 모집 중인 일정이 없습니다. 신청을 먼저 접수하면 운영자가 공동예약 가능 여부를 안내합니다.
          </p>
        )}

        <p className="pub-recruitment-note">
          ※ 신청한 주민이 3명이 되면 공동예약 그룹이 구성됩니다. 함께 이동할 주민이 없을 경우 운영자가 조정합니다.
        </p>
      </div>
    </section>
  );
}
