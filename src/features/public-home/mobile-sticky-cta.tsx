"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="mobile-sticky-cta" aria-label="빠른 행동 버튼">
      <Link className="mobile-sticky-btn mobile-sticky-btn--primary" href="/public/apply">
        신청하기
      </Link>
      <Link className="mobile-sticky-btn mobile-sticky-btn--secondary" href="/public/check">
        신청 확인
      </Link>
      <Link className="mobile-sticky-btn mobile-sticky-btn--secondary" href="/public/education">
        교육
      </Link>
      <Link className="mobile-sticky-btn mobile-sticky-btn--ghost" href="/public/contact">
        문의
      </Link>
    </div>
  );
}
