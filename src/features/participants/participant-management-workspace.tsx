"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import {
  LINKER_STATUS_LABELS,
  LINKER_STATUSES,
} from "@/domain/definitions";
import {
  type LinkerUserStatusRow,
  type ParticipantActivityItem,
  type ParticipantManagementView,
  type ParticipantNoticeItem,
  type ResidentUserStatusRow,
} from "@/server/participants/participant-management-service";
import {
  participantManagementAction,
  type ParticipantManagementFormState,
} from "@/app/admin/participants/actions";

type ParticipantManagementWorkspaceProps = {
  notice?: string;
  view: ParticipantManagementView;
};

const initialState: ParticipantManagementFormState = {
  ok: false,
  message: "",
};

const availableDays = ["월", "화", "수", "목", "금", "토", "일"];
const availableTimeWindows = ["오전", "오후", "저녁"];

export function ParticipantManagementWorkspace({
  notice,
  view,
}: ParticipantManagementWorkspaceProps) {
  const [state, formAction, pending] = useActionState(
    participantManagementAction,
    initialState,
  );
  const tabs: TabItem[] = [
    {
      id: "residents",
      label: "주민 현황",
      icon: "resident",
      badge: view.residentRows.length,
      content: (
        <ResidentPanel
          canManage={view.canManageResidents}
          formAction={formAction}
          pending={pending}
          rows={view.residentRows}
        />
      ),
    },
    {
      id: "linkers",
      label: "링커 현황",
      icon: "car",
      badge: view.linkerRows.length,
      content: (
        <LinkerPanel
          canManage={view.canManageLinkers}
          formAction={formAction}
          pending={pending}
          rows={view.linkerRows}
        />
      ),
    },
  ];

  return (
    <div className="participant-workspace">
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

      <section className="participant-summary-grid" aria-label="주민 및 링커 사용자현황 요약">
        <SummaryCard label="주민" value={`${view.summary.residentCount}명`} />
        <SummaryCard label="동행링커" value={`${view.summary.linkerCount}명`} />
        <SummaryCard label="로그인 계정" value={`${view.summary.linkedAccountCount}개`} tone="good" />
        <SummaryCard label="개인 공지" value={`${view.summary.noticeCount}건`} />
      </section>

      <Tabs ariaLabel="주민 및 링커 사용자현황 메뉴" defaultTabId="residents" tabs={tabs} />
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
  tone?: "neutral" | "good";
}) {
  return (
    <article className="participant-summary-card" data-tone={tone}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ResidentPanel({
  canManage,
  formAction,
  pending,
  rows,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  rows: ResidentUserStatusRow[];
}) {
  return (
    <section className="participant-panel" aria-labelledby="resident-users-title">
      <div className="section-header">
        <p className="eyebrow">주민 사용자현황</p>
        <h2 id="resident-users-title">기본 정보, 활동내역, 계정 관리</h2>
        <p>관리자가 직접 주민 정보를 입력하고 저장·수정·초기화합니다.</p>
      </div>
      <ResidentProfileForm canManage={canManage} formAction={formAction} pending={pending} />
      <div className="participant-card-list">
        {rows.length > 0 ? (
          rows.map((row) => (
            <ResidentCard
              canManage={canManage}
              formAction={formAction}
              key={row.id}
              pending={pending}
              row={row}
            />
          ))
        ) : (
          <p className="request-empty">등록된 주민이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function LinkerPanel({
  canManage,
  formAction,
  pending,
  rows,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  rows: LinkerUserStatusRow[];
}) {
  return (
    <section className="participant-panel" aria-labelledby="linker-users-title">
      <div className="section-header">
        <p className="eyebrow">링커 사용자현황</p>
        <h2 id="linker-users-title">활동 준비, 교육, 배정 이력 관리</h2>
      </div>
      <LinkerProfileForm canManage={canManage} formAction={formAction} pending={pending} />
      <div className="participant-card-list">
        {rows.length > 0 ? (
          rows.map((row) => (
            <LinkerCard
              canManage={canManage}
              formAction={formAction}
              key={row.id}
              pending={pending}
              row={row}
            />
          ))
        ) : (
          <p className="request-empty">등록된 동행링커가 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function ResidentCard({
  canManage,
  formAction,
  pending,
  row,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  row: ResidentUserStatusRow;
}) {
  return (
    <article className="participant-card">
      <ParticipantCardHeader
        accountStatus={row.accountStatusLabel}
        name={row.name}
        phone={row.phoneMasked}
        sub={`${row.villageName} · 정서회복 ${row.emotionalRecoveryAverage ? `${row.emotionalRecoveryAverage}점` : "수집 전"}`}
      />
      <div className="participant-card-grid">
        <ResidentProfileForm
          canManage={canManage}
          formAction={formAction}
          pending={pending}
          row={row}
        />
        <ParticipantAccountForm
          accountEmail={row.accountEmail}
          canManage={canManage}
          formAction={formAction}
          kind="resident"
          pending={pending}
          targetId={row.id}
        />
        <ParticipantNoticeForm
          canManage={canManage}
          formAction={formAction}
          kind="resident"
          pending={pending}
          targetId={row.id}
        />
      </div>
      <ParticipantHistory
        activities={row.recentActivities}
        activityCount={row.activityCount}
        notices={row.recentNotices}
      />
    </article>
  );
}

function LinkerCard({
  canManage,
  formAction,
  pending,
  row,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  row: LinkerUserStatusRow;
}) {
  return (
    <article className="participant-card">
      <ParticipantCardHeader
        accountStatus={row.accountStatusLabel}
        name={row.name}
        phone={row.phoneMasked}
        sub={`${row.villageName} · ${row.statusLabel} · 활동 ${row.activityCount}회`}
      />
      <div className="participant-card-grid">
        <LinkerProfileForm
          canManage={canManage}
          formAction={formAction}
          pending={pending}
          row={row}
        />
        <ParticipantAccountForm
          accountEmail={row.accountEmail}
          canManage={canManage}
          formAction={formAction}
          kind="linker"
          pending={pending}
          targetId={row.id}
        />
        <ParticipantNoticeForm
          canManage={canManage}
          formAction={formAction}
          kind="linker"
          pending={pending}
          targetId={row.id}
        />
      </div>
      <ParticipantHistory
        activities={row.recentActivities}
        activityCount={row.activityCount}
        notices={row.recentNotices}
      />
    </article>
  );
}

function ParticipantCardHeader({
  accountStatus,
  name,
  phone,
  sub,
}: {
  accountStatus: string;
  name: string;
  phone: string;
  sub: string;
}) {
  return (
    <div className="participant-card-header">
      <div>
        <h3>{name}</h3>
        <p>
          {phone} · {sub}
        </p>
      </div>
      <mark>{accountStatus}</mark>
    </div>
  );
}

function ResidentProfileForm({
  canManage,
  formAction,
  pending,
  row,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  row?: ResidentUserStatusRow;
}) {
  const disabled = !canManage || pending;
  const formId = row ? `resident-${row.id}` : "resident-new";

  return (
    <form action={formAction} className="participant-form">
      <input name="intent" type="hidden" value="saveProfile" />
      <input name="kind" type="hidden" value="resident" />
      <input name="targetId" type="hidden" value={row?.id ?? ""} />
      <h4>{row ? "주민 기본 정보 수정" : "신규 주민 저장"}</h4>
      <div className="participant-field-grid">
        <label htmlFor={`${formId}-name`}>
          주민명
          <input defaultValue={row?.name ?? ""} disabled={disabled} id={`${formId}-name`} maxLength={80} name="name" required />
        </label>
        <label htmlFor={`${formId}-village`}>
          마을명
          <input defaultValue={row?.villageName ?? ""} disabled={disabled} id={`${formId}-village`} maxLength={80} name="villageName" required />
        </label>
        <label htmlFor={`${formId}-phone`}>
          연락처
          <input defaultValue={row?.phone ?? ""} disabled={disabled} id={`${formId}-phone`} inputMode="tel" maxLength={30} name="phone" required />
        </label>
        <label htmlFor={`${formId}-guardian`}>
          보호자 연락처
          <input defaultValue={row?.guardianPhone ?? ""} disabled={disabled} id={`${formId}-guardian`} inputMode="tel" maxLength={30} name="guardianPhone" />
        </label>
      </div>
      <label htmlFor={`${formId}-memo`}>
        메모
        <textarea defaultValue={row?.memo ?? ""} disabled={disabled} id={`${formId}-memo`} maxLength={300} name="memo" />
      </label>
      <FormButtons disabled={disabled} primaryLabel={row ? "수정" : "저장"} />
    </form>
  );
}

function LinkerProfileForm({
  canManage,
  formAction,
  pending,
  row,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  pending: boolean;
  row?: LinkerUserStatusRow;
}) {
  const disabled = !canManage || pending;
  const formId = row ? `linker-${row.id}` : "linker-new";

  return (
    <form action={formAction} className="participant-form">
      <input name="intent" type="hidden" value="saveProfile" />
      <input name="kind" type="hidden" value="linker" />
      <input name="targetId" type="hidden" value={row?.id ?? ""} />
      <h4>{row ? "링커 기본 정보 수정" : "신규 링커 저장"}</h4>
      <div className="participant-field-grid">
        <label htmlFor={`${formId}-name`}>
          링커명
          <input defaultValue={row?.name ?? ""} disabled={disabled} id={`${formId}-name`} maxLength={80} name="name" required />
        </label>
        <label htmlFor={`${formId}-village`}>
          마을명
          <input defaultValue={row?.villageName ?? ""} disabled={disabled} id={`${formId}-village`} maxLength={80} name="villageName" required />
        </label>
        <label htmlFor={`${formId}-phone`}>
          연락처
          <input defaultValue={row?.phone ?? ""} disabled={disabled} id={`${formId}-phone`} inputMode="tel" maxLength={30} name="phone" required />
        </label>
        <label htmlFor={`${formId}-status`}>
          상태
          <select defaultValue={row?.status ?? "CANDIDATE"} disabled={disabled} id={`${formId}-status`} name="status">
            {LINKER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LINKER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="participant-checkset">
        <legend>활동 가능 요일</legend>
        {availableDays.map((day) => (
          <label className="check-row" key={day}>
            <input defaultChecked={row?.availableDays.includes(day) ?? false} disabled={disabled} name="availableDays" type="checkbox" value={day} />
            {day}
          </label>
        ))}
      </fieldset>
      <fieldset className="participant-checkset">
        <legend>활동 가능 시간</legend>
        {availableTimeWindows.map((time) => (
          <label className="check-row" key={time}>
            <input defaultChecked={row?.availableTimeWindows.includes(time) ?? false} disabled={disabled} name="availableTimeWindows" type="checkbox" value={time} />
            {time}
          </label>
        ))}
      </fieldset>
      <fieldset className="participant-checkset">
        <legend>필수 준비</legend>
        <Check name="trainingCompleted" checked={row?.trainingCompleted} disabled={disabled} label="교육 이수" />
        <Check name="fieldPracticeCompleted" checked={row?.fieldPracticeCompleted} disabled={disabled} label="현장실습" />
        <Check name="privacyPledgeSigned" checked={row?.privacyPledgeSigned} disabled={disabled} label="개인정보보호 서약" />
        <Check name="insuranceRegistered" checked={row?.insuranceRegistered} disabled={disabled} label="보험 등록" />
      </fieldset>
      <label className="check-row">
        <input defaultChecked={row?.wantsJobConnection ?? false} disabled={disabled} name="wantsJobConnection" type="checkbox" />
        취업연계 희망
      </label>
      <label htmlFor={`${formId}-job`}>
        희망 분야
        <input defaultValue={row?.desiredJobField ?? ""} disabled={disabled} id={`${formId}-job`} maxLength={80} name="desiredJobField" />
      </label>
      <FormButtons disabled={disabled} primaryLabel={row ? "수정" : "저장"} />
    </form>
  );
}

function Check({
  checked,
  disabled,
  label,
  name,
}: {
  checked?: boolean;
  disabled: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="check-row">
      <input defaultChecked={checked ?? false} disabled={disabled} name={name} type="checkbox" />
      {label}
    </label>
  );
}

function ParticipantAccountForm({
  accountEmail,
  canManage,
  formAction,
  kind,
  pending,
  targetId,
}: {
  accountEmail: string;
  canManage: boolean;
  formAction: (formData: FormData) => void;
  kind: "resident" | "linker";
  pending: boolean;
  targetId: string;
}) {
  const disabled = !canManage || pending;
  return (
    <form action={formAction} className="participant-form participant-form--compact">
      <input name="intent" type="hidden" value="setPassword" />
      <input name="kind" type="hidden" value={kind} />
      <input name="targetId" type="hidden" value={targetId} />
      <h4>비밀번호 변경</h4>
      <label>
        로그인 이메일
        <input autoComplete="username" defaultValue={accountEmail} disabled={disabled} maxLength={120} name="email" required type="email" />
      </label>
      <label>
        새 비밀번호
        <input autoComplete="new-password" disabled={disabled} minLength={10} name="password" required type="password" />
      </label>
      <FormButtons disabled={disabled} primaryLabel="수정" />
    </form>
  );
}

function ParticipantNoticeForm({
  canManage,
  formAction,
  kind,
  pending,
  targetId,
}: {
  canManage: boolean;
  formAction: (formData: FormData) => void;
  kind: "resident" | "linker";
  pending: boolean;
  targetId: string;
}) {
  const disabled = !canManage || pending;
  return (
    <form action={formAction} className="participant-form participant-form--compact">
      <input name="intent" type="hidden" value="sendNotice" />
      <input name="kind" type="hidden" value={kind} />
      <input name="targetId" type="hidden" value={targetId} />
      <h4>개인 공지 발송</h4>
      <label>
        공지 제목
        <input disabled={disabled} maxLength={120} name="title" required />
      </label>
      <label>
        공지 내용
        <textarea disabled={disabled} maxLength={600} name="content" required />
      </label>
      <FormButtons disabled={disabled} primaryLabel="저장" />
    </form>
  );
}

function FormButtons({
  disabled,
  primaryLabel,
}: {
  disabled: boolean;
  primaryLabel: "저장" | "수정";
}) {
  return (
    <div className="participant-form-actions">
      <button disabled={disabled} type="submit">
        <FaIcon name="check" />
        {primaryLabel}
      </button>
      <button className="secondary-action" disabled={disabled} type="reset">
        초기화
      </button>
    </div>
  );
}

function ParticipantHistory({
  activities,
  activityCount,
  notices,
}: {
  activities: ParticipantActivityItem[];
  activityCount: number;
  notices: ParticipantNoticeItem[];
}) {
  return (
    <div className="participant-history-grid">
      <section className="participant-history-panel" aria-label="활동내역">
        <div className="participant-history-head">
          <h4>활동내역</h4>
          <span>{activityCount}건</span>
        </div>
        {activities.length > 0 ? (
          <ul>
            {activities.map((activity) => (
              <li key={`${activity.date}-${activity.title}`}>
                <time dateTime={activity.date}>{activity.date}</time>
                <strong>{activity.title}</strong>
                <span>{activity.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="request-empty">활동내역이 없습니다.</p>
        )}
      </section>
      <section className="participant-history-panel" aria-label="개인 공지 이력">
        <div className="participant-history-head">
          <h4>개인 공지</h4>
          <span>{notices.length}건</span>
        </div>
        {notices.length > 0 ? (
          <ul>
            {notices.slice(0, 4).map((notice) => (
              <li key={notice.id}>
                <time>{notice.createdAt}</time>
                <strong>{notice.title}</strong>
                <span>{notice.content}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="request-empty">발송 기록이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
