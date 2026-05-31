"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import {
  type ManagedUserRow,
  type UserAuditRow,
  type UserManagementView,
} from "@/server/users/user-management-service";
import {
  type UserManagementFormState,
  userManagementAction,
} from "@/app/admin/users/actions";

type UserManagementWorkspaceProps = {
  view: UserManagementView;
  notice?: string;
};

const initialState: UserManagementFormState = {
  ok: false,
  message: "",
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) {
    return "기록 없음";
  }
  return dateFormatter.format(new Date(value));
}

function actionLabel(action: string) {
  if (action === "CREATE") {
    return "생성";
  }
  if (action === "UPDATE") {
    return "역할 변경";
  }
  if (action === "STATUS_CHANGE") {
    return "활성 상태 변경";
  }
  return action;
}

export function UserManagementWorkspace({ notice, view }: UserManagementWorkspaceProps) {
  const [state, formAction, pending] = useActionState(userManagementAction, initialState);

  return (
    <div className="user-management-workspace">
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

      <section className="user-policy-grid" aria-label="사용자 관리 정책">
        <PolicyCard title="최고 관리자" value={view.policy.superAdmin} />
        <PolicyCard title="운영 책임자" value={view.policy.anchorAdmin} />
        <PolicyCard title="위험 작업" value={view.policy.dangerousAction} />
        <PolicyCard title="초대 정책" value={view.policy.invitation} />
      </section>

      <section className="user-summary-grid" aria-label="사용자 계정 현황">
        <SummaryCard label="전체 사용자" value={`${view.summary.totalCount}명`} />
        <SummaryCard label="활성 계정" value={`${view.summary.activeCount}명`} tone="good" />
        <SummaryCard label="비활성 계정" value={`${view.summary.inactiveCount}명`} tone="danger" />
        <SummaryCard label="초대 대기" value={`${view.summary.pendingPasswordCount}명`} tone="warn" />
      </section>

      <div className="user-management-grid">
        <section className="user-create-panel" aria-labelledby="user-create-title">
          <div className="section-header">
            <p className="eyebrow">계정 생성</p>
            <h2 id="user-create-title">사용자 초대 또는 생성</h2>
          </div>
          <form action={formAction} className="user-management-form">
            <input name="intent" type="hidden" value="createUser" />
            <label htmlFor="new-user-name">
              이름
              <input
                autoComplete="name"
                disabled={!view.canCreate || pending}
                id="new-user-name"
                maxLength={40}
                name="name"
                placeholder="예: 백천 운영자"
                required
              />
            </label>
            <label htmlFor="new-user-email">
              이메일
              <input
                autoComplete="username"
                disabled={!view.canCreate || pending}
                id="new-user-email"
                maxLength={120}
                name="email"
                placeholder="operator@example.org"
                required
                type="email"
              />
            </label>
            <label htmlFor="new-user-phone">
              연락처
              <input
                autoComplete="tel"
                disabled={!view.canCreate || pending}
                id="new-user-phone"
                maxLength={30}
                name="phone"
                placeholder="010-0000-0000"
                type="tel"
              />
            </label>
            <label htmlFor="new-user-role">
              역할
              <select disabled={!view.canCreate || pending} id="new-user-role" name="role" required>
                <option value="">역할 선택</option>
                {view.roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="new-user-password">
              초기 비밀번호
              <input
                autoComplete="new-password"
                disabled={!view.canCreate || pending}
                id="new-user-password"
                minLength={10}
                name="temporaryPassword"
                placeholder="비워두면 초대 대기"
                type="password"
              />
            </label>
            <label htmlFor="new-user-reason">
              생성 사유
              <textarea
                disabled={!view.canCreate || pending}
                id="new-user-reason"
                maxLength={300}
                name="reason"
                placeholder="예: 신규 협의체 운영자 등록"
                required
              />
            </label>
            <button disabled={!view.canCreate || pending} type="submit">
              <FaIcon name="add" />
              사용자 생성
            </button>
          </form>
        </section>

        <section className="user-list-panel" aria-labelledby="user-list-title">
          <div className="section-header">
            <p className="eyebrow">사용자 목록</p>
            <h2 id="user-list-title">역할과 활성 상태</h2>
          </div>
          <div className="user-card-list">
            {view.users.map((user) => (
              <UserCard formAction={formAction} key={user.id} pending={pending} user={user} />
            ))}
          </div>
        </section>
      </div>

      <section className="user-audit-panel" aria-labelledby="user-audit-title">
        <div className="section-header">
          <p className="eyebrow">AuditLog</p>
          <h2 id="user-audit-title">최근 사용자 변경 이력</h2>
        </div>
        {view.auditRows.length > 0 ? (
          <div className="user-audit-list">
            {view.auditRows.map((row) => (
              <AuditRow key={row.id} row={row} />
            ))}
          </div>
        ) : (
          <p className="request-empty">최근 사용자 변경 이력이 없습니다.</p>
        )}
      </section>
    </div>
  );
}

function PolicyCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="user-policy-card">
      <strong>{title}</strong>
      <p>{value}</p>
    </article>
  );
}

