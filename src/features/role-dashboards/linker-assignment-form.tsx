"use client";

import { useActionState } from "react";
import {
  createPublicLinkerAssignmentRequest,
  type PublicLinkerAssignmentState,
} from "@/app/public-home-actions";
import { FaIcon } from "@/components/ui/fa-icon";

const initialState: PublicLinkerAssignmentState = {
  ok: false,
  message: "",
  step: "form",
};

const days = ["월", "화", "수", "목", "금", "토"] as const;
const timeWindows = ["오전", "오후"] as const;

export function LinkerAssignmentForm() {
  const [state, formAction, pending] = useActionState(
    createPublicLinkerAssignmentRequest,
    initialState,
  );

  if (state.ok && state.step === "success") {
    return (
      <div className="pub-form-success" role="alert" aria-live="polite">
        <span aria-hidden="true" className="pub-success-icon">✓</span>
        <h3 className="pub-success-title">배정 신청이 접수되었습니다</h3>
        <p className="pub-success-msg">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="pub-form linker-assignment-form">
      <p className="pub-form-privacy-note" role="note">
        동행링커 배정은 교육 이수와 운영자 확인 후 진행됩니다.
      </p>
      <fieldset className="pub-fieldset">
        <legend>동행링커 정보</legend>
        <div className="pub-field-grid">
          <label className="pub-label">
            이름 <span className="pub-required" aria-label="필수">*</span>
            <input autoComplete="name" className="pub-input" maxLength={60} name="name" required />
          </label>
          <label className="pub-label">
            마을명 <span className="pub-required" aria-label="필수">*</span>
            <input className="pub-input" maxLength={60} name="villageName" required />
          </label>
          <label className="pub-label">
            연락처 <span className="pub-required" aria-label="필수">*</span>
            <input
              autoComplete="tel"
              className="pub-input"
              inputMode="tel"
              maxLength={30}
              name="phone"
              placeholder="010-0000-0000"
              required
            />
          </label>
          <label className="pub-label">
            희망 활동
            <input
              className="pub-input"
              maxLength={120}
              name="desiredJobField"
              placeholder="예: 병원 동행, 교육 보조, 취업연계 상담"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="pub-fieldset">
        <legend>배정 가능 시간</legend>
        <div className="role-check-grid" aria-label="배정 가능한 요일">
          {days.map((day) => (
            <label className="check-row pub-consent-row" key={day}>
              <input name="availableDays" type="checkbox" value={day} />
              {day}요일
            </label>
          ))}
        </div>
        <div className="role-check-grid role-check-grid--compact" aria-label="배정 가능한 시간대">
          {timeWindows.map((timeWindow) => (
            <label className="check-row pub-consent-row" key={timeWindow}>
              <input name="availableTimeWindows" type="checkbox" value={timeWindow} />
              {timeWindow}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="pub-label">
        참고사항
        <textarea
          className="pub-input"
          maxLength={300}
          name="notes"
          placeholder="교육 이수 여부, 활동 가능 조건 등 운영자가 참고할 내용만 적어 주세요."
          rows={3}
        />
      </label>
      <label className="check-row pub-consent-row">
        <input name="wantsJobConnection" type="checkbox" value="true" />
        취업연계 지원 상담을 희망합니다.
      </label>
      <label className="check-row pub-consent-row">
        <input name="privacyConsent" required type="checkbox" value="true" />
        개인정보 수집·이용과 민감정보 미입력 기준을 확인했습니다.
      </label>

      {state.message && !state.ok ? (
        <p className="pub-form-error" role="alert">{state.message}</p>
      ) : null}
      <button className="pub-submit-btn" disabled={pending} type="submit">
        <FaIcon name="checklist" />
        {pending ? "배정 신청 중" : "링커 배정 신청하기"}
      </button>
    </form>
  );
}
