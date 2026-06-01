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
      <div className={classes} aria-label="로그인">
        <Link aria-label="로그인" className="auth-action auth-action-primary" href="/login" prefetch>
          <FaIcon name="login" />
          <span className="auth-action-text">로그인</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={classes} aria-label="로그아웃">
      <form action={logoutAction} className="auth-action-form">
        <button aria-label="로그아웃" className="auth-action auth-action-secondary" type="submit">
          <FaIcon name="logout" />
          <span className="auth-action-text">로그아웃</span>
        </button>
      </form>
    </div>
  );
}
