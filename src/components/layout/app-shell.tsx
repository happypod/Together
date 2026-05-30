import Link from "next/link";
import type { ReactNode } from "react";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
  currentHref?: string;
};

export function AppShell({ children, currentHref = "/" }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              동행
            </span>
            <div>
              <p>백천만 동행이동 OS</p>
              <strong>운영관리</strong>
            </div>
          </div>
          <div className="status-pill" aria-label="시스템 상태">
            <span aria-hidden="true" />
            운영 준비
          </div>
        </div>
        <nav className="nav-strip" aria-label="관리자 메뉴">
          {navigationItems.map((item) => (
            <Link
              aria-current={item.href === currentHref ? "page" : undefined}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
