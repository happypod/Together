"use client";

import { useActionState } from "react";
import { submitMobileFormAction, type MobileSubmitState } from "@/app/m/[token]/actions";

const initialState: MobileSubmitState = {
  ok: false,
  message: "",
};

type MobileTokenFormProps = {
  token: string;
  allowedFields: readonly string[];
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

export function MobileTokenForm({ token, allowedFields }: MobileTokenFormProps) {
  const [state, formAction, pending] = useActionState(submitMobileFormAction, initialState);
  const canWriteNotes = allowedFields.includes("notes");
  const canConfirmReturn =
    allowedFields.includes("returnConfirmedAt") || allowedFields.includes("allReturnsConfirmedAt");
  const canConfirmTaxi = allowedFields.includes("reservationConfirmed");
  const canTripCheck = tripCheckFields.some((field) => allowedFields.includes(field));

  return (
    <form action={formAction} className="mobile-form">
      <input name="token" type="hidden" value={token} />
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
      {!canWriteNotes && !canConfirmReturn && !canConfirmTaxi && !canTripCheck ? (
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
