"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  mouRecordAction,
  type MouRecordFormState,
} from "@/app/admin/mou-records/actions";
import { MOU_STATUS_LABELS, MOU_STATUSES } from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  type MouRecordListItem,
  type MouRecordView,
} from "@/server/mous/mou-record-service";

type MouRecordWorkspaceProps = {
  canWrite: boolean;
  notice: string;
  view: MouRecordView;
};

const initialState: MouRecordFormState = {
  ok: false,
  message: "",
};

const attachmentMimeOptions = [
  { label: "PDF", value: "application/pdf" },
  { label: "JPG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WebP", value: "image/webp" },
];

function SubmitButton({ children, disabled = false }: { children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="primary-action" disabled={disabled || pending} type="submit">
      {pending ? "저장 중" : children}
    </button>
  );
}

function MouHiddenFields({ record }: { record: MouRecordListItem }) {
  return (
    <>
      <input name="mouRecordId" type="hidden" value={record.id} />
      <input name="organizationName" type="hidden" value={record.organizationName} />
      <input name="partnerType" type="hidden" value={record.partnerType} />
      <input name="signedAt" type="hidden" value={record.signedAt} />
      <input name="startAt" type="hidden" value={record.startAt} />
      <input name="endAt" type="hidden" value={record.endAt} />
      <input name="scopeSummary" type="hidden" value={record.scopeSummary} />
      <input name="documentUrl" type="hidden" value={record.documentUrl} />
      <input name="documentLabel" type="hidden" value={record.documentLabel} />
    </>
  );
}

