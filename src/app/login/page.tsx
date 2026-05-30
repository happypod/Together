import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">관리자 로그인</p>
        <h1 id="login-title">백천만 동행이동 OS</h1>
        <p className="lead">운영 계정으로 접속해 주민 신청, 공동예약, 정산 기록을 관리합니다.</p>
        <LoginForm />
        <Link className="text-link" href="/">
          대시보드 첫 화면 보기
        </Link>
      </section>
    </main>
  );
}
