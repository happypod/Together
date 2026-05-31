"use client";

import { useActionState } from "react";
import {
  checkPublicMobilityRequest,
  type PublicCheckState,
} from "@/app/public-home-actions";

const initialState: PublicCheckState = { ok: false, message: "" };

export function RequestCheckForm() {
  const [state, formAction, pending] = useActionState(
    checkPublicMobilityRequest,
    initialState,
  );

  return (
    <div className="pub-check-wrap">
      <form action={formAction} className="pub-form pub-check-form">
        <p className="pub-form-privacy-note" role="note">
          이름·연락처 뒷자리·희망일로 신청 상태를 확인합니다.
          개인 연락처 전체는 표시되지 않습니다.
        </p>

        <div className="pub-field-grid">
          <label className="pub-label">
            이름 <span className="pub-required" aria-label="필수">*</span>
            <input
              autoComplete="name"
              className="pub-input"
              maxLength={40}
              name="residentName"
              placeholder="신청 시 입력한 이름"
              required
            />
          </label>
          <label className="pub-label">
            연락처 뒷자리 4자리 <span className="pub-required" aria-label="필수">*</span>
            <input
              className="pub-input"
              inputMode="numeric"
              maxLength={4}
              name="phoneLastFour"
              pattern="[0-9]{4}"
              placeholder="예: 5678"
              required
            />
          </label>
          <label className="pub-label">
            이동 희망일 <span className="pub-required" aria-label="필수">*</span>
            <input className="pub-input" name="desiredDate" required type="date" />
          </label>
        </div>

        {state.message && !state.ok ? (
          <p className="pub-form-error" role="alert">{state.message}</p>
        ) : null}

        <button className="pub-submit-btn" disabled={pending} type="submit">
          {pending ? "확인 중…" : "내 신청 확인하기"}
        </button>
      </form>

      {state.ok && state.result ? (
        <div className="pub-check-result" role="region" aria-label="신청 현황" aria-live="polite">
          <div className="pub-check-status-banner">
            <span className="pub-check-status-label">현재 상태</span>
            <strong className="pub-check-status-value">{state.result.statusLabel}</strong>
          </div>
          <p className="pub-check-advice">{state.result.advice}</p>
          <dl className="pub-check-details">
            <div>
              <dt>이동 희망일</dt>
              <dd>{state.result.desiredDate} {state.result.timeWindow}</dd>
            </div>
            <div>
              <dt>이동 목적</dt>
              <dd>{state.result.purposeLabel}</dd>
            </div>
            <div>
              <dt>신청일</dt>
              <dd>{state.result.createdAt}</dd>
            </div>
          </dl>
          <p className="pub-check-note">
            ※ 연락처, 보호자 연락처, 이동 상세 경로는 개인정보 보호를 위해 표시하지 않습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
