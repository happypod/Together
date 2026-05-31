import { type PublicOperationSummary } from "@/server/public/public-home-service";

type Props = { summary: PublicOperationSummary };

const cards = (s: PublicOperationSummary) => [
  { icon: "📅", label: "오늘 예정 이동", value: `${s.todayGroupCount}건`, tone: "blue" },
  { icon: "🔔", label: "이번 주 모집 중", value: `${s.weekRecruitingCount}건`, tone: "teal" },
  { icon: "✅", label: "공동예약 확정", value: `${s.confirmedGroupCount}건`, tone: "teal" },
  { icon: "🧑‍🤝‍🧑", label: "동행링커 배정 완료", value: `${s.linkerAssignedCount}건`, tone: "blue" },
  { icon: "🚕", label: "택시연합 예약확인 중", value: `${s.taxiPendingCount}건`, tone: "amber" },
];

export function OperationSummaryCards({ summary }: Props) {
  return (
    <section className="pub-section pub-section-summary" aria-labelledby="summary-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">오늘의 운영 상태</p>
          <h2 className="pub-section-title" id="summary-title">현재 운영 현황</h2>
          <p className="pub-section-desc">
            개인정보 없이 집계된 운영 현황입니다.
          </p>
        </div>
        <ul className="pub-summary-grid" aria-label="운영 현황 요약">
          {cards(summary).map((card) => (
            <li className={`pub-summary-card pub-summary-card--${card.tone}`} key={card.label}>
              <span aria-hidden="true" className="pub-summary-icon">{card.icon}</span>
              <span className="pub-summary-label">{card.label}</span>
              <strong className="pub-summary-value">{card.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
