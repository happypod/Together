import Link from "next/link";

const currentYear = new Date().getFullYear();

const quickLinks = [
  { label: "공동예약 신청", href: "/public/apply" },
  { label: "내 신청 확인", href: "/public/check" },
  { label: "모집현황", href: "/public/schedule" },
  { label: "공지사항", href: "/public/notice" },
  { label: "문의", href: "/public/contact" },
] as const;

export function PublicFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">

        {/* ── 브랜드·조직 정보 ── */}
        <div className="site-footer-brand">
          <div className="site-footer-org">
            <span className="site-footer-org-mark" aria-hidden="true">앵커</span>
            <div>
              <strong className="site-footer-org-name">소원권역 앵커현장센터</strong>
              <span className="site-footer-org-sub">Sowon Region Anchor Field Center</span>
            </div>
          </div>
          <p className="site-footer-service-name">소원권역 동행이동 OS 운영관리 시스템</p>
          <p className="site-footer-desc">
            소원권역 주민의 비응급 생활이동을 지원하는 공동예약형
            동행이동 프로그램입니다.
          </p>
          <p className="site-footer-location">
            <span aria-hidden="true">📍</span>{" "}
            충청남도 태안군 소원면 소재
          </p>
        </div>

        {/* ── 빠른 메뉴 ── */}
        <nav className="site-footer-nav" aria-label="공개 페이지 바로가기">
          <strong className="site-footer-nav-title">바로가기</strong>
          <ul className="site-footer-nav-list">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link className="site-footer-nav-link" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── 운영 정보 ── */}
        <div className="site-footer-info">
          <strong className="site-footer-nav-title">운영 안내</strong>
          <dl className="site-footer-dl">
            <div>
              <dt>운영 시간</dt>
              <dd>평일 오전 9시 ~ 오후 5시</dd>
            </div>
            <div>
              <dt>운영 지역</dt>
              <dd>소원권역 일원</dd>
            </div>
            <div>
              <dt>운영관리 접속</dt>
              <dd>
                <Link className="site-footer-admin-link" href="/admin">
                  운영자 로그인 →
                </Link>
              </dd>
            </div>
          </dl>
        </div>

      </div>

      {/* ── 하단 법적 정보 ── */}
      <div className="site-footer-bottom">
        <div className="site-footer-bottom-inner">
          <p className="site-footer-copy">
            © {currentYear} 소원권역 앵커현장센터 · 소원권역 동행이동 OS
          </p>
          <p className="site-footer-legal">
            본 서비스는 비응급 생활이동 지원 프로그램입니다.
            병명·진료 내용·주민등록번호는 수집하지 않습니다.
          </p>
          <p className="site-footer-emergency">
            <span aria-hidden="true">🚨</span>{" "}
            응급상황은 <strong>119</strong>에 신고해 주세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