function SummaryCard({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <article className="user-summary-card" data-tone={tone}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function UserCard({
  formAction,
  pending,
  user,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  user: ManagedUserRow;
}) {
  const roleFormDisabled = !user.canChangeRole || pending;
  const deactivateDisabled = !user.canDeactivate || pending;
  const reactivateDisabled = !user.canReactivate || pending;

  return (
    <article className="user-card">
      <div className="user-card-header">
        <div>
          <h3>{user.name}</h3>
          <p>{user.email ?? "이메일 없음"}</p>
        </div>
        <mark data-active={user.isActive}>{user.statusLabel}</mark>
      </div>

      <dl className="user-meta-grid">
        <div>
          <dt>역할</dt>
          <dd>{user.roleLabel}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{user.maskedPhone || "없음"}</dd>
        </div>
        <div>
          <dt>최근 로그인</dt>
          <dd>{formatDate(user.lastLoginAt)}</dd>
        </div>
        <div>
          <dt>초기 설정</dt>
          <dd>{user.passwordConfigured ? "로그인 가능" : "초대 대기"}</dd>
        </div>
      </dl>

      <p className="user-role-description">{user.roleDescription}</p>
      <p className="user-restriction">{user.restrictionText}</p>

      <div className="user-action-grid">
        <form action={formAction} className="user-inline-form">
          <input name="intent" type="hidden" value="updateUserRole" />
          <input name="userId" type="hidden" value={user.id} />
          <label htmlFor={`role-${user.id}`}>
            역할 변경
            <select
              defaultValue={user.role}
              disabled={roleFormDisabled}
              id={`role-${user.id}`}
              name="role"
            >
              {user.editableRoleOptions.length > 0 ? (
                user.editableRoleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))
              ) : (
                <option value={user.role}>{user.roleLabel}</option>
              )}
            </select>
          </label>
          <label htmlFor={`role-reason-${user.id}`}>
            변경 사유
            <textarea
              disabled={roleFormDisabled}
              id={`role-reason-${user.id}`}
              maxLength={300}
              name="reason"
              placeholder="예: 담당 범위 변경"
              required
            />
          </label>
          <label className="check-row" htmlFor={`role-confirm-${user.id}`}>
            <input
              disabled={roleFormDisabled}
              id={`role-confirm-${user.id}`}
              name="confirmed"
              type="checkbox"
            />
            권한 변경 영향과 AuditLog 기록을 확인했습니다.
          </label>
          <button disabled={roleFormDisabled} type="submit">
            역할 저장
          </button>
        </form>

        <form action={formAction} className="user-inline-form danger">
          <input
            name="intent"
            type="hidden"
            value={user.isActive ? "deactivateUser" : "reactivateUser"}
          />
          <input name="userId" type="hidden" value={user.id} />
          <label htmlFor={`active-reason-${user.id}`}>
            {user.isActive ? "비활성화 사유" : "재활성화 사유"}
            <textarea
              disabled={user.isActive ? deactivateDisabled : reactivateDisabled}
              id={`active-reason-${user.id}`}
              maxLength={300}
              name="reason"
              placeholder={user.isActive ? "예: 담당자 퇴사" : "예: 복귀 후 계정 재개"}
              required
            />
          </label>
          <label className="check-row" htmlFor={`active-confirm-${user.id}`}>
            <input
              disabled={user.isActive ? deactivateDisabled : reactivateDisabled}
              id={`active-confirm-${user.id}`}
              name="confirmed"
              type="checkbox"
            />
            {user.isActive ? "접근 차단과 AuditLog 기록을 확인했습니다." : "접근 재개를 확인했습니다."}
          </label>
          <button
            disabled={user.isActive ? deactivateDisabled : reactivateDisabled}
            type="submit"
          >
            {user.isActive ? "비활성화" : "재활성화"}
          </button>
        </form>
      </div>
    </article>
  );
}

function AuditRow({ row }: { row: UserAuditRow }) {
  return (
    <article className="user-audit-row">
      <div>
        <strong>{actionLabel(row.action)}</strong>
        <p>
          {row.targetName} · 처리자 {row.actorName}
        </p>
      </div>
      <span>{formatDate(row.performedAt)}</span>
      <small>{row.note || "사유 없음"}</small>
    </article>
  );
}
