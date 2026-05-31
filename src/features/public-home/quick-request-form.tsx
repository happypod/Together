"use client";

import { useActionState } from "react";
import {
  createPublicMobilityRequest,
  type PublicRequestState,
} from "@/app/public-home-actions";
import { MOBILITY_PURPOSE_LABELS, MOBILITY_PURPOSES } from "@/domain/definitions";

const initialState: PublicRequestState = { ok: false, message: "", step: "form" };

const TIME_WINDOWS = ["오전", "오후"];

export function QuickRequestForm({ villages }: { villages: string[] }) {
  const [state, formAction, pending] = useActionState(createPublicMobilityRequest, initialState);

  if (state.step === "success" && state.ok) {
    return (
      <div className="pub-form-success" role="alert" aria-live="polite">
        <span aria-hidden="true" className="pub-success-icon">✅</span>
        <h3 className="pub-success-title">신청이 접수되었습니다</h3>
        {state.refCode ? (
          <div className="pub-refcode-box" aria-label="신청 참조번호">
            <span className="pub-refcode-label">신청 참조번호</span>
            <strong className="pub-refcode">{state.refCode}</strong>
            <span className="pub-refcode-hint">이 번호를 저장해 두시면 신청 확인에 도움이 됩니다.</span>
          </div>
        ) : null}
        <p className="pub-success-msg">{state.message}</p>
        <a className="pub-cta-primary" href="#check">내 신청 상태 확인하기</a>
        <button
          className="pub-cta-ghost"
          onClick={() => window.location.reload()}
          type="button"
        >
          새로 신청하기
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="pub-form" noValidate>
      <p className="pub-form-privacy-note" role="note">
        병명, 진료 내용, 주민등록번호는 입력하지 않습니다.
        보호자 연락처 입력을 권장합니다.
      </p>

      {/* 신청자 정보 */}
      <fieldset className="pub-fieldset">
        <legend>신청자 정보</legend>
        <div className="pub-field-grid">
          <label className="pub-label">
            이름 <span className="pub-required" aria-label="필수">*</span>
            <input
              autoComplete="name"
              className="pub-input"
              maxLength={40}
              name="residentName"
              placeholder="성함을 입력해 주세요"
              required
            />
          </label>
          <label className="pub-label">
            마을명 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="villageName" required>
              <option value="">선택해 주세요</option>
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
              <option value="소원권역">기타 소원권역</option>
            </select>
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
            보호자 연락처 <span className="pub-hint">(권장)</span>
            <input
              autoComplete="tel"
              className="pub-input"
              inputMode="tel"
              maxLength={20}
              name="guardianPhone"
              placeholder="보호자 연락처"
            />
          </label>
        </div>
      </fieldset>

      {/* 이동 신청 */}
      <fieldset className="pub-fieldset">
        <legend>이동 신청 정보</legend>
        <div className="pub-field-grid">
          <label className="pub-label">
            이동 희망일 <span className="pub-required" aria-label="필수">*</span>
            <input className="pub-input" name="desiredDate" required type="date" />
          </label>
          <label className="pub-label">
            희망 시간대 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="desiredTimeWindow" required>
              <option value="">선택해 주세요</option>
              {TIME_WINDOWS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="pub-label">
            이동 목적 <span className="pub-required" aria-label="필수">*</span>
            <select className="pub-input" name="purpose" required>
              <option value="">선택해 주세요</option>
              {MOBILITY_PURPOSES.map((p) => (
                <option key={p} value={p}>{MOBILITY_PURPOSE_LABELS[p]}</option>
              ))}
            </select>
          </label>
          <label className="pub-label">
            동행 필요 여부
            <select className="pub-input" defaultValue="true" name="needsCompanion">
              <option value="true">동행 필요</option>
              <option value="false">동행 불필요</option>
              <option value="consult">운영자 상담 후 결정</option>
            </select>
          </label>
        </div>
        <div className="pub-field-grid">
          <label className="pub-label">
            출발지 <span className="pub-required" aria-label="필수">*</span>
            <input
              className="pub-input"
              maxLength={80}
              name="origin"
              placeholder="예: 의항1리 회관"
              required
            />
          </label>
          <label className="pub-label">
            목적지 <span className="pub-required" aria-label="필수">*</span>
            <input
              className="pub-input"
              maxLength={80}
              name="destination"
              placeholder="예: 태안종합병원"
              required
            />
          </label>
        </div>
        <label className="pub-label">
          특이사항 <span className="pub-hint">(선택)</span>
          <textarea
            className="pub-input"
            maxLength={200}
            name="notes"
            placeholder="운영자가 참고할 내용만 간단히 적어 주세요. 병명·진료 내용은 입력하지 않습니다."
            rows={3}
          />
        </label>
      </fieldset>

      {/* 필수 확인 */}
      <fieldset className="pub-fieldset pub-consent-fieldset">
        <legend>필수 확인</legend>
        <label className="check-row pub-consent-row">
          <input name="privacyConsent" required type="checkbox" value="true" />
          개인정보 수집·이용 동의 확인
        </label>
        <label className="check-row pub-consent-row">
          <input name="thirdPartyConsent" required type="checkbox" value="true" />
          택시연합 예약을 위한 제3자 제공 동의 확인
        </label>
        <label className="check-row pub-consent-row">
          <input name="sensitiveInfoNotCollected" required type="checkbox" value="true" />
          병명, 진료 내용, 주민등록번호는 입력하지 않았음 확인
        </label>
      </fieldset>

      {state.message && !state.ok ? (
        <p className="pub-form-error" role="alert">{state.message}</p>
      ) : null}

      <button className="pub-submit-btn" disabled={pending} type="submit">
        {pending ? "신청 접수 중…" : "공동예약 신청하기"}
      </button>

      <p className="pub-form-note">
        신청 후 운영자가 같은 날짜·방향의 신청자를 확인합니다.
        공동예약 가능 여부는 운영자가 별도로 안내합니다.
      </p>
    </form>
  );
}