export function MouRecordWorkspace({ canWrite, notice, view }: MouRecordWorkspaceProps) {
  const [state, formAction] = useActionState(mouRecordAction, initialState);
  const defaultSignedAt = `${view.filters.month}-01`;
  const summaryCards = [
    { label: "월 체결", value: `${view.summary.totalCount}건`, note: view.summary.month },
    { label: "유효", value: `${view.summary.activeCount}건`, note: "진행 중 협력" },
    { label: "갱신 필요", value: `${view.summary.renewalDueCount}건`, note: "확인 대상" },
    { label: "문서 확인", value: `${view.summary.documentCount}건`, note: "링크 또는 첨부" },
  ];

  return (
    <div className="mou-record-workspace">
      {notice ? <p className="inline-notice">{notice}</p> : null}
      {state.message ? (
        <p className={`form-status ${state.ok ? "success" : "error"}`}>{state.message}</p>
      ) : null}
      {view.viewerLimited ? (
        <p className="inline-notice">
          VIEWER는 기관명, 체결일, 상태만 확인할 수 있으며 문서 링크와 내부 범위는 숨겨집니다.
        </p>
      ) : null}

      <section className="mou-record-toolbar" aria-labelledby="mou-record-filter-title">
        <div>
          <p className="eyebrow">조회</p>
          <h2 id="mou-record-filter-title">월별 MOU 현황</h2>
        </div>
        <form action="/admin/mou-records" className="mou-record-filter">
          <label>
            월
            <input defaultValue={view.filters.month} name="month" type="month" />
          </label>
          <label>
            상태
            <select defaultValue={view.filters.status} name="status">
              <option value="">전체</option>
              {MOU_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MOU_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-action" type="submit">
            <FaIcon name="filter" />
            조회
          </button>
        </form>
      </section>

      <section className="mou-summary-grid" aria-label="MOU 요약">
        {summaryCards.map((card) => (
          <article className="mou-summary-card" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="mou-record-layout">
        <form action={formAction} className="mou-record-form">
          <input name="intent" type="hidden" value="saveMouRecord" />
          <div className="section-header compact">
            <p className="eyebrow">기록</p>
            <h2>새 MOU 기록</h2>
          </div>
          <p className="form-help">
            {PRIVACY_INPUT_GUIDANCE} 기관 협력 범위만 간단히 남기고 주민 개인 정보는 입력하지 않습니다.
          </p>
          <fieldset disabled={!canWrite}>
            <label>
              기관명
              <input maxLength={100} name="organizationName" placeholder="예: 백천보건지소" required />
            </label>
            <div className="mou-form-grid">
              <label>
                기관 유형
                <input maxLength={80} name="partnerType" placeholder="예: 공공기관" />
              </label>
              <label>
                체결일
                <input defaultValue={defaultSignedAt} name="signedAt" required type="date" />
              </label>
              <label>
                시작일
                <input name="startAt" type="date" />
              </label>
              <label>
                종료일
                <input name="endAt" type="date" />
              </label>
              <label>
                상태
                <select defaultValue="ACTIVE" name="status" required>
                  {MOU_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {MOU_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                문서명
                <input maxLength={100} name="documentLabel" placeholder="예: MOU 문서" />
              </label>
            </div>
            <label>
              문서 링크
              <input maxLength={300} name="documentUrl" placeholder="https://..." type="url" />
            </label>
            <label>
              협력 범위
              <textarea
                maxLength={200}
                name="scopeSummary"
                placeholder="예: 동행 이동 연계와 안전 안내 협력"
                rows={3}
              />
            </label>
            <details className="mou-attachment-details">
              <summary>문서 첨부 기록 추가</summary>
              <div className="mou-form-grid">
                <label>
                  파일명
                  <input maxLength={120} name="attachmentFileName" placeholder="예: mou.pdf" />
                </label>
                <label>
                  파일 형식
                  <select defaultValue="" name="attachmentMimeType">
                    <option value="">선택 안 함</option>
                    {attachmentMimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  파일 크기(byte)
                  <input min={1} name="attachmentSizeBytes" placeholder="예: 245760" type="number" />
                </label>
              </div>
              <p className="form-help">문서 링크가 입력된 경우에만 첨부 기록을 남길 수 있습니다.</p>
            </details>
            <SubmitButton disabled={!canWrite}>MOU 기록 저장</SubmitButton>
          </fieldset>
          {!canWrite ? <p className="form-help">저장 권한이 없어 조회 전용으로 표시됩니다.</p> : null}
        </form>

        <section className="mou-record-list" aria-labelledby="mou-record-list-title">
          <div className="section-header compact">
            <p className="eyebrow">목록</p>
            <h2 id="mou-record-list-title">MOU 기록</h2>
          </div>
          {view.records.length > 0 ? (
            view.records.map((record) => (
              <MouRecordCard canWrite={canWrite} formAction={formAction} key={record.id} record={record} />
            ))
          ) : (
            <div className="empty-state">
              <FaIcon name="clipboardList" />
              <strong>해당 월 MOU 기록이 없습니다.</strong>
              <p>필터를 변경하거나 새 MOU 기록을 추가해 주세요.</p>
            </div>
          )}
          <Link className="secondary-action mou-report-link" href={`/admin/reports?month=${view.filters.month}`}>
            <FaIcon name="report" />
            월간 리포트로 이동
          </Link>
        </section>
      </section>
    </div>
  );
}

function MouRecordCard({
  canWrite,
  formAction,
  record,
}: {
  canWrite: boolean;
  formAction: (payload: FormData) => void;
  record: MouRecordListItem;
}) {
  return (
    <article className="mou-record-card">
      <header>
        <div>
          <p>{record.partnerType || "기관 유형 미지정"}</p>
          <strong>{record.organizationName}</strong>
        </div>
        <span data-status={record.status}>{record.statusLabel}</span>
      </header>
      <dl>
        <div>
          <dt>체결일</dt>
          <dd>{record.signedAt}</dd>
        </div>
        <div>
          <dt>운영 기간</dt>
          <dd>
            {record.startAt || "미지정"} ~ {record.endAt || "미지정"}
          </dd>
        </div>
        <div>
          <dt>문서</dt>
          <dd>
            {record.documentUrl ? (
              <a href={record.documentUrl} rel="noreferrer" target="_blank">
                {record.documentLabel || "문서 링크"}
              </a>
            ) : record.documentAvailable ? (
              "첨부 기록 있음"
            ) : (
              "미등록"
            )}
          </dd>
        </div>
        <div>
          <dt>작성자</dt>
          <dd>{record.createdByName || "제한됨"}</dd>
        </div>
      </dl>
      {record.scopeSummary ? <p>{record.scopeSummary}</p> : null}
      {canWrite ? (
        <details className="mou-card-edit">
          <summary>상태 수정</summary>
          <form action={formAction}>
            <input name="intent" type="hidden" value="saveMouRecord" />
            <MouHiddenFields record={record} />
            <label>
              상태
              <select defaultValue={record.status} name="status">
                {MOU_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {MOU_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton>수정 저장</SubmitButton>
          </form>
        </details>
      ) : null}
    </article>
  );
}
