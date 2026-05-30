import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>요청한 화면을 찾을 수 없습니다.</h1>
      <Link className="primary-action" href="/">
        대시보드로 이동
      </Link>
    </main>
  );
}
