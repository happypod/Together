type RouteLoadingProps = {
  label?: string;
  variant?: "public" | "admin";
};

/**
 * 라우트 전환 중 즉시 표시되는 가벼운 로딩 화면.
 * 서버 렌더가 끝날 때까지 빈 화면 대신 스켈레톤을 보여 체감 속도를 높인다.
 */
export function RouteLoading({ label = "불러오는 중입니다…", variant = "public" }: RouteLoadingProps) {
  return (
    <div className={`route-loading route-loading--${variant}`} role="status" aria-live="polite">
      <div className="route-loading-inner">
        <span aria-hidden="true" className="route-loading-spinner" />
        <p className="route-loading-text">{label}</p>
        <div aria-hidden="true" className="route-loading-skeleton">
          <span className="route-loading-bar route-loading-bar--lg" />
          <span className="route-loading-bar route-loading-bar--md" />
          <span className="route-loading-bar route-loading-bar--sm" />
        </div>
      </div>
    </div>
  );
}
