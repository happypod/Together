type AccessDeniedPanelProps = {
  title?: string;
  description?: string;
};

export function AccessDeniedPanel({
  title = "이 역할로는 접근할 수 없습니다.",
  description = "필요한 경우 운영 책임자에게 권한 확인을 요청해 주세요.",
}: AccessDeniedPanelProps) {
  return (
    <section className="access-denied-panel" aria-labelledby="access-denied-title">
      <p className="eyebrow">권한 확인</p>
      <h2 id="access-denied-title">{title}</h2>
      <p>{description}</p>
    </section>
  );
}
