import Link from "next/link";
import { FaIcon, type FontAwesomeIconName } from "@/components/ui/fa-icon";
import { PublicFooter } from "@/features/public-home/public-footer";
import { PublicHeader } from "@/features/public-home/public-header";
import { RequestCheckForm } from "@/features/public-home/request-check-form";
import { LinkerAssignmentForm } from "@/features/role-dashboards/linker-assignment-form";
import { MobileCheckTokenForm } from "@/features/role-dashboards/mobile-check-token-form";
import { PublicFeedbackForm } from "@/features/role-dashboards/public-feedback-form";
import {
  previewLinkers,
  previewTripGroups,
  type LinkerListItem,
  type TripGroupListItem,
} from "@/server/trips/trip-operation-service";
import { previewLinkerActivityStats } from "@/server/reports/linker-activity-statistics-service";
import {
  type CalendarEventItem,
  type CalendarMonthData,
} from "@/server/public/public-calendar-service";
import { type PublicEducationScheduleItem } from "@/server/public/education-schedule-service";
import {
  type PublicNoticeItem,
  type PublicOperationSummary,
  type PublicRecruitmentRow,
} from "@/server/public/public-home-service";
import { type OperatingSettings } from "@/server/settings/defaults";

type RoleDashboardKind = "resident" | "linker";

type RoleDashboardPageProps = {
  calendarMonths: CalendarMonthData[];
  educationSchedules: PublicEducationScheduleItem[];
  notices: PublicNoticeItem[];
  recruitmentRows: PublicRecruitmentRow[];
  role: RoleDashboardKind;
  settings: OperatingSettings;
  summary: PublicOperationSummary;
};

type MobilityDashboardItem = {
  canApply: boolean;
  date: string;
  id: string;
  memberCount: number;
  statusLabel: string;
  timeWindow: string;
  title: string;
};

const roleCopy = {
  resident: {
    badge: "주민",
    desc: "신청한 내역, 다가오는 예약과 교육, 개인 공지, 이용 데이터를 먼저 확인합니다.",
    eyebrow: "주민 현황",
    title: "내 이동과 교육 현황",
  },
  linker: {
    badge: "링커",
    desc: "동행링커 활동 준비, 교육 신청내역, 배정 이력, 동행 체크를 한 화면에서 확인합니다.",
    eyebrow: "동행링커 현황",
    title: "내 링커 활동 현황",
  },
} as const;

const NOTICE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "일반",
  OPERATION: "운영",
  PRIVACY: "개인정보",
  SAFETY: "안전",
};

