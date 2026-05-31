"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  jobConsultationAction,
  type JobConsultationFormState,
} from "@/app/admin/job-consultations/actions";
import {
  JOB_CONSULTATION_STATUS_LABELS,
  JOB_CONSULTATION_STATUSES,
  JOB_CONSULTATION_TARGET_TYPE_LABELS,
  JOB_CONSULTATION_TARGET_TYPES,
} from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  type JobConsultationListItem,
  type JobConsultationTargetOption,
  type JobConsultationView,
} from "@/server/jobs/job-consultation-service";

type JobConsultationWorkspaceProps = {
  canWrite: boolean;
  notice: string;
  view: JobConsultationView;
};

const initialState: JobConsultationFormState = {
  ok: false,
  message: "",
};

function targetKey(option: JobConsultationTargetOption | JobConsultationListItem) {
  return `${option.targetType}:${option.id}`;
}

function recordTargetKey(record: JobConsultationListItem) {
  return `${record.targetType}:${record.targetId}`;
}

function SubmitButton({ children, disabled = false }: { children: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="primary-action" disabled={disabled || pending} type="submit">
      {pending ? "저장 중" : children}
    </button>
  );
}

function OptionGroup({
  label,
  options,
}: {
  label: string;
  options: JobConsultationTargetOption[];
}) {
  if (options.length === 0) {
    return null;
  }

  return (
    <optgroup label={label}>
      {options.map((option) => (
        <option key={`${option.targetType}:${option.id}`} value={targetKey(option)}>
          {option.label} · {option.helper}
        </option>
      ))}
    </optgroup>
  );
}

