"use client";

import { useActionState } from "react";
import { submitMobileFormAction, type MobileSubmitState } from "@/app/m/[token]/actions";
import { SurveyScale } from "@/components/ui/survey-scale";
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  MOBILITY_PURPOSE_LABELS,
  MOBILITY_PURPOSES,
  SURVEY_QUESTIONS,
  type MobileTokenScope,
} from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import { type OperatingSettings } from "@/server/settings/defaults";

const initialState: MobileSubmitState = {
  ok: false,
  message: "",
};

type MobileTokenFormProps = {
  token: string;
  scope: MobileTokenScope;
  allowedFields: readonly string[];
  settings: Pick<OperatingSettings, "villages" | "timeWindows">;
};

const tripCheckFields = [
  "linkerBoardedAt",
  "resident1BoardedAt",
  "resident2BoardedAt",
  "resident3BoardedAt",
  "arrivedAtDestination",
  "serviceTaskConfirmed",
  "returnStartedAt",
] as const;

export function MobileTokenForm({ token, scope, allowedFields, settings }: MobileTokenFormProps) {
  const [state, formAction, pending] = useActionState(submitMobileFormAction, initialState);
  const canRequestIntake = scope === "REQUEST_INTAKE";
  const canWriteNotes = allowedFields.includes("notes");
  const canConfirmReturn =
    allowedFields.includes("returnConfirmedAt") || allowedFields.includes("allReturnsConfirmedAt");
  const canConfirmTaxi = allowedFields.includes("reservationConfirmed");
  const canTripCheck = tripCheckFields.some((field) => allowedFields.includes(field));
  const canReportIncident = allowedFields.includes("incidentType");
  const canSurvey =
    allowedFields.includes("emotionalRecovery") || allowedFields.includes("userSatisfaction");

  return (
    <form action={formAction} className="mobile-form">
      <input name="token" type="hidden" value={token} />
      <p className="privacy-guidance mobile-privacy-note">{PRIVACY_INPUT_GUIDANCE}</p>
      {canRequestIntake ? (
        <>
          <fieldset>
            <legend>주민 정보</legend>
            <label>
              주민명
              <input autoComplete="name" maxLength={80} name="residentName" required />
            </label>
            <label>
              연락처
              <input autoComplete="tel" inputMode="tel" maxLength={30} name="phone" required />
            </label>
            <label>
              보호자 연락처 (선택)
              <input autoComplete="tel" inputMode="tel" maxLength={30} name="guardianPhone" />
            </label>
            <label>
              마을명
              <select name="villageName" required>
                <option value="">선택</option>
                {settings.villages.map((village) => (
                  <option key={village} value={village}>
                    {village}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>이동 신청</legend>
            <label>
              희망일
              <input name="desiredDate" required type="date" />
            </label>
            <label>
              희망 시간대
              <select name="desiredTimeWindow" required>
                <option value="">선택</option>
                {settings.timeWindows.map((timeWindow) => (
                  <option key={timeWindow} value={timeWindow}>
                    {timeWindow}
                  </option>
                ))}
              </select>
            </label>
            <label>
              이동 목적
              <select name="purpose" required>
                <option value="">선택</option>
                {MOBILITY_PURPOSES.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {MOBILITY_PURPOSE_LABELS[purpose]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              동행 필요
              <select defaultValue="true" name="needsCompanion">
                <option value="true">필요</option>
                <option value="false">불필요</option>
              </select>
            </label>
            <label>
              출발지
              <input maxLength={120} name="origin" required />
            </label>
            <label>
              목적지
              <input maxLength={120} name="destination" required />
            </label>
          </fieldset>

          <fieldset className="privacy-checks">
            <legend>필수 확인</legend>
            <label className="check-row">
              <input name="privacyConsent" required type="checkbox" value="true" />
              개인정보 수집·이용 동의 확인
            </label>
            <label className="check-row">
              <input name="thirdPartyConsent" required type="checkbox" value="true" />
              택시예약 등 제3자 제공 동의 확인
            </label>
            <label className="check-row">
              <input name="sensitiveInfoNotCollected" required type="checkbox" value="true" />
              주민등록번호와 건강 세부정보를 입력하지 않았음
            </label>
          </fieldset>
        </>
      ) : null}
      {canSurvey ? (
        <div className="survey-block">
          <p className="survey-intro">버튼을 눌러 답해 주세요. 세 가지만 여쭤봅니다.</p>
          <SurveyScale
            legend={SURVEY_QUESTIONS.emotionalRecovery.legend}
            name={SURVEY_QUESTIONS.emotionalRecovery.field}
            options={SURVEY_QUESTIONS.emotionalRecovery.options}
          />
          <SurveyScale
            legend={SURVEY_QUESTIONS.userSatisfaction.legend}
            name={SURVEY_QUESTIONS.userSatisfaction.field}
            options={SURVEY_QUESTIONS.userSatisfaction.options}
          />
          <SurveyScale
            legend={SURVEY_QUESTIONS.reuseIntent.legend}
            name={SURVEY_QUESTIONS.reuseIntent.field}
            options={SURVEY_QUESTIONS.reuseIntent.options}
          />
          <label>
            더 하고 싶은 말씀 (선택)
            <textarea
              maxLength={300}
              name="improvementRequest"
              placeholder="없으면 비워 두셔도 됩니다."
              rows={3}
            />
          </label>
        </div>
      ) : null}
      {allowedFields.includes("linkerBoardedAt") ? (
        <label className="check-row">
          <input name="linkerBoardedAt" type="checkbox" value="true" />
          동행링커 탑승 확인
        </label>
      ) : null}
      {allowedFields.includes("resident1BoardedAt") ? (
        <label className="check-row">
          <input name="resident1BoardedAt" type="checkbox" value="true" />
          1번 주민 탑승 확인
        </label>
      ) : null}
      {allowedFields.includes("resident2BoardedAt") ? (
        <label className="check-row">
          <input name="resident2BoardedAt" type="checkbox" value="true" />
          2번 주민 탑승 확인
        </label>
      ) : null}
      {allowedFields.includes("resident3BoardedAt") ? (
        <label className="check-row">
          <input name="resident3BoardedAt" type="checkbox" value="true" />
          3번 주민 탑승 확인
        </label>
      ) : null}
      {allowedFields.includes("arrivedAtDestination") ? (
        <label className="check-row">
          <input name="arrivedAtDestination" type="checkbox" value="true" />
          목적지 도착 확인
        </label>
      ) : null}
      {allowedFields.includes("serviceTaskConfirmed") ? (
        <label className="check-row">
          <input name="serviceTaskConfirmed" type="checkbox" value="true" />
          생활업무 완료 확인
        </label>
      ) : null}
      {allowedFields.includes("returnStartedAt") ? (
        <label className="check-row">
          <input name="returnStartedAt" type="checkbox" value="true" />
          귀가 출발 확인
        </label>
      ) : null}
      {canReportIncident ? (
        <fieldset className="mobile-incident-fieldset">
          <legend>사고·민원</legend>
          <label>
            유형
            <select name="incidentType">
              <option value="">없음</option>
              {INCIDENT_TYPES.map((incidentType) => (
                <option key={incidentType} value={incidentType}>
                  {INCIDENT_TYPE_LABELS[incidentType]}
                </option>
              ))}
            </select>
          </label>
          <label>
            발생 시각
            <input name="incidentOccurredAt" type="datetime-local" />
          </label>
          <label>
            내용
            <textarea
              maxLength={600}
              name="incidentDescription"
              placeholder="상황과 운영에 필요한 사실만 적어 주세요."
              rows={4}
            />
          </label>
          <label>
            조치
            <textarea
              maxLength={500}
              name="incidentActionTaken"
              placeholder="안내, 확인, 후속 조치 등"
              rows={3}
            />
          </label>
        </fieldset>
      ) : null}
      {canConfirmReturn ? (
        <label className="check-row">
          <input
            name={
              allowedFields.includes("allReturnsConfirmedAt")
                ? "allReturnsConfirmedAt"
                : "returnConfirmedAt"
            }
            type="checkbox"
            value="true"
          />
          귀가 확인
        </label>
      ) : null}
      {canConfirmTaxi ? (
        <>
          <label className="check-row">
            <input name="reservationConfirmed" type="checkbox" value="true" />
            예약 확정
          </label>
          {allowedFields.includes("partnerManagerName") ? (
            <label>
              담당자
              <input maxLength={40} name="partnerManagerName" />
            </label>
          ) : null}
          {allowedFields.includes("vehicleNumber") ? (
            <label>
              차량번호
              <input maxLength={40} name="vehicleNumber" />
            </label>
          ) : null}
          {allowedFields.includes("driverPhone") ? (
            <label>
              기사 연락처
              <input inputMode="tel" maxLength={30} name="driverPhone" />
            </label>
          ) : null}
          {allowedFields.includes("expectedFare") ? (
            <label>
              예상요금
              <input inputMode="numeric" min={0} name="expectedFare" type="number" />
            </label>
          ) : null}
          {allowedFields.includes("actualFare") ? (
            <label>
              실제요금
              <input inputMode="numeric" min={0} name="actualFare" type="number" />
            </label>
          ) : null}
          {allowedFields.includes("receiptUrl") ? (
            <label>
              영수증 링크
              <input maxLength={300} name="receiptUrl" />
            </label>
          ) : null}
        </>
      ) : null}
      {canWriteNotes ? (
        <label>
          확인 내용
          <textarea
            maxLength={500}
            name="notes"
            placeholder="민감정보 없이 필요한 내용만 적어 주세요."
            rows={4}
          />
        </label>
      ) : null}
      {!canRequestIntake &&
      !canWriteNotes &&
      !canConfirmReturn &&
      !canConfirmTaxi &&
      !canTripCheck &&
      !canReportIncident &&
      !canSurvey ? (
        <p className="form-message">이 링크는 현재 화면에서 바로 입력할 항목이 없습니다.</p>
      ) : null}
      {state.message ? (
        <p className={state.ok ? "form-message success" : "form-message"} role="status">
          {state.message}
        </p>
      ) : null}
      <button className="primary-action" disabled={pending} type="submit">
        {pending ? "저장 중" : "저장"}
      </button>
    </form>
  );
}
