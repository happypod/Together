"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { FaIcon, type FontAwesomeIconName } from "@/components/ui/fa-icon";

export type TabItem = {
  id: string;
  label: string;
  icon?: FontAwesomeIconName;
  badge?: string | number;
  content: ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  ariaLabel: string;
  defaultTabId?: string;
};

/**
 * 큰 글씨와 큰 터치 영역을 갖춘 접근성 탭.
 * 좌우 방향키로 탭 이동, 한 번에 하나의 패널만 표시해 고령 사용자의 화면 부담을 줄인다.
 */
export function Tabs({ tabs, ariaLabel, defaultTabId }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(defaultTabId ?? tabs[0]?.id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (tabs.length === 0) {
    return null;
  }

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );

  function focusTab(index: number) {
    const next = tabs[(index + tabs.length) % tabs.length];
    if (!next) {
      return;
    }
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(activeIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(tabs.length - 1);
    }
  }

  return (
    <div className="tabs">
      <div className="tablist" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const selected = tab.id === activeId;
          return (
            <button
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={selected ? "true" : "false"}
              className="tab-trigger"
              id={`${baseId}-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={handleKeyDown}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {tab.icon ? (
                <span aria-hidden="true" className="tab-icon">
                  <FaIcon name={tab.icon} />
                </span>
              ) : null}
              <span className="tab-label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== "" ? (
                <span className="tab-badge">{tab.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          className="tabpanel"
          hidden={tab.id !== activeId}
          id={`${baseId}-panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
          tabIndex={0}
        >
          {tab.id === activeId ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
