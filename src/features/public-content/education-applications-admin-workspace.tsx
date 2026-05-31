"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import {
  EDUCATION_STATUS_OPTIONS,
  type EducationApplicationRow,
  type EducationApplicationsAdminView,
} from "@/server/public/public-content-admin-service";
import { type EducationScheduleAdminRow } from "@/server/public/education-schedule-service";
import {
  educationApplicationsAdminAction,
  type EducationApplicationsAdminFormState,
} from "@/app/admin/education-applications/actions";

type EducationApplicationsAdminWorkspaceProps = {
  notice?: string;
  view: EducationApplicationsAdminView;
};

const initialState: EducationApplicationsAdminFormState = {
  ok: false,
  message: "",
};

const EDUCATION_COURSE_OPTIONS = [
  { value: "COLLECTIVE", label: "집체교육" },
  { value: "LINKER_QUALIFICATION", label: "민간자격과정" },
] as const;

const EDUCATION_SCHEDULE_STATUS_OPTIONS = [
  { value: "OPEN", label: "접수 중" },
  { value: "PRE_APPLY", label: "사전 신청" },
  { value: "CLOSED", label: "마감" },
  { value: "COMPLETED", label: "완료" },
] as const;

export function EducationApplicationsAdminWorkspace({
  notice,
  view,
}: EducationApplicationsAdminWorkspaceProps) {
  const [state, formAction, pending] = useActionState(
    educationApplicationsAdminAction,
    initialState,
  );
  const tabs: TabItem[] = [
    {
      id: "applications",
      label: "신청 접수",
      icon: "checklist",
      badge: view.educationApplications.length,
      content: (
        <EducationApplicationsPanel
          applications={view.educationApplications}
          canManage={view.canManageEducation}
          formAction={formAction}
          pending={pending}
        />
      ),
    },
    {
      id: "schedules",
      label: "일정 목록",
      icon: "calendar",
      badge: view.educationSchedules.length,
      content: (
        <EducationScheduleListPanel
          canManage={view.canManageEducation}
          formAction={formAction}
          pending={pending}
          schedules={view.educationSchedules}
        />
      ),
    },
    {
      id: "schedule-new",
      label: "일정 입력",
      icon: "add",
      content: (
        <EducationScheduleCreatePanel
          canManage={view.canManageEducation}
          formAction={formAction}
          pending={pending}
        />
      ),
    },
  ];

  return (
    <div className="public-admin-workspace">
      {notice ? (
        <p className="request-notice" role="status">
          {notice}
        </p>
      ) : null}
      {state.message ? (
        <p className={state.ok ? "form-message success" : "form-message"} role="status">
          {state.message}
        </p>
      ) : null}

      <section
        className="public-admin-summary-grid public-admin-summary-grid--compact"
        aria-label="교육 신청 관리 요약"
      >
        <SummaryCard label="교육 일정" value={`${view.summary.educationScheduleCount}건`} />
        <SummaryCard label="공개 일정" value={`${view.summary.educationScheduleVisibleCount}건`} tone="good" />
        <SummaryCard label="교육 접수" value={`${view.summary.educationReceivedCount}건`} tone="good" />
        <SummaryCard label="교육 확정" value={`${view.summary.educationConfirmedCount}건`} />
        <SummaryCard label="교육 이수" value={`${view.summary.educationCompletedCount}건`} />
        <SummaryCard label="취소" value={`${view.summary.educationCanceledCount}건`} tone="warn" />
      </section>

      <Tabs ariaLabel="교육 신청 관리 상세 메뉴" defaultTabId="applications" tabs={tabs} />
    </div>
  );
}

function EducationScheduleCreatePanel({
  canManage,
  formAction,
  pending,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <section className="public-admin-panel" aria-labelledby="education-schedule-create-title">
      <div className="section-header">
        <p className="eyebrow">교육 일정</p>
        <h2 id="education-schedule-create-title">교육 일정 입력</h2>
        <p>새 집체교육 또는 동행링커 민간자격과정 일정을 등록합니다.</p>
      </div>
      <EducationScheduleForm
        canManage={canManage}
        formAction={formAction}
        pending={pending}
      />
    </section>
  );
}

