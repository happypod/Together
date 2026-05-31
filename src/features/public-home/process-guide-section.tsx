const steps = [
  {
    num: "1",
    title: "생활이동 신청",
    desc: "주민 또는 보호자가 이동이 필요한 날짜와 방향을 신청합니다.",
    icon: "📝",
  },
  {
    num: "2",
    title: "같은 날짜·방향 신청자 모집",
    desc: "운영자가 같은 날짜와 방향의 신청자를 확인합니다.",
    icon: "🔍",
  },
  {
    num: "3",
    title: "주민 3명 공동예약 그룹 구성",
    desc: "주민 최대 3명으로 공동예약 그룹을 만들고 픽업 순서를 정합니다.",
    icon: "🧑‍🤝‍🧑",
  },
  {
    num: "4",
    title: "동행링커 배정·택시연합 예약확인",
    desc: "동행링커를 배정하고 택시연합에 예약확인을 진행합니다.",
    icon: "🚕",
  },
  {
    num: "5",
    title: "이동 후 귀가확인",
    desc: "이동 완료 후 귀가와 특이사항을 기록합니다.",
    icon: "🏠",
  },
] as const;

export function ProcessGuideSection() {
  return (
    <section className="pub-section" aria-labelledby="process-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">이용 절차</p>
          <h2 className="pub-section-title" id="process-title">이렇게 진행됩니다</h2>
        </div>
        <ol className="pub-step-list" aria-label="이용 절차 5단계">
          {steps.map((step) => (
            <li className="pub-step" key={step.num}>
              <div className="pub-step-num" aria-label={`${step.num}단계`}>
                <span aria-hidden="true" className="pub-step-icon">{step.icon}</span>
                <span className="pub-step-num-badge">{step.num}</span>
              </div>
              <div className="pub-step-body">
                <h3 className="pub-step-title">{step.title}</h3>
                <p className="pub-step-desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
