import Link from "next/link";
import { AppChrome } from "@/components/layout/app-chrome";
import { PublicLoginButton } from "@/features/public-home/public-login-button";
import { publicMenuItems, type PublicMenuId } from "@/features/public-home/public-menu";

type PublicHeaderProps = {
  activeMenuId?: PublicMenuId;
};

export function PublicHeader({ activeMenuId }: PublicHeaderProps) {
  return (
    <header className="pub-header">
      <div className="pub-header-inner">
        <div className="pub-brand">
          <Link className="pub-brand-link" href="/" prefetch>
            <span className="pub-brand-mark" aria-hidden="true">동행</span>
            <div className="pub-brand-text">
              <span className="pub-brand-sub">소원권역 공동예약형 생활이동</span>
              <strong className="pub-brand-name">소원권역 동행이동 OS</strong>
            </div>
          </Link>
        </div>
        <nav className="pub-nav" aria-label="빠른 이동">
          {publicMenuItems.map((item) => (
            <Link
              aria-current={activeMenuId === item.id ? "page" : undefined}
              className="pub-nav-link"
              href={item.href}
              key={item.id}
              prefetch
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <AppChrome mode="public" />
        <PublicLoginButton />
      </div>
    </header>
  );
}
