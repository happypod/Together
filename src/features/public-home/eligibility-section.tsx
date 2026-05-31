const included = [
  "병원·약국 방문",
  "장보기",
  "공공기관 업무",
  "금융기관 업무",
  "우체국 업무",
  "주민협의체가 인정한 비응급 생활이동",
];

const excluded = [
  "응급상황에 있는 분",
  "감염병 의심자",
  "중증 거동이 어려운 분",
  "전문기관 이용이 필요한 분",
  "고도의 신체 지원이 필요한 분",
];

export function EligibilitySection() {
  return (
    <section className="pub-section pub-section-alt" aria-labelledby="eligibility-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">이용 대상</p>
          <h2 className="pub-section-title" id="eligibility-title">누가 이용할 수 있나요?</h2>
        </div>
        <div className="pub-eligibility-grid">
          <div className="pub-eligibility-card pub-eligibility-card--ok">
            <h3 className="pub-eligibility-head">
              <span aria-hidden="true">✅</span> 이용 가능
            </h3>
            <ul className="pub-eligibility-list">
              {included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="pub-eligibility-card pub-eligibility-card--no">
            <h3 className="pub-eligibility-head">
              <span aria-hidden="true">⚠️</span> 이용 제외
            </h3>
            <ul className="pub-eligibility-list">
              {excluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="pub-eligibility-note">
          본 서비스는 응급 상황이나 의료서비스가 아닙니다.
          응급상황은 <strong>119</strong> 또는 가까운 의료기관에 문의해 주세요.
        </p>
      </div>
    </section>
  );
}