export function JobConsultationWorkspace({
  canWrite,
  notice,
  view,
}: JobConsultationWorkspaceProps) {
  const [state, formAction] = useActionState(jobConsultationAction, initialState);
  const linkerOptions = view.targetOptions.filter((option) => option.targetType === "LINKER");
  const residentOptions = view.targetOptions.filter((option) => option.targetType === "RESIDENT");
  const defaultConsultedAt = `${view.filters.month}-01`;
  const summaryCards = [
    { label: "전체 기록", value: `${view.summary.totalCount}건`, note: view.summary.month },
    { label: "연계 완료", value: `${view.summary.connectedCount}건`, note: "완료 상태" },
    { label: "진행 중", value: `${view.summary.inProgressCount}건`, note: "추적 필요" },
    {
      label: "대상 분포",
      value: `${view.summary.linkerCount}/${view.summary.residentCount}`,
      note: "동행링커/주민",
    },
  ];

  return (
    <div className="job-consultation-workspace">
      {notice ? <p className="inline-notice">{notice}</p> : null}
      {state.message ? (
        <p className={`form-status ${state.ok ? "success" : "error"}`}>{state.message}</p>
      ) : null}

      <section className="job-consultation-toolbar" aria-labelledby="job-consultation-filter-title">
        <div>
          <p className="eyebrow">조회</p>
          <h2 id="job-consultation-filter-title">월별 취업연계 현황</h2>
        </div>
        <form action="/admin/job-consultations" className="job-consultation-filter">
          <label>
            월
            <input defaultValue={view.filters.month} name="month" type="month" />
          </label>
          <label>
            대상
            <select defaultValue={view.filters.targetType} name="targetType">
              <option value="">전체</option>
              {JOB_CONSULTATION_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {JOB_CONSULTATION_TARGET_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            상태
            <select defaultValue={view.filters.status} name="status">
              <option value="">전체</option>
              {JOB_CONSULTATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_CONSULTATION_STATUS_LABELS[status]}
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

      <section className="job-summary-grid" aria-label="취업연계 상담 요약">
        {summaryCards.map((card) => (
          <article className="job-summary-card" key={card.label}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="job-consultation-layout">
        <form action={formAction} className="job-consultation-form">
          <input name="intent" type="hidden" value="saveJobConsultation" />
          <div className="section-header compact">
            <p className="eyebrow">기록</p>
            <h2>새 취업연계 기록</h2>
          </div>
          <p className="form-help">
            {PRIVACY_INPUT_GUIDANCE} 개인 사정 서술은 남기지 않고 연계 분야와 진행 상태만 기록합니다.
          </p>
          <fieldset disabled={!canWrite}>
            <label>
              대상
              <select name="targetKey" required>
                <option value="">대상 선택</option>
                <OptionGroup label="동행링커" options={linkerOptions} />
                <OptionGroup label="주민" options={residentOptions} />
              </select>
            </label>
            <div className="job-form-grid">
              <label>
                기록일
                <input defaultValue={defaultConsultedAt} name="consultedAt" required type="date" />
              </label>
              <label>
                연계 분야
                <input maxLength={80} name="field" placeholder="예: 돌봄 보조" required />
              </label>
              <label>
                상태
                <select defaultValue="REQUESTED" name="status" required>
                  {JOB_CONSULTATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {JOB_CONSULTATION_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                연계 기관
                <input maxLength={80} name="organization" placeholder="예: 읍 행정복지센터" />
              </label>
            </div>
            <label>
              지원 요약
              <textarea
                maxLength={140}
                name="supportSummary"
                placeholder="예: 교육기관 안내, 면접 일정 연결"
                rows={3}
              />
            </label>
            <SubmitButton disabled={!canWrite}>취업연계 기록 저장</SubmitButton>
          </fieldset>
          {!canWrite ? <p className="form-help">저장 권한이 없어 조회 전용으로 표시됩니다.</p> : null}
        </form>

        <section className="job-consultation-list" aria-labelledby="job-consultation-list-title">
          <div className="section-header compact">
            <p className="eyebrow">목록</p>
            <h2 id="job-consultation-list-title">취업연계 기록</h2>
          </div>
          {view.records.length > 0 ? (
            view.records.map((record) => (
              <article className="job-consultation-card" key={record.id}>
                <header>
                  <div>
                    <p>
                      {record.targetTypeLabel} · {record.villageName}
                    </p>
                    <strong>{record.targetName}</strong>
                  </div>
                  <span data-status={record.status}>{record.statusLabel}</span>
                </header>
                <dl>
                  <div>
                    <dt>기록일</dt>
                    <dd>{record.consultedAt}</dd>
                  </div>
                  <div>
                    <dt>연계 분야</dt>
                    <dd>{record.field}</dd>
                  </div>
                  <div>
                    <dt>연계 기관</dt>
                    <dd>{record.organization || "미지정"}</dd>
                  </div>
                  <div>
                    <dt>작성자</dt>
                    <dd>{record.createdByName}</dd>
                  </div>
                </dl>
                {record.supportSummary ? <p>{record.supportSummary}</p> : null}
                {canWrite ? (
                  <details className="job-card-edit">
                    <summary>상태 수정</summary>
                    <form action={formAction}>
                      <input name="intent" type="hidden" value="saveJobConsultation" />
                      <input name="jobConsultationId" type="hidden" value={record.id} />
                      <input name="targetKey" type="hidden" value={recordTargetKey(record)} />
                      <input name="consultedAt" type="hidden" value={record.consultedAt} />
                      <input name="field" type="hidden" value={record.field} />
                      <input name="organization" type="hidden" value={record.organization} />
                      <label>
                        상태
                        <select defaultValue={record.status} name="status">
                          {JOB_CONSULTATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {JOB_CONSULTATION_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        지원 요약
                        <textarea
                          defaultValue={record.supportSummary}
                          maxLength={140}
                          name="supportSummary"
                          rows={2}
                        />
                      </label>
                      <SubmitButton>수정 저장</SubmitButton>
                    </form>
                  </details>
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <FaIcon name="briefcase" />
              <strong>해당 월 기록이 없습니다.</strong>
              <p>필터를 변경하거나 새 취업연계 기록을 추가해 주세요.</p>
            </div>
          )}
          <Link className="secondary-action job-report-link" href={`/admin/reports?month=${view.filters.month}`}>
            <FaIcon name="report" />
            월간 리포트로 이동
          </Link>
        </section>
      </section>
    </div>
  );
}
