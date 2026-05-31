import Link from "next/link";

export function HeroSection() {
  return (
    <section className="pub-hero" aria-labelledby="hero-title">
      <div className="pub-hero-inner">
        <div className="pub-hero-content">
          <p className="pub-hero-eyebrow">소원권역 주민을 위한 공동예약형 생활이동</p>
          <h1 className="pub-hero-title" id="hero-title">
            병원·장보기·공공업무 이동을<br />
            함께 준비합니다
          </h1>
          <p className="pub-hero-desc">
            소원권역 동행이동 OS는 주민 3명 공동예약, 동행링커 배정,
            택시연합 예약확인을 통해 비응급 생활이동을 지원하는
            운영관리 서비스입니다.
          </p>
          <div className="pub-hero-cta">
            <Link className="pub-cta-primary" href="/public/apply">
              공동예약 신청하기
            </Link>
            <Link className="pub-cta-secondary" href="/public/apply">
              보호자가 대신 신청하기
            </Link>
            <Link className="pub-cta-ghost" href="/public/check">
              내 신청 확인하기
            </Link>
          </div>
        </div>
        <div className="pub-hero-badge" aria-hidden="true">
          <div className="pub-hero-badge-inner">
            <span className="pub-hero-badge-icon">🚌</span>
            <span className="pub-hero-badge-label">함께 이동</span>
            <span className="pub-hero-badge-sub">소원권역 생활이동 지원</span>
          </div>
        </div>
      </div>
    </section>
  );
}
