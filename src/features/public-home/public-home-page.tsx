import { ContactSection } from "@/features/public-home/contact-section";
import { EducationSection } from "@/features/public-home/education-section";
import { HeroSection } from "@/features/public-home/hero-section";
import { MobileStickyCta } from "@/features/public-home/mobile-sticky-cta";
import { NoticeList } from "@/features/public-home/notice-list";
import { OperationSummaryCards } from "@/features/public-home/operation-summary-cards";
import { PublicCalendar } from "@/features/public-home/public-calendar";
import { PublicFooter } from "@/features/public-home/public-footer";
import { PublicHeader } from "@/features/public-home/public-header";
import { PublicHomeTabs } from "@/features/public-home/public-home-tabs";
import { type PublicMenuId } from "@/features/public-home/public-menu";
import { QuickRequestForm } from "@/features/public-home/quick-request-form";
import { RequestCheckForm } from "@/features/public-home/request-check-form";
import { WeeklyRecruitmentList } from "@/features/public-home/weekly-recruitment-list";
import {
  type PublicFeedbackItem,
  type PublicNoticeItem,
  type PublicOperationSummary,
  type PublicRecruitmentRow,
} from "@/server/public/public-home-service";
import { type CalendarMonthData } from "@/server/public/public-calendar-service";
import { type OperatingSettings } from "@/server/settings/defaults";

type PublicHomePageProps = {
  summary: PublicOperationSummary;
  recruitmentRows: PublicRecruitmentRow[];
  notices: PublicNoticeItem[];
  feedbacks: PublicFeedbackItem[];
  calendarMonths: CalendarMonthData[];
  activeMenuId?: PublicMenuId;
  settings: OperatingSettings;
};

export function PublicHomePage({
  activeMenuId,
  summary,
  recruitmentRows,
  notices,
  feedbacks,
  calendarMonths,
  settings,
}: PublicHomePageProps) {
  return (
    <div className="pub-shell">
      <PublicHeader activeMenuId={activeMenuId} />

      <main id="pub-main">
        {activeMenuId ? (
          renderPublicDetail(activeMenuId, {
            calendarMonths,
            feedbacks,
            notices,
            recruitmentRows,
            settings,
          })
        ) : (
          <>
            <HeroSection />
            <OperationSummaryCards summary={summary} />
            {/* 운영 현황 캘린더 — 월·주·일 전환 */}
            <section className="pub-section pub-section-calendar" aria-labelledby="cal-home-title">
              <div className="pub-container">
                <div className="pub-section-head">
                  <p className="pub-eyebrow">운영 캘린더</p>
                  <h2 className="pub-section-title" id="cal-home-title">날짜별 이동 일정 현황</h2>
                  <p className="pub-section-desc">
                    날짜를 선택하면 그 날의 이동 일정을 확인할 수 있습니다.
                    개인정보는 표시되지 않습니다.
                  </p>
                </div>
                <PublicCalendar applyHref="/public/apply" months={calendarMonths} />
              </div>
            </section>
            <PublicHomeTabs feedbacks={feedbacks} />
          </>
        )}
      </main>

      <MobileStickyCta />
      <PublicFooter />
    </div>
  );
}

type PublicDetailRenderProps = Pick<
  PublicHomePageProps,
  "feedbacks" | "notices" | "recruitmentRows" | "settings" | "calendarMonths"
>;

function renderPublicDetail(
  activeMenuId: PublicMenuId,
  { notices, recruitmentRows, settings, calendarMonths }: PublicDetailRenderProps,
) {
  switch (activeMenuId) {
    case "apply":
      return <ApplySection calendarMonths={calendarMonths} villages={settings.villages} />;
    case "check":
      return <CheckSection />;
    case "schedule":
      return <WeeklyRecruitmentList rows={recruitmentRows} />;
    case "education":
      return <EducationSection />;
    case "notice":
      return <NoticeList notices={notices} />;
    case "contact":
      return <ContactSection />;
    default:
      return null;
  }
}

function ApplySection({
  villages,
  calendarMonths,
}: {
  villages: string[];
  calendarMonths: CalendarMonthData[];
}) {
  return (
    <>
      {/* 신청 참고용 운영 캘린더 */}
      <section
        className="pub-section pub-section-calendar"
        aria-labelledby="apply-cal-title"
      >
        <div className="pub-container">
          <div className="pub-section-head">
            <p className="pub-eyebrow">신청 전 참고</p>
            <h2 className="pub-section-title" id="apply-cal-title">날짜를 먼저 확인하세요</h2>
            <p className="pub-section-desc">
              초록 날짜는 신청을 받고 있는 날입니다. 날짜를 선택하면 상세 일정을 볼 수 있습니다.
            </p>
          </div>
          <PublicCalendar applyHref="#apply-form" months={calendarMonths} />
        </div>
      </section>

      {/* 신청 폼 */}
      <section
        className="pub-section pub-section-form pub-detail-section"
        id="apply-form"
        aria-labelledby="apply-title"
      >
        <div className="pub-container pub-container--narrow">
          <div className="pub-section-head">
            <p className="pub-eyebrow">공동예약 신청</p>
            <h2 className="pub-section-title" id="apply-title">지금 신청할 수 있습니다</h2>
            <p className="pub-section-desc">
              주민 본인 또는 보호자가 대신 신청할 수 있습니다.
              병명·진료 내용·주민등록번호는 입력하지 않습니다.
            </p>
          </div>
          <QuickRequestForm villages={villages} />
        </div>
      </section>
    </>
  );
}

function CheckSection() {
  return (
    <section
      className="pub-section pub-section-alt pub-section-form pub-detail-section"
      id="check"
      aria-labelledby="check-title"
    >
      <div className="pub-container pub-container--narrow">
        <div className="pub-section-head">
          <p className="pub-eyebrow">내 신청 확인</p>
          <h2 className="pub-section-title" id="check-title">신청 상태를 확인하세요</h2>
          <p className="pub-section-desc">
            신청 시 입력한 이름·연락처 뒷자리·희망일로 현재 상태를 확인합니다.
          </p>
        </div>
        <RequestCheckForm />
      </div>
    </section>
  );
}
