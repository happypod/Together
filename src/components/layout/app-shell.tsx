import Link from "next/link";
import type { ReactNode } from "react";
import { AuthActions } from "@/components/layout/auth-actions";
import { AppChrome } from "@/components/layout/app-chrome";
import { FaIcon } from "@/components/ui/fa-icon";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
  currentHref?: string;
};

export function AppShell({ children, currentHref = "/" }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              동행
            </span>
            <div>
              <p className="brand-kicker">소원권역 동행이동 OS</p>
              <strong>
                <span className="brand-title-full">운영관리</span>
                <span className="brand-title-mobile">관리</span>
              </strong>
            </div>
          </div>
          <div className="topbar-side">
            <AppChrome currentHref={currentHref} />
            <AuthActions />
            <div className="status-pill" aria-label="시스템 상태">
              <span aria-hidden="true" />
              운영 준비
            </div>
          </div>
        </div>
        <nav className="nav-strip" aria-label="관리자 메뉴">
          {navigationItems.map((item) => (
            <Link
              aria-current={item.href === currentHref ? "page" : undefined}
              className="nav-link"
              href={item.href}
              key={item.label}
              title={`${item.label} (Alt + ${item.hotkey})`}
            >
              <span aria-hidden="true" className="nav-icon">
                <FaIcon name={item.icon} />
              </span>
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <nav className="bottom-nav" aria-label="빠른 메뉴">
        {navigationItems.map((item) => (
          <Link
            aria-label={item.label}
            aria-current={item.href === currentHref ? "page" : undefined}
            className="bottom-nav-link"
            href={item.href}
            key={item.label}
          >
            <span aria-hidden="true" className="bottom-nav-icon">
              <FaIcon name={item.icon} />
            </span>
            <span className="bottom-nav-text">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
