export function ContactSection() {
  return (
    <section className="pub-section" id="contact" aria-labelledby="contact-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">문의</p>
          <h2 className="pub-section-title" id="contact-title">궁금한 점이 있으신가요?</h2>
        </div>
        <div className="pub-contact-grid">
          <div className="pub-contact-card">
            <h3 className="pub-contact-head">운영 안내</h3>
            <p className="pub-contact-desc">
              소원권역 동행이동 OS는 소원권역 주민협의체와 앵커조직이 함께 운영하는
              공동예약형 생활이동 지원 프로그램입니다.
            </p>
            <ul className="pub-contact-list">
              <li>
                <span className="pub-contact-label">운영 지역</span>
                <span className="pub-contact-value">충청남도 태안군 소원권역</span>
              </li>
              <li>
                <span className="pub-contact-label">문의 가능 시간</span>
                <span className="pub-contact-value">평일 오전 9시 ~ 오후 5시</span>
              </li>
            </ul>
          </div>
          <div className="pub-contact-card pub-contact-card--highlight">
            <h3 className="pub-contact-head">신청·문의 방법</h3>
            <ul className="pub-contact-list">
              <li>
                <span className="pub-contact-label">온라인 신청</span>
                <span className="pub-contact-value">이 페이지에서 직접 신청</span>
              </li>
              <li>
                <span className="pub-contact-label">주민협의체 문의</span>
                <span className="pub-contact-value">마을 담당자에게 연락</span>
              </li>
              <li>
                <span className="pub-contact-label">개인정보 문의</span>
                <span className="pub-contact-value">운영자에게 직접 문의</span>
              </li>
            </ul>
            <p className="pub-contact-safety">
              <span aria-hidden="true">🚨</span>{" "}
              응급상황은 <strong>119</strong>에 신고해 주세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
