"use client";

import { useActionState } from "react";
import {
  createPublicEducationApplication,
  type PublicEducationApplicationState,
} from "@/app/public-home-actions";

type EducationApplicationFormProps = {
  scheduleOptions: {
    id: string;
    label: string;
    courseType: "collective" | "linker-qualification";
  }[];
};

const initialState: PublicEducationApplicationState = {
  ok: false,
  message: "",
  step: "form",
};

export function EducationApplicationForm({ scheduleOptions }: EducationApplicationFormProps) {
  const [state, formAction, pending] = useActionState(
    createPublicEducationApplication,
    initialState,
  );

  if (state.ok && state.step === "success") {
    return (
      <div className="pub-form-success education-success" role="alert" aria-live="polite">
        <span aria-hidden="true" className="pub-success-icon">✓</span>
        <h3 className="pub-success-title">교육 신청이 접수되었습니다</h3>
        {state.receiptCode ? (
          <div className="pub-refcode-box" aria-label="교육 신청 접수번호">
            <span className="pub-refcode-label">교육 접수번호</span>
            <strong className="pub-refcode">{state.receiptCode}</strong>
            <span className="pub-refcode-hint">교육일 확인 또는 문의 시 이 번호를 알려 주세요.</span>
          </div>
        ) : null}
        <p className="pub-success-msg">{state.message}</p>
        <button className="pub-cta-ghost" onClick={() => window.location.reload()} type="button">
          새 교육 신청하기
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="pub-form education-application-form" noValidate>
      <p className="pub-form-privacy-note" role="note">
        교육 신청에는 이름, 연락처, 참여 구분, 희망 교육일만 입력합니다.
        건강정보, 주민등록번호, 진료 내용은 입력하지 않습니다.
      </p>

      <fieldset className="pub-fieldset">
        <legend>신청자 정보</legend>
        <div className="pub-field-grid">
          <label className="pub-label">
            이름 <span className="pub-required" aria-label="필수">*</span>
            <input
              autoComplete="name"
              className="pub-input"
              maxLength={40}
              name="participantName"
              placeholder="성함을 입력해 주세요"
              required
            />
          </label>
          <label className="pub-label">
            연락처 <span className="pub-required" aria-label="필수">*</span>
            <input
              autoComplete="tel"
              className="pub-input"
              inputMode="tel"
              maxLength={20}
              name="phone"
              placeholder="010-0000-0000"
              required
            />
          </label>
          <label className="pub-label">
            마을명
            <input
              className="pub-input"
              maxLength={60}
              name="villageName"
              placeholder="예: 의항1리"
            />
          </label>
          <label className="pub-label">
            참여 구분 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="participantType" required>
              <option value="">선택해 주세요</option>
              <option value="resident">주민</option>
              <option value="companion">동행자</option>
              <option value="linker">동행링커 후보자</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="pub-fieldset">
        <legend>교육 과정 선택</legend>
        <div className="pub-field-grid">
          <label className="pub-label">
            교육 과정 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="courseType" required>
              <option value="">선택해 주세요</option>
              <option value="collective">소원권역 동행이동 OS 집체교육</option>
              <option value="linker-qualification">동행링커 민간자격과정</option>
            </select>
          </label>
          <label className="pub-label">
            희망 교육일 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="preferredDate" required>
              <option value="">선택해 주세요</option>
              {scheduleOptions.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="pub-label">
          문의 또는 참고사항 <span className="pub-hint">(선택)</span>
          <textarea
            className="pub-input"
            maxLength={200}
            name="notes"
            placeholder="교육 참여와 관련된 참고사항만 간단히 적어 주세요."
            rows={3}
          />
        </label>
      </fieldset>

      <fieldset className="pub-fieldset pub-consent-fieldset">
        <legend>필수 확인</legend>
        <label className="check-row pub-consent-row">
          <input name="privacyConsent" required type="checkbox" value="true" />
          교육 신청 접수를 위한 개인정보 수집·이용에 동의합니다.
        </label>
        <label className="check-row pub-consent-row">
          <input name="educationRuleConfirmed" required type="checkbox" value="true" />
          동행서비스 이용자 등록과 동행링커 활동 자격은 교육 이수 기준에 따라 처리됨을 확인했습니다.
        </label>
      </fieldset>

      {state.message && !state.ok ? (
        <p className="pub-form-error" role="alert">{state.message}</p>
      ) : null}

      <button className="pub-submit-btn" disabled={pending} type="submit">
        {pending ? "교육 신청 접수 중" : "교육 신청 접수하기"}
      </button>
    </form>
  );
}
