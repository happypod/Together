"use client";

import { useActionState } from "react";
import { createPublicFeedback, type PublicFeedbackState } from "@/app/public-home-actions";
import { FaIcon } from "@/components/ui/fa-icon";

type PublicFeedbackFormProps = {
  defaultRoleLabel: string;
  sourceType: "RESIDENT" | "GUARDIAN" | "LINKER" | "OPERATOR";
};

const initialState: PublicFeedbackState = {
  ok: false,
  message: "",
  step: "form",
};

export function PublicFeedbackForm({ defaultRoleLabel, sourceType }: PublicFeedbackFormProps) {
  const [state, formAction, pending] = useActionState(createPublicFeedback, initialState);

  if (state.ok && state.step === "success") {
    return (
      <div className="pub-form-success" role="alert" aria-live="polite">
        <span aria-hidden="true" className="pub-success-icon">✓</span>
        <h3 className="pub-success-title">소감이 접수되었습니다</h3>
        <p className="pub-success-msg">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="pub-form role-feedback-form">
      <input name="sourceType" type="hidden" value={sourceType} />
      <input name="roleLabel" type="hidden" value={defaultRoleLabel} />
      <p className="pub-form-privacy-note" role="note">
        공개 소감에는 이름, 연락처, 진료 내용, 주민등록번호를 적지 않습니다.
      </p>
      <label className="pub-label">
        마을 또는 활동 구분
        <input
          className="pub-input"
          maxLength={60}
          name="villageLabel"
          placeholder={sourceType === "LINKER" ? "예: 소원권역 동행링커" : "예: 의항1리"}
        />
      </label>
      <label className="pub-label">
        소감
        <textarea
          className="pub-input"
          maxLength={400}
          name="content"
          placeholder="이용하거나 활동하면서 좋았던 점, 개선이 필요한 점을 적어 주세요."
          required
          rows={4}
        />
      </label>
      <label className="check-row pub-consent-row">
        <input name="privacyConsent" required type="checkbox" value="true" />
        개인정보와 민감정보를 적지 않았음을 확인합니다.
      </label>
      {state.message && !state.ok ? (
        <p className="pub-form-error" role="alert">{state.message}</p>
      ) : null}
      <button className="pub-submit-btn" disabled={pending} type="submit">
        <FaIcon name="heart" />
        {pending ? "소감 접수 중" : "소감 남기기"}
      </button>
    </form>
  );
}
