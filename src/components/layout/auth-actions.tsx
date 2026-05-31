import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { FaIcon } from "@/components/ui/fa-icon";
import { getCurrentUser } from "@/server/auth/session";

type AuthActionsProps = {
  className?: string;
};

export async function AuthActions({ className }: AuthActionsProps) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const classes = ["auth-actions", className].filter(Boolean).join(" ");

  if (!user) {
    return (
      <div className={classes} aria-label="로그인과 관리자 진입">
        <Link className="auth-action auth-action-primary" href="/login">
          <FaIcon name="login" />
          <span>로그인</span>
        </Link>
        <Link className="auth-action auth-action-secondary" href="/admin">
          <FaIcon name="admin" />
          <span>관리자</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={classes} aria-label="관리자와 로그아웃">
      <Link className="auth-action auth-action-primary" href="/admin">
        <FaIcon name="admin" />
        <span>관리자</span>
      </Link>
      <form action={logoutAction} className="auth-action-form">
        <button className="auth-action auth-action-secondary" type="submit">
          <FaIcon name="logout" />
          <span>로그아웃</span>
        </button>
      </form>
    </div>
  );
}
