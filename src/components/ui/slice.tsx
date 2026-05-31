import type { ReactNode } from "react";
import { FaIcon, type FontAwesomeIconName } from "@/components/ui/fa-icon";

type SliceProps = {
  title: string;
  icon?: FontAwesomeIconName;
  summary?: string;
  defaultOpen?: boolean;
  tone?: "neutral" | "accent" | "warn";
  children: ReactNode;
};

/**
 * 펼침/접힘이 가능한 슬라이스 영역.
 * 기본 <details>/<summary>로 만들어 자바스크립트 없이도 동작하며,
 * 긴 카드 안의 반복 작업을 접어 두어 고령 사용자가 한 번에 한 가지에 집중하게 한다.
 */
export function Slice({
  title,
  icon,
  summary,
  defaultOpen = false,
  tone = "neutral",
  children,
}: SliceProps) {
  return (
    <details className="slice" data-tone={tone} open={defaultOpen}>
      <summary className="slice-summary">
        <span className="slice-summary-main">
          {icon ? (
            <span aria-hidden="true" className="slice-icon">
              <FaIcon name={icon} />
            </span>
          ) : null}
          <span className="slice-title">{title}</span>
        </span>
        {summary ? <span className="slice-meta">{summary}</span> : null}
        <span aria-hidden="true" className="slice-chevron" />
      </summary>
      <div className="slice-body">{children}</div>
    </details>
  );
}