export function RoleDashboardPage({
  calendarMonths,
  educationSchedules,
  notices,
  role,
  summary,
}: RoleDashboardPageProps) {
  const copy = roleCopy[role];
  const upcomingMobility = getUpcomingMobility(calendarMonths);
  const residentEducation = getEducationByType(educationSchedules, "collective");
  const linkerEducation = getEducationByType(educationSchedules, "linker-qualification");

  return (
    <div className="pub-shell role-dashboard-shell">
      <PublicHeader />
      <main className="role-dashboard-main" id="pub-main">
        <section className="role-dashboard-hero" aria-labelledby="role-dashboard-title">
          <div className="pub-container role-dashboard-hero-inner">
            <div className="role-dashboard-hero-copy">
              <p className="pub-eyebrow">{copy.eyebrow}</p>
              <h1 id="role-dashboard-title">{copy.title}</h1>
              <p>{copy.desc}</p>
            </div>
            <div className="role-dashboard-badge" aria-label={`${copy.badge} 전용 현황`}>
              {copy.badge}
            </div>
          </div>
        </section>

        <section className="role-dashboard-section role-dashboard-overview" aria-labelledby="role-overview-title">
          <div className="pub-container">
            <div className="role-section-head role-section-head--split">
              <div>
                <p className="pub-eyebrow">오늘 먼저 볼 것</p>
                <h2 id="role-overview-title">
                  {role === "resident" ? "내 신청과 다가오는 일정" : "내 활동 준비와 배정 흐름"}
                </h2>
              </div>
              <RoleQuickLinks role={role} />
            </div>
            <RoleOverviewCards
              educationCount={role === "resident" ? residentEducation.length : linkerEducation.length}
              mobilityCount={upcomingMobility.length}
              noticeCount={notices.length}
              role={role}
              summary={summary}
            />
          </div>
        </section>

        {role === "resident" ? (
          <ResidentDashboard
            educationSchedules={residentEducation}
            mobilityItems={upcomingMobility}
            notices={notices}
          />
        ) : (
          <LinkerDashboard
            educationSchedules={linkerEducation}
            mobilityItems={upcomingMobility}
            notices={notices}
          />
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

function RoleQuickLinks({ role }: { role: RoleDashboardKind }) {
  const links =
    role === "resident"
      ? [
          { href: "#resident-requests", label: "신청 내역" },
          { href: "#resident-upcoming", label: "예약·교육" },
          { href: "#resident-notices", label: "개인 공지" },
          { href: "#resident-data", label: "이용 데이터" },
        ]
      : [
          { href: "#linker-profile", label: "링커 상태" },
          { href: "#linker-education", label: "교육 내역" },
          { href: "#linker-history", label: "활동 이력" },
          { href: "#linker-check", label: "동행 체크" },
        ];

  return (
    <nav className="role-quick-links" aria-label="역할별 현황 바로가기">
      {links.map((link) => (
        <Link href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function RoleOverviewCards({
  educationCount,
  mobilityCount,
  noticeCount,
  role,
  summary,
}: {
  educationCount: number;
  mobilityCount: number;
  noticeCount: number;
  role: RoleDashboardKind;
  summary: PublicOperationSummary;
}) {
  const cards =
    role === "resident"
      ? [
          {
            desc: "이름과 연락처로 접수 상태를 확인합니다.",
            icon: "search" as const,
            label: "내 신청 조회",
            value: "바로 확인",
          },
          {
            desc: "이번 달 공개된 공동예약 이동 일정입니다.",
            icon: "calendarDay" as const,
            label: "다가오는 이동",
            value: `${mobilityCount}건`,
          },
          {
            desc: "집체교육 신청 가능 일정입니다.",
            icon: "checklist" as const,
            label: "교육 일정",
            value: `${educationCount}건`,
          },
          {
            desc: "참여 후 설문과 소감으로 누적됩니다.",
            icon: "heart" as const,
            label: "정서회복 기록",
            value: "설문 반영",
          },
        ]
      : [
          {
            desc: "교육, 실습, 서약, 보험 기준을 확인합니다.",
            icon: "resident" as const,
            label: "활동 준비",
            value: "점검",
          },
          {
            desc: "민간자격과정과 역량강화 교육입니다.",
            icon: "checklist" as const,
            label: "교육 신청",
            value: `${educationCount}건`,
          },
          {
            desc: "관리자 배정 기준의 이번 달 활동 수입니다.",
            icon: "car" as const,
            label: "월 배정",
            value: `${summary.linkerAssignedCount}건`,
          },
          {
            desc: "운영자가 보낸 모바일 체크 링크로 기록합니다.",
            icon: "clipboardList" as const,
            label: "동행 체크",
            value: "대기",
          },
        ];

  return (
    <div className="role-metric-grid" aria-label="역할별 핵심 현황">
      {cards.map((card) => (
        <RoleMetricCard
          desc={card.desc}
          icon={card.icon}
          key={card.label}
          label={card.label}
          value={card.value}
        />
      ))}
      <RoleMetricCard
        desc="운영자가 공개한 중요 알림만 먼저 보여줍니다."
        icon="admin"
        label="개인 공지"
        value={`${noticeCount}건`}
      />
    </div>
  );
}

function RoleMetricCard({
  desc,
  icon,
  label,
  value,
}: {
  desc: string;
  icon: FontAwesomeIconName;
  label: string;
  value: string;
}) {
  return (
    <article className="role-metric-card">
      <span className="role-metric-icon" aria-hidden="true">
        <FaIcon name={icon} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{desc}</span>
      </div>
    </article>
  );
}

function ResidentDashboard({
  educationSchedules,
  mobilityItems,
  notices,
}: {
  educationSchedules: PublicEducationScheduleItem[];
  mobilityItems: MobilityDashboardItem[];
  notices: PublicNoticeItem[];
}) {
  const recentParticipation = mobilityItems.slice(0, 3);

  return (
    <>
      <section className="role-dashboard-section" id="resident-requests" aria-labelledby="resident-requests-title">
        <div className="pub-container role-dashboard-two-col">
          <div className="role-dashboard-panel">
            <div className="role-section-head">
              <p className="pub-eyebrow">신청한 내역</p>
              <h2 id="resident-requests-title">내 신청 상태를 먼저 확인하세요</h2>
              <p>
                접수번호를 몰라도 이름, 연락처, 희망일로 신청 상태를 확인할 수 있습니다.
              </p>
            </div>
            <RequestCheckForm />
          </div>
          <DashboardGuidePanel
            ctaHref="/public/apply"
            ctaLabel="새 이동 신청"
            icon="clipboardList"
            items={[
              "신청접수, 그룹확정, 링커확정, 택시확정 상태를 순서대로 확인합니다.",
              "민감정보는 입력하지 않고 이동에 필요한 날짜와 장소만 확인합니다.",
              "교육 이수 여부는 주민 등록과 실제 이용 가능 여부 확인에 활용됩니다.",
            ]}
            title="신청 확인 기준"
          />
        </div>
      </section>

      <section className="role-dashboard-section role-dashboard-soft" id="resident-upcoming" aria-labelledby="resident-upcoming-title">
        <div className="pub-container">
          <div className="role-section-head">
            <p className="pub-eyebrow">다가오는 예약과 교육</p>
            <h2 id="resident-upcoming-title">이동 일정과 집체교육을 함께 확인하세요</h2>
          </div>
          <div className="role-dashboard-two-col">
            <MobilityMiniList headingId="resident-mobility-list" items={mobilityItems} title="다가오는 이동 예약" />
            <EducationMiniList
              ctaHref="/public/education"
              headingId="resident-education-list"
              items={educationSchedules}
              title="주민 집체교육 신청내역"
            />
          </div>
        </div>
      </section>

      <section className="role-dashboard-section" id="resident-notices" aria-labelledby="resident-notices-title">
        <div className="pub-container">
          <div className="role-section-head">
            <p className="pub-eyebrow">개인 공지</p>
            <h2 id="resident-notices-title">나에게 필요한 운영 알림</h2>
          </div>
          <NoticeMiniList notices={notices} />
        </div>
      </section>

      <section className="role-dashboard-section role-dashboard-soft" id="resident-data" aria-labelledby="resident-data-title">
        <div className="pub-container role-dashboard-two-col">
          <div className="role-dashboard-panel">
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">이용 데이터</p>
              <h2 id="resident-data-title">참여 내역과 정서회복 기록</h2>
              <p>
                실제 참여 후 설문과 소감이 쌓이면 이동 참여, 만족도, 정서회복 흐름을 확인합니다.
              </p>
            </div>
            <ResidentDataPanel participationItems={recentParticipation} />
          </div>
          <div className="role-dashboard-panel">
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">소감 기록</p>
              <h2>이용 후 느낀 점을 남겨 주세요</h2>
            </div>
            <PublicFeedbackForm defaultRoleLabel="주민" sourceType="RESIDENT" />
          </div>
        </div>
      </section>
    </>
  );
}

function LinkerDashboard({
  educationSchedules,
  mobilityItems,
  notices,
}: {
  educationSchedules: PublicEducationScheduleItem[];
  mobilityItems: MobilityDashboardItem[];
  notices: PublicNoticeItem[];
}) {
  const primaryLinker = previewLinkers[0];
  const activityRow = previewLinkerActivityStats.rows[0];
  const assignments = activityRow?.assignments ?? [];

  return (
    <>
      <section className="role-dashboard-section" id="linker-profile" aria-labelledby="linker-profile-title">
        <div className="pub-container">
          <div className="role-section-head">
            <p className="pub-eyebrow">링커 상태</p>
            <h2 id="linker-profile-title">관리자 기준의 활동 준비 내용을 확인하세요</h2>
          </div>
          <div className="role-dashboard-two-col">
            <LinkerProfileCard linker={primaryLinker} />
            <DashboardGuidePanel
              ctaHref="#linker-check"
              ctaLabel="동행 체크 진행"
              icon="checklist"
              items={[
                "민간자격과정 이수 후 동행자격과 취업연계 검토가 진행됩니다.",
                "교육, 현장실습, 개인정보보호 서약, 보험 등록이 완료되어야 배정 가능합니다.",
                "운영자가 보낸 모바일 체크 링크로 탑승, 도착, 귀가확인을 기록합니다.",
              ]}
              title="배정 가능 기준"
            />
          </div>
        </div>
      </section>

      <section className="role-dashboard-section role-dashboard-soft" id="linker-education" aria-labelledby="linker-education-title">
        <div className="pub-container role-dashboard-two-col">
          <div>
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">교육 신청내역</p>
              <h2 id="linker-education-title">민간자격과정과 역량강화 교육</h2>
              <p>
                동행링커는 별도 교육과정을 이수해야 동행자격과 취업연계 지원 대상이 됩니다.
              </p>
            </div>
            <EducationMiniList
              ctaHref="/public/education"
              headingId="linker-education-list"
              items={educationSchedules}
              title="다가오는 링커 교육"
            />
          </div>
          <LinkerEducationStatusCard linker={primaryLinker} />
        </div>
      </section>

      <section className="role-dashboard-section" id="linker-history" aria-labelledby="linker-history-title">
        <div className="pub-container">
          <div className="role-section-head">
            <p className="pub-eyebrow">과거 참여 활동내역</p>
            <h2 id="linker-history-title">배정 이력과 활동 데이터를 확인하세요</h2>
          </div>
          <div className="role-dashboard-two-col">
            <LinkerActivityHistory
              assignments={assignments}
              completedTripCount={activityRow?.completedTripCount ?? 0}
              monthlyAssignmentCount={activityRow?.monthlyAssignmentCount ?? 0}
              satisfaction={activityRow?.averageSatisfaction ?? null}
            />
            <LinkerUpcomingPanel groups={previewTripGroups} mobilityItems={mobilityItems} />
          </div>
        </div>
      </section>

      <section className="role-dashboard-section role-dashboard-soft" id="linker-check" aria-labelledby="linker-check-title">
        <div className="pub-container role-dashboard-two-col">
          <div className="role-dashboard-panel">
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">동행 체크</p>
              <h2 id="linker-check-title">운영자가 보낸 체크 링크를 입력하세요</h2>
            </div>
            <MobileCheckTokenForm />
          </div>
          <div className="role-dashboard-panel">
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">배정 희망</p>
              <h2>활동 가능 시간과 희망을 남기세요</h2>
            </div>
            <LinkerAssignmentForm />
          </div>
        </div>
      </section>

      <section className="role-dashboard-section" id="linker-notices" aria-labelledby="linker-notices-title">
        <div className="pub-container role-dashboard-two-col">
          <div>
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">개인 공지</p>
              <h2 id="linker-notices-title">활동 전 확인할 알림</h2>
            </div>
            <NoticeMiniList notices={notices} />
          </div>
          <div>
            <div className="role-section-head role-section-head--left">
              <p className="pub-eyebrow">활동 소감</p>
              <h2>동행 활동 소감을 남겨 주세요</h2>
            </div>
            <PublicFeedbackForm defaultRoleLabel="동행링커" sourceType="LINKER" />
          </div>
        </div>
      </section>
    </>
  );
}

function DashboardGuidePanel({
  ctaHref,
  ctaLabel,
  icon,
  items,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  icon: FontAwesomeIconName;
  items: string[];
  title: string;
}) {
  return (
    <aside className="role-guide-panel">
      <span className="role-guide-icon" aria-hidden="true">
        <FaIcon name={icon} />
      </span>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Link className="role-panel-link" href={ctaHref}>
        {ctaLabel}
      </Link>
    </aside>
  );
}

function MobilityMiniList({
  headingId,
  items,
  title,
}: {
  headingId: string;
  items: MobilityDashboardItem[];
  title: string;
}) {
  return (
    <section className="role-list-panel" aria-labelledby={headingId}>
      <div className="role-list-head">
        <h3 id={headingId}>{title}</h3>
        <Link href="/public/schedule">전체 보기</Link>
      </div>
      {items.length > 0 ? (
        <ul className="role-timeline-list">
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <time dateTime={item.date}>{formatShortDate(item.date)}</time>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.timeWindow} · {item.statusLabel} · {item.memberCount}명
                </span>
              </div>
              {item.canApply ? <mark>신청 가능</mark> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="role-empty">다가오는 이동 예약이 없습니다.</p>
      )}
    </section>
  );
}

function EducationMiniList({
  ctaHref,
  headingId,
  items,
  title,
}: {
  ctaHref: string;
  headingId: string;
  items: PublicEducationScheduleItem[];
  title: string;
}) {
  return (
    <section className="role-list-panel" aria-labelledby={headingId}>
      <div className="role-list-head">
        <h3 id={headingId}>{title}</h3>
        <Link href={ctaHref}>신청하기</Link>
      </div>
      {items.length > 0 ? (
        <ul className="role-timeline-list">
          {items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <time dateTime={item.date}>{formatShortDate(item.date)}</time>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.time} · {item.place}
                </span>
              </div>
              <mark>{item.status}</mark>
            </li>
          ))}
        </ul>
      ) : (
        <p className="role-empty">확인 가능한 교육 일정이 없습니다.</p>
      )}
    </section>
  );
}

function NoticeMiniList({ notices }: { notices: PublicNoticeItem[] }) {
  return notices.length > 0 ? (
    <div className="role-notice-grid">
      {notices.slice(0, 3).map((notice) => (
        <article className="role-notice-card" key={notice.id}>
          <div>
            <span>{NOTICE_TYPE_LABELS[notice.noticeType] ?? "공지"}</span>
            {notice.isPinned ? <mark>중요</mark> : null}
          </div>
          <h3>{notice.title}</h3>
          <p>{notice.content}</p>
        </article>
      ))}
    </div>
  ) : (
    <p className="role-empty">확인할 공지가 없습니다.</p>
  );
}

function ResidentDataPanel({
  participationItems,
}: {
  participationItems: MobilityDashboardItem[];
}) {
  return (
    <div className="role-data-panel">
      <div className="role-data-grid">
        <DataTile label="참여 내역" value={`${participationItems.length}건`} />
        <DataTile label="정서회복 기록" value="설문 후 누적" />
        <DataTile label="재이용 의향" value="소감 반영" />
      </div>
      <div className="role-list-panel role-list-panel--flat">
        <div className="role-list-head">
          <h3>최근 참여 흐름</h3>
        </div>
        {participationItems.length > 0 ? (
          <ul className="role-timeline-list">
            {participationItems.map((item) => (
              <li key={`resident-data-${item.id}`}>
                <time dateTime={item.date}>{formatShortDate(item.date)}</time>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.statusLabel}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="role-empty">참여 후 이용 데이터가 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

function DataTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="role-data-tile">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function LinkerProfileCard({ linker }: { linker?: LinkerListItem }) {
  if (!linker) {
    return <p className="role-empty">동행링커 활동 정보가 없습니다.</p>;
  }

  return (
    <article className="role-linker-profile">
      <div className="role-linker-profile-head">
        <div>
          <span>내 링커 정보</span>
          <h3>{linker.name}</h3>
          <p>
            {linker.villageName} · {linker.phoneMasked}
          </p>
        </div>
        <mark data-ready={linker.readyForAssignment}>{linker.statusLabel}</mark>
      </div>
      <dl className="role-info-grid">
        <div>
          <dt>배정 가능</dt>
          <dd>{linker.readyForAssignment ? "가능" : "준비 필요"}</dd>
        </div>
        <div>
          <dt>활동 횟수</dt>
          <dd>{linker.activityCount}회</dd>
        </div>
        <div>
          <dt>가능 요일</dt>
          <dd>{linker.availableDays.join(", ") || "미입력"}</dd>
        </div>
        <div>
          <dt>가능 시간</dt>
          <dd>{linker.availableTimeWindows.join(", ") || "미입력"}</dd>
        </div>
      </dl>
      <ul className="role-check-list" aria-label={`${linker.name} 활동 준비`}>
        <CheckItem checked={linker.trainingCompleted} label="교육 이수" />
        <CheckItem checked={linker.fieldPracticeCompleted} label="현장실습" />
        <CheckItem checked={linker.privacyPledgeSigned} label="개인정보보호 서약" />
        <CheckItem checked={linker.insuranceRegistered} label="보험 등록" />
      </ul>
    </article>
  );
}

function LinkerEducationStatusCard({ linker }: { linker?: LinkerListItem }) {
  return (
    <article className="role-list-panel">
      <div className="role-list-head">
        <h3>교육 신청·이수 상태</h3>
      </div>
      <ul className="role-check-list role-check-list--stack">
        <CheckItem checked={Boolean(linker?.trainingCompleted)} label="동행링커 기본교육 이수" />
        <CheckItem checked={Boolean(linker?.fieldPracticeCompleted)} label="현장실습 이수" />
        <CheckItem checked={Boolean(linker?.wantsJobConnection)} label="취업연계 희망 등록" />
      </ul>
      <p className="role-help-text">
        교육 신청 접수와 이수 상태는 운영자가 확인한 뒤 배정 가능 여부와 취업연계 상담에 반영합니다.
      </p>
    </article>
  );
}

function LinkerActivityHistory({
  assignments,
  completedTripCount,
  monthlyAssignmentCount,
  satisfaction,
}: {
  assignments: {
    destinationSummary: string;
    groupName: string;
    id: string;
    memberCount: number;
    serviceDate: string;
    statusLabel: string;
  }[];
  completedTripCount: number;
  monthlyAssignmentCount: number;
  satisfaction: number | null;
}) {
  return (
    <article className="role-data-panel">
      <div className="role-data-grid">
        <DataTile label="이번 달 배정" value={`${monthlyAssignmentCount}건`} />
        <DataTile label="완료 활동" value={`${completedTripCount}건`} />
        <DataTile label="만족도" value={satisfaction ? `${satisfaction.toFixed(1)}점` : "수집 전"} />
      </div>
      <div className="role-list-panel role-list-panel--flat">
        <div className="role-list-head">
          <h3>최근 활동 내역</h3>
        </div>
        {assignments.length > 0 ? (
          <ul className="role-timeline-list">
            {assignments.slice(0, 4).map((assignment) => (
              <li key={assignment.id}>
                <time dateTime={assignment.serviceDate}>{formatShortDate(assignment.serviceDate)}</time>
                <div>
                  <strong>{assignment.destinationSummary}</strong>
                  <span>
                    {assignment.groupName} · {assignment.memberCount}명 · {assignment.statusLabel}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="role-empty">아직 기록된 활동 이력이 없습니다.</p>
        )}
      </div>
    </article>
  );
}

function LinkerUpcomingPanel({
  groups,
  mobilityItems,
}: {
  groups: TripGroupListItem[];
  mobilityItems: MobilityDashboardItem[];
}) {
  const group = groups[0];

  return (
    <article className="role-list-panel">
      <div className="role-list-head">
        <h3>다가오는 배정</h3>
        <Link href="#linker-check">체크 입력</Link>
      </div>
      {group ? (
        <div className="role-assignment-card">
          <span>{group.statusLabel}</span>
          <h4>{group.groupName}</h4>
          <dl className="role-info-grid role-info-grid--compact">
            <div>
              <dt>운행일</dt>
              <dd>{formatShortDate(group.serviceDate)}</dd>
            </div>
            <div>
              <dt>시간대</dt>
              <dd>{group.timeWindow}</dd>
            </div>
            <div>
              <dt>목적지</dt>
              <dd>{group.destinationSummary}</dd>
            </div>
            <div>
              <dt>다음 기록</dt>
              <dd>{group.nextActionLabel}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <MobilityMiniList headingId="linker-public-mobility-list" items={mobilityItems} title="공개 이동 일정" />
      )}
    </article>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li data-ok={checked}>
      <FaIcon name={checked ? "check" : "warning"} />
      {label}
    </li>
  );
}

function getUpcomingMobility(months: CalendarMonthData[]): MobilityDashboardItem[] {
  const today = new Date().toISOString().slice(0, 10);

  return months
    .flatMap((month) =>
      Object.values(month.byDate).flatMap((day) =>
        day.events.map((event) => toMobilityDashboardItem(day.dateKey, event)),
      ),
    )
    .filter((item) => item.date >= today)
    .sort((left, right) => `${left.date}-${left.timeWindow}`.localeCompare(`${right.date}-${right.timeWindow}`))
    .slice(0, 6);
}

function toMobilityDashboardItem(date: string, event: CalendarEventItem): MobilityDashboardItem {
  return {
    canApply: event.canApply,
    date,
    id: `${date}-${event.groupId}`,
    memberCount: event.memberCount,
    statusLabel: event.statusLabel,
    timeWindow: event.timeWindow,
    title: `${event.directionLabel} · ${event.purposeLabel}`,
  };
}

function getEducationByType(
  schedules: PublicEducationScheduleItem[],
  courseType: PublicEducationScheduleItem["courseType"],
) {
  const today = new Date().toISOString().slice(0, 10);
  return schedules
    .filter((schedule) => schedule.courseType === courseType && schedule.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  if (!month || !day) {
    return date;
  }
  return `${Number(month)}월 ${Number(day)}일`;
}
