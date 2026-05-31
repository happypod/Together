"use client";

import Link from "next/link";
import { useState } from "react";
import { EligibilitySection } from "@/features/public-home/eligibility-section";
import { FeedbackPreview } from "@/features/public-home/feedback-preview";
import { ProcessGuideSection } from "@/features/public-home/process-guide-section";
import { publicMenuItems } from "@/features/public-home/public-menu";
import { type PublicFeedbackItem } from "@/server/public/public-home-service";

type PublicHomeTabsProps = {
  feedbacks: PublicFeedbackItem[];
};

const tabItems = [
  {
    id: "tasks",
    label: "필요한 업무 선택",
  },
  {
    id: "process",
    label: "이용 절차",
  },
  {
    id: "feedback",
    label: "주민 이용 소감",
  },
  {
    id: "eligibility",
    label: "이용 대상",
  },
] as const;

type TabId = (typeof tabItems)[number]["id"];

export function PublicHomeTabs({ feedbacks }: PublicHomeTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  return (
    <section className="pub-section pub-home-tabs-section" aria-labelledby="home-tabs-title">
      <div className="pub-container pub-home-tabs-shell">
        <div className="pub-section-head pub-home-tabs-head">
          <p className="pub-eyebrow">빠른 안내</p>
          <h2 className="pub-section-title" id="home-tabs-title">필요한 내용을 탭으로 확인하세요</h2>
          <p className="pub-section-desc">
            필요한 업무, 절차, 소감, 대상을 한 화면에서 빠르게 확인합니다.
          </p>
        </div>

        <div className="pub-home-tab-list" role="tablist" aria-label="공개 홈 안내 섹션">
          {tabItems.map((tab) => (
            <button
              aria-controls={`home-tab-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className="pub-home-tab"
              id={`home-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pub-home-tab-panels">
          <div
            aria-labelledby="home-tab-tasks"
            className="pub-home-tab-panel"
            hidden={activeTab !== "tasks"}
            id="home-tab-panel-tasks"
            role="tabpanel"
          >
            <PublicMenuOverview />
          </div>
          <div
            aria-labelledby="home-tab-process"
            className="pub-home-tab-panel"
            hidden={activeTab !== "process"}
            id="home-tab-panel-process"
            role="tabpanel"
          >
            <ProcessGuideSection />
          </div>
          <div
            aria-labelledby="home-tab-feedback"
            className="pub-home-tab-panel"
            hidden={activeTab !== "feedback"}
            id="home-tab-panel-feedback"
            role="tabpanel"
          >
            <FeedbackPreview feedbacks={feedbacks} />
          </div>
          <div
            aria-labelledby="home-tab-eligibility"
            className="pub-home-tab-panel"
            hidden={activeTab !== "eligibility"}
            id="home-tab-panel-eligibility"
            role="tabpanel"
          >
            <EligibilitySection />
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicMenuOverview() {
  return (
    <section className="pub-section pub-section-alt" aria-labelledby="public-menu-title">
      <div className="pub-container">
        <div className="pub-section-head">
          <p className="pub-eyebrow">필요한 업무 선택</p>
          <h2 className="pub-section-title" id="public-menu-title">원하는 메뉴로 바로 이동하세요</h2>
          <p className="pub-section-desc">
            신청, 확인, 모집현황, 교육, 공지, 문의를 각각 별도 화면으로 엽니다.
          </p>
        </div>
        <div className="pub-menu-grid">
          {publicMenuItems.map((item) => (
            <Link className="pub-menu-card" href={item.href} key={item.id}>
              <span className="pub-menu-card-label">{item.label}</span>
              <span className="pub-menu-card-desc">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
