import { type PublicFeedbackItem } from "@/server/public/public-home-service";

type Props = { feedbacks: PublicFeedbackItem[] };

export function FeedbackPreview({ feedbacks }: Props) {
  return (
    <section className="pub-section" aria-labelledby="feedback-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">주민 이용 소감</p>
          <h2 className="pub-section-title" id="feedback-title">이용하신 분들의 의견</h2>
          <p className="pub-section-desc">
            운영자 확인을 거친 이용 소감만 표시됩니다. 실명과 개인정보는 공개되지 않습니다.
          </p>
        </div>
        {feedbacks.length > 0 ? (
          <ul className="pub-feedback-list">
            {feedbacks.map((f) => (
              <li className="pub-feedback-item" key={f.id}>
                <p className="pub-feedback-content">&#8220;{f.content}&#8221;</p>
                <footer className="pub-feedback-footer">
                  <span className="pub-feedback-who">
                    {f.villageLabel} · {f.roleLabel}
                  </span>
                </footer>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pub-empty">운영자 확인을 거친 이용 소감이 아직 없습니다.</p>
        )}
        <p className="pub-feedback-note">
          ※ 이용 소감은 과장된 홍보나 의료 효과를 포함하지 않습니다.
          운영 개선의견은 문의처로 보내주세요.
        </p>
      </div>
    </section>
  );
}
