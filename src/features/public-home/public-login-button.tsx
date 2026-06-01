import Link from "next/link";
import { FaIcon } from "@/components/ui/fa-icon";

/**
 * 공개 헤더 전용 역할 진입 버튼.
 * 관리자 접속은 푸터의 운영관리 접속 링크로 유지한다.
 */
export async function PublicLoginButton() {
  return (
    <div className="pub-role-entry" aria-label="주민과 동행링커 대시보드">
      <Link
        className="pub-login-btn auth-action auth-action-primary"
        href="/resident"
        aria-label="주민 대시보드"
        prefetch
      >
        <FaIcon name="resident" />
        <span className="pub-login-btn-text">주민</span>
      </Link>
      <Link
        className="pub-login-btn auth-action auth-action-secondary"
        href="/linker"
        aria-label="동행링커 대시보드"
        prefetch
      >
        <FaIcon name="car" />
        <span className="pub-login-btn-text">링커</span>
      </Link>
    </div>
  );
}
