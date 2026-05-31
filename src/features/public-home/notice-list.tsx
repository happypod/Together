import { type PublicNoticeItem } from "@/server/public/public-home-service";

type Props = { notices: PublicNoticeItem[] };

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "일반",
  OPERATION: "운영",
  SAFETY: "안전",
  PRIVACY: "개인정보",
};

const TYPE_TONES: Record<string, string> = {
  GENERAL: "neutral",
  OPERATION: "teal",
  SAFETY: "amber",
  PRIVACY: "blue",
};

export function NoticeList({ notices }: Props) {
  return (
    <section className="pub-section pub-section-alt" id="notice" aria-labelledby="notice-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">공지·알림</p>
          <h2 className="pub-section-title" id="notice-title">운영 공지사항</h2>
        </div>
        {notices.length > 0 ? (
          <ul className="pub-notice-list">
            {notices.map((n) => {
              const tone = TYPE_TONES[n.noticeType] ?? "neutral";
              return (
                <li className={`pub-notice-item pub-notice-item--${tone}`} key={n.id}>
                  <div className="pub-notice-meta">
                    <span className={`pub-notice-type pub-notice-type--${tone}`}>
                      {TYPE_LABELS[n.noticeType] ?? "공지"}
                    </span>
                    {n.isPinned ? (
                      <span className="pub-notice-pin" aria-label="중요 공지">📌</span>
                    ) : null}
                    <time className="pub-notice-date" dateTime={n.createdAt}>
                      {n.createdAt}
                    </time>
                  </div>
                  <h3 className="pub-notice-title">{n.title}</h3>
                  <p className="pub-notice-content">{n.content}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pub-empty">현재 공지사항이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