function EducationScheduleListPanel({
  canManage,
  formAction,
  pending,
  schedules,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  schedules: EducationScheduleAdminRow[];
}) {
  return (
    <section className="public-admin-panel" aria-labelledby="education-schedule-list-title">
      <div className="section-header">
        <p className="eyebrow">교육 일정 목록</p>
        <h2 id="education-schedule-list-title">공개 교육 일정 관리</h2>
        <p>공개 홈과 주민·링커 대시보드에 노출될 교육 일정을 정돈합니다.</p>
      </div>
      <div className="public-admin-card-list">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <EducationScheduleCard
              canManage={canManage}
              formAction={formAction}
              key={schedule.id}
              pending={pending}
              schedule={schedule}
            />
          ))
        ) : (
          <p className="request-empty">등록된 교육 일정이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function EducationApplicationsPanel({
  applications,
  canManage,
  formAction,
  pending,
}: {
  applications: EducationApplicationRow[];
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <section className="public-admin-panel" aria-labelledby="education-applications-title">
      <div className="section-header">
        <p className="eyebrow">교육 신청</p>
        <h2 id="education-applications-title">참여자 교육 신청 접수 관리</h2>
        <p>신청자별 접수, 확정, 이수, 취소 상태와 운영 메모를 상세 카드에서 관리합니다.</p>
      </div>
      <div className="public-admin-education-list">
        {applications.length > 0 ? (
          applications.map((application) => (
            <EducationApplicationCard
              application={application}
              canManage={canManage}
              formAction={formAction}
              key={application.id}
              pending={pending}
            />
          ))
        ) : (
          <p className="request-empty">접수된 교육 신청이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <article className="public-admin-summary-card" data-tone={tone}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function EducationScheduleForm({
  canManage,
  formAction,
  pending,
  schedule,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  schedule?: EducationScheduleAdminRow;
}) {
  const disabled = !canManage || pending;
  const formId = schedule ? `education-schedule-${schedule.id}` : "education-schedule-new";

  return (
    <form action={formAction} className="public-admin-form">
      <input name="intent" type="hidden" value="saveSchedule" />
      <input name="scheduleId" type="hidden" value={schedule?.id ?? ""} />
      <label htmlFor={`${formId}-course`}>
        교육 과정
        <select
          defaultValue={schedule?.courseType ?? "COLLECTIVE"}
          disabled={disabled}
          id={`${formId}-course`}
          name="courseType"
          required
        >
          {EDUCATION_COURSE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${formId}-title`}>
        교육 제목
        <input
          defaultValue={schedule?.title ?? ""}
          disabled={disabled}
          id={`${formId}-title`}
          maxLength={120}
          name="title"
          placeholder="예: 소원권역 동행이동 OS 집체교육"
          required
        />
      </label>
      <div className="public-admin-date-grid">
        <label htmlFor={`${formId}-date`}>
          교육일자
          <input
            defaultValue={schedule?.scheduleDate ?? ""}
            disabled={disabled}
            id={`${formId}-date`}
            name="scheduleDate"
            type="date"
            required
          />
        </label>
        <label htmlFor={`${formId}-time`}>
          교육 시간
          <input
            defaultValue={schedule?.time ?? ""}
            disabled={disabled}
            id={`${formId}-time`}
            maxLength={80}
            name="time"
            placeholder="오전 10:00"
            required
          />
        </label>
      </div>
      <label htmlFor={`${formId}-target`}>
        교육 대상
        <input
          defaultValue={schedule?.target ?? ""}
          disabled={disabled}
          id={`${formId}-target`}
          maxLength={120}
          name="target"
          placeholder="주민, 보호자, 동행자"
          required
        />
      </label>
      <label htmlFor={`${formId}-place`}>
        교육 장소
        <input
          defaultValue={schedule?.place ?? ""}
          disabled={disabled}
          id={`${formId}-place`}
          maxLength={120}
          name="place"
          placeholder="소원권역 커뮤니티센터"
          required
        />
      </label>
      <label htmlFor={`${formId}-status`}>
        공개 상태
        <select
          defaultValue={schedule?.status ?? "OPEN"}
          disabled={disabled}
          id={`${formId}-status`}
          name="status"
          required
        >
          {EDUCATION_SCHEDULE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="public-admin-check-grid">
        <label className="check-row" htmlFor={`${formId}-visible`}>
          <input
            defaultChecked={schedule?.isVisible ?? true}
            disabled={disabled}
            id={`${formId}-visible`}
            name="isVisible"
            type="checkbox"
          />
          공개 홈에 노출
        </label>
      </div>
      <button disabled={disabled} type="submit">
        <FaIcon name={schedule ? "check" : "calendar"} />
        {schedule ? "교육 일정 저장" : "교육 일정 등록"}
      </button>
    </form>
  );
}

function EducationScheduleCard({
  canManage,
  formAction,
  pending,
  schedule,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  schedule: EducationScheduleAdminRow;
}) {
  return (
    <article className="public-admin-card">
      <div className="public-admin-card-head">
        <div>
          <span className="public-admin-badge">{schedule.courseTypeLabel}</span>
          <h3>{schedule.title}</h3>
          <p>
            {schedule.scheduleDate} · {schedule.time} · {schedule.isVisible ? "공개" : "숨김"}
          </p>
        </div>
        <mark data-status={schedule.status}>{schedule.publicStatusLabel}</mark>
      </div>
      <dl className="public-admin-meta-grid">
        <div>
          <dt>대상</dt>
          <dd>{schedule.target}</dd>
        </div>
        <div>
          <dt>장소</dt>
          <dd>{schedule.place}</dd>
        </div>
        <div>
          <dt>작성자</dt>
          <dd>{schedule.createdByName}</dd>
        </div>
        <div>
          <dt>수정일</dt>
          <dd>{schedule.updatedAt}</dd>
        </div>
      </dl>
      <EducationScheduleForm
        canManage={canManage}
        formAction={formAction}
        pending={pending}
        schedule={schedule}
      />
    </article>
  );
}

function EducationApplicationCard({
  application,
  canManage,
  formAction,
  pending,
}: {
  application: EducationApplicationRow;
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const disabled = !canManage || pending;
  const formId = `education-${application.id}`;

  return (
    <article className="public-admin-education-card">
      <div className="public-admin-card-head">
        <div>
          <span className="public-admin-badge">{application.receiptCode}</span>
          <h3>{application.participantName}</h3>
          <p>
            {application.courseTypeLabel} · {application.participantTypeLabel} · {application.preferredDate}
          </p>
        </div>
        <mark data-status={application.status}>{application.statusLabel}</mark>
      </div>
      <dl className="public-admin-meta-grid">
        <div>
          <dt>마을</dt>
          <dd>{application.villageName || "미입력"}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{application.phoneMasked}</dd>
        </div>
        <div>
          <dt>접수일</dt>
          <dd>{application.createdAt}</dd>
        </div>
        <div>
          <dt>처리자</dt>
          <dd>{application.handledByName || "미처리"}</dd>
        </div>
      </dl>
      {application.notes ? <p className="public-admin-note">{application.notes}</p> : null}
      <form action={formAction} className="public-admin-inline-form">
        <input name="intent" type="hidden" value="updateApplication" />
        <input name="applicationId" type="hidden" value={application.id} />
        <label htmlFor={`${formId}-status`}>
          처리 상태
          <select
            defaultValue={application.status}
            disabled={disabled}
            id={`${formId}-status`}
            name="status"
          >
            {EDUCATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${formId}-memo`}>
          처리 메모
          <textarea
            defaultValue={application.operatorMemo}
            disabled={disabled}
            id={`${formId}-memo`}
            maxLength={500}
            name="operatorMemo"
            placeholder="교육일 확정, 안내 완료 등 운영 메모"
          />
        </label>
        <button disabled={disabled} type="submit">
          <FaIcon name="check" />
          상태 저장
        </button>
      </form>
    </article>
  );
}
