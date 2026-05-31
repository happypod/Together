"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  EDUCATION_STATUS_OPTIONS,
  NOTICE_TYPE_OPTIONS,
  type EducationApplicationRow,
  type PublicContentAdminView,
  type PublicContentNoticeRow,
} from "@/server/public/public-content-admin-service";
import {
  publicContentAdminAction,
  type PublicContentAdminFormState,
} from "@/app/admin/public-content/actions";

type PublicContentAdminWorkspaceProps = {
  notice?: string;
  view: PublicContentAdminView;
};

const initialState: PublicContentAdminFormState = {
  ok: false,
  message: "",
};

export function PublicContentAdminWorkspace({ notice, view }: PublicContentAdminWorkspaceProps) {
  const [state, formAction, pending] = useActionState(publicContentAdminAction, initialState);

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

      <section className="public-admin-summary-grid" aria-label="공개 홈 관리 요약">
        <SummaryCard label="공지사항" value={`${view.summary.noticeCount}건`} />
        <SummaryCard label="노출 중" value={`${view.summary.visibleNoticeCount}건`} tone="good" />
        <SummaryCard label="중요 공지" value={`${view.summary.pinnedNoticeCount}건`} tone="warn" />
        <SummaryCard label="교육 접수" value={`${view.summary.educationReceivedCount}건`} tone="good" />
        <SummaryCard label="교육 확정" value={`${view.summary.educationConfirmedCount}건`} />
        <SummaryCard label="교육 이수" value={`${view.summary.educationCompletedCount}건`} />
      </section>

      <div className="public-admin-grid">
        <section className="public-admin-panel" aria-labelledby="notice-create-title">
          <div className="section-header">
            <p className="eyebrow">메인 공지</p>
            <h2 id="notice-create-title">공지사항 작성</h2>
          </div>
          <NoticeForm
            canManage={view.canManageNotices}
            formAction={formAction}
            pending={pending}
          />
        </section>

        <section className="public-admin-panel" aria-labelledby="notice-list-title">
          <div className="section-header">
            <p className="eyebrow">공지 목록</p>
            <h2 id="notice-list-title">홈 화면 노출 관리</h2>
          </div>
          <div className="public-admin-card-list">
            {view.notices.length > 0 ? (
              view.notices.map((item) => (
                <NoticeCard
                  canManage={view.canManageNotices}
                  formAction={formAction}
                  key={item.id}
                  notice={item}
                  pending={pending}
                />
              ))
            ) : (
              <p className="request-empty">등록된 공지사항이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      <section className="public-admin-panel" aria-labelledby="education-applications-title">
        <div className="section-header">
          <p className="eyebrow">교육 신청</p>
          <h2 id="education-applications-title">참여자 교육 신청 접수 관리</h2>
        </div>
        <div className="public-admin-education-list">
          {view.educationApplications.length > 0 ? (
            view.educationApplications.map((application) => (
              <EducationApplicationCard
                application={application}
                canManage={view.canManageEducation}
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
    </div>
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

function NoticeForm({
  canManage,
  formAction,
  notice,
  pending,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  notice?: PublicContentNoticeRow;
  pending: boolean;
}) {
  const disabled = !canManage || pending;
  const formId = notice ? `notice-${notice.id}` : "notice-new";

  return (
    <form action={formAction} className="public-admin-form">
      <input name="intent" type="hidden" value="saveNotice" />
      <input name="noticeId" type="hidden" value={notice?.id ?? ""} />
      <label htmlFor={`${formId}-title`}>
        공지 제목
        <input
          defaultValue={notice?.title ?? ""}
          disabled={disabled}
          id={`${formId}-title`}
          maxLength={120}
          name="title"
          placeholder="예: 6월 공동예약 운영 안내"
          required
        />
      </label>
      <label htmlFor={`${formId}-type`}>
        공지 유형
        <select
          defaultValue={notice?.noticeType ?? "GENERAL"}
          disabled={disabled}
          id={`${formId}-type`}
          name="noticeType"
          required
        >
          {NOTICE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${formId}-content`}>
        공지 내용
        <textarea
          defaultValue={notice?.content ?? ""}
          disabled={disabled}
          id={`${formId}-content`}
          maxLength={1000}
          name="content"
          placeholder="공지 내용을 입력하세요."
          required
        />
      </label>
      <div className="public-admin-date-grid">
        <label htmlFor={`${formId}-start`}>
          노출 시작일
          <input
            defaultValue={notice?.startDate ?? ""}
            disabled={disabled}
            id={`${formId}-start`}
            name="startDate"
            type="date"
          />
        </label>
        <label htmlFor={`${formId}-end`}>
          노출 종료일
          <input
            defaultValue={notice?.endDate ?? ""}
            disabled={disabled}
            id={`${formId}-end`}
            name="endDate"
            type="date"
          />
        </label>
      </div>
      <div className="public-admin-check-grid">
        <label className="check-row" htmlFor={`${formId}-visible`}>
          <input
            defaultChecked={notice?.isVisible ?? true}
            disabled={disabled}
            id={`${formId}-visible`}
            name="isVisible"
            type="checkbox"
          />
          홈에 노출
        </label>
        <label className="check-row" htmlFor={`${formId}-pinned`}>
          <input
            defaultChecked={notice?.isPinned ?? false}
            disabled={disabled}
            id={`${formId}-pinned`}
            name="isPinned"
            type="checkbox"
          />
          중요 공지
        </label>
      </div>
      <button disabled={disabled} type="submit">
        <FaIcon name={notice ? "check" : "add"} />
        {notice ? "공지 저장" : "공지 등록"}
      </button>
    </form>
  );
}

function NoticeCard({
  canManage,
  formAction,
  notice,
  pending,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  notice: PublicContentNoticeRow;
  pending: boolean;
}) {
  return (
    <article className="public-admin-card">
      <div className="public-admin-card-head">
        <div>
          <span className="public-admin-badge">{notice.noticeTypeLabel}</span>
          <h3>{notice.title}</h3>
          <p>
            {notice.isVisible ? "노출 중" : "숨김"} · {notice.isPinned ? "중요 공지" : "일반 노출"}
          </p>
        </div>
        <small>{notice.updatedAt}</small>
      </div>
      <NoticeForm
        canManage={canManage}
        formAction={formAction}
        notice={notice}
        pending={pending}
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
        <input name="intent" type="hidden" value="updateEducationApplication" />
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
