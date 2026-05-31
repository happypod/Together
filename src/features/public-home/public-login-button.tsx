import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { FaIcon } from "@/components/ui/fa-icon";
import { getCurrentUser } from "@/server/auth/session";

/**
 * 공개 헤더 전용 로그인/로그아웃 버튼.
 * 관리자 접속 링크는 푸터에 있으므로 여기서는 제거한다.
 */
export async function PublicLoginButton() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <Link
        className="pub-login-btn auth-action auth-action-primary"
        href="/login"
        aria-label="운영자 로그인"
      >
        <FaIcon name="login" />
        <span className="pub-login-btn-text">로그인</span>
      </Link>
    );
  }

  return (
    <form action={logoutAction} style={{ display: "contents" }}>
      <button
        className="pub-login-btn auth-action auth-action-secondary"
        type="submit"
        aria-label="로그아웃"
      >
        <FaIcon name="logout" />
        <span className="pub-login-btn-text">로그아웃</span>
      </button>
    </form>
  );
}
