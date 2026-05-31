"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  NOTICE_TYPE_OPTIONS,
  type NoticeAdminView,
  type PublicContentNoticeRow,
} from "@/server/public/public-content-admin-service";
import {
  noticeAdminAction,
  type NoticeAdminFormState,
} from "@/app/admin/notices/actions";

type NoticeAdminWorkspaceProps = {
  notice?: string;
  view: NoticeAdminView;
};

const initialState: NoticeAdminFormState = {
  ok: false,
  message: "",
};

export function NoticeAdminWorkspace({ notice, view }: NoticeAdminWorkspaceProps) {
  const [state, formAction, pending] = useActionState(noticeAdminAction, initialState);

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
        aria-label="공지사항 관리 요약"
      >
        <SummaryCard label="전체 공지" value={`${view.summary.noticeCount}건`} />
        <SummaryCard label="노출 중" value={`${view.summary.visibleNoticeCount}건`} tone="good" />
        <SummaryCard label="중요 공지" value={`${view.summary.pinnedNoticeCount}건`} tone="warn" />
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
