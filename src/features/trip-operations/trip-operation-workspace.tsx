"use client";

import { useActionState } from "react";
import {
  tripOperationAction,
  type TripOperationFormState,
} from "@/app/admin/trips/actions";
import {
  LINKER_STATUS_LABELS,
  LINKER_STATUSES,
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
} from "@/domain/definitions";
import {
  tripStepLabels,
  type LinkerListFilters,
  type LinkerListItem,
  type LinkerOption,
  type TripGroupFilters,
  type TripGroupListItem,
  type TripStep,
} from "@/server/trips/trip-operation-service";

type TripOperationWorkspaceProps = {
  linkers: LinkerListItem[];
  linkerOptions: LinkerOption[];
  groups: TripGroupListItem[];
  filters: {
    linker: LinkerListFilters;
    trip: TripGroupFilters;
  };
  canManageLinkers: boolean;
  canAssignLinker: boolean;
  canTaxiWrite: boolean;
  canTripWrite: boolean;
  notice?: string;
};

const initialState: TripOperationFormState = {
  ok: false,
  message: "",
};

const availableDays = ["월", "화", "수", "목", "금", "토", "일"];
const availableTimeWindows = ["오전", "오후", "저녁"];
const tripStepOrder: TripStep[] = [
  "linkerBoarded",
  "resident1Boarded",
  "resident2Boarded",
  "resident3Boarded",
  "arrivedAtDestination",
  "serviceTaskConfirmed",
  "returnStarted",
];

export function TripOperationWorkspace({
  linkers,
  linkerOptions,
  groups,
  filters,
  canManageLinkers,
  canAssignLinker,
  canTaxiWrite,
  canTripWrite,
  notice,
}: TripOperationWorkspaceProps) {
  const [state, formAction, pending] = useActionState(tripOperationAction, initialState);

  return (
    <div className="trip-workspace">
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

      <section className="trip-panel" aria-labelledby="linker-create-title">
        <div className="section-header">
          <p className="eyebrow">링커 등록</p>
          <h2 id="linker-create-title">활동 준비 기록</h2>
        </div>
        <form action={formAction} className="trip-form">
          <input name="intent" type="hidden" value="createLinker" />
          <div className="field-grid">
            <label>
              동행링커명
              <input maxLength={40} name="name" />
            </label>
            <label>
              연락처
              <input inputMode="tel" maxLength={30} name="phone" />
            </label>
            <label>
              마을명
              <input maxLength={60} name="villageName" />
            </label>
            <label>
              상태
              <select defaultValue="CANDIDATE" name="status">
                {LINKER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LINKER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="trip-checkset">
            <legend>활동 가능 요일</legend>
            {availableDays.map((day) => (
              <label className="check-row" key={day}>
                <input name="availableDays" type="checkbox" value={day} />
                {day}
              </label>
            ))}
          </fieldset>

          <fieldset className="trip-checkset">
            <legend>활동 가능 시간</legend>
            {availableTimeWindows.map((timeWindow) => (
              <label className="check-row" key={timeWindow}>
                <input name="availableTimeWindows" type="checkbox" value={timeWindow} />
                {timeWindow}
              </label>
            ))}
          </fieldset>

          <fieldset className="trip-checkset">
            <legend>필수 준비</legend>
            <label className="check-row">
              <input name="trainingCompleted" type="checkbox" />
              교육 이수
            </label>
            <label className="check-row">
              <input name="fieldPracticeCompleted" type="checkbox" />
              현장실습 이수
            </label>
            <label className="check-row">
              <input name="privacyPledgeSigned" type="checkbox" />
              개인정보보호 서약
            </label>
            <label className="check-row">
              <input name="insuranceRegistered" type="checkbox" />
              보험 등록
            </label>
          </fieldset>

          <label>
            민원·사고 이력 요약
            <textarea maxLength={300} name="incidentComplaintHistory" rows={3} />
          </label>
          <label className="check-row">
            <input name="wantsJobConnection" type="checkbox" />
            취업연계 희망
          </label>
          <label>
            희망 분야
            <input maxLength={80} name="desiredJobField" />
          </label>
          <button className="primary-action" disabled={!canManageLinkers || pending} type="submit">
            {pending ? "저장 중" : canManageLinkers ? "동행링커 등록" : "권한 필요"}
          </button>
        </form>
      </section>

      <section className="trip-panel" aria-labelledby="linker-list-title">
        <div className="section-header">
          <p className="eyebrow">링커 목록</p>
          <h2 id="linker-list-title">상태와 배정 가능 여부</h2>
        </div>
        <form action="/admin/trips" className="trip-filter-form">
          <label>
            검색
            <input
              defaultValue={filters.linker.query ?? ""}
              name="linkerQuery"
              placeholder="이름, 마을, 연락처"
            />
          </label>
          <label>
            상태
            <select defaultValue={filters.linker.status ?? ""} name="linkerStatus">
              <option value="">전체</option>
              {LINKER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LINKER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-action" type="submit">
            필터 적용
          </button>
        </form>
        <div className="linker-list">
          {linkers.length > 0 ? (
            linkers.map((linker) => (
              <article className="linker-card" key={linker.id}>
                <div className="linker-card-header">
                  <div>
                    <strong>{linker.name}</strong>
                    <span>
                      {linker.villageName} · {linker.phoneMasked}
                    </span>
                  </div>
                  <mark>{linker.statusLabel}</mark>
                </div>
                <dl className="trip-summary">
                  <div>
                    <dt>배정 가능</dt>
                    <dd>{linker.readyForAssignment ? "가능" : "준비 필요"}</dd>
                  </div>
                  <div>
                    <dt>활동 횟수</dt>
                    <dd>{linker.activityCount}회</dd>
                  </div>
                  <div>
                    <dt>가능 요일</dt>
                    <dd>{linker.availableDays.join(", ") || "미입력"}</dd>
                  </div>
                  <div>
                    <dt>가능 시간</dt>
                    <dd>{linker.availableTimeWindows.join(", ") || "미입력"}</dd>
                  </div>
                </dl>
                <ul className="trip-flag-list" aria-label={`${linker.name} 필수 준비`}>
                  <li>{linker.trainingCompleted ? "교육 완료" : "교육 필요"}</li>
                  <li>{linker.fieldPracticeCompleted ? "실습 완료" : "실습 필요"}</li>
                  <li>{linker.privacyPledgeSigned ? "서약 완료" : "서약 필요"}</li>
                  <li>{linker.insuranceRegistered ? "보험 등록" : "보험 필요"}</li>
                </ul>
                <form action={formAction} className="trip-inline-form">
                  <input name="intent" type="hidden" value="updateLinkerStatus" />
                  <input name="linkerId" type="hidden" value={linker.id} />
                  <label>
                    상태 변경
                    <select defaultValue={linker.status} name="status">
                      {LINKER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {LINKER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="secondary-action"
                    disabled={!canManageLinkers || pending}
                    type="submit"
                  >
                    상태 저장
                  </button>
                </form>
              </article>
            ))
          ) : (
            <p className="request-empty">조건에 맞는 동행링커가 없습니다.</p>
          )}
        </div>
      </section>

      <section className="trip-panel trip-operation-panel" aria-labelledby="trip-list-title">
        <div className="section-header">
          <p className="eyebrow">운행</p>
          <h2 id="trip-list-title">택시 예약과 귀가확인</h2>
        </div>
        <form action="/admin/trips" className="trip-filter-form">
          <label>
            검색
            <input
              defaultValue={filters.trip.query ?? ""}
              name="query"
              placeholder="그룹명, 주민명, 링커명, 차량번호"
            />
          </label>
          <label>
            운행일
            <input defaultValue={filters.trip.serviceDate ?? ""} name="serviceDate" type="date" />
          </label>
          <label>
            상태
            <select defaultValue={filters.trip.status ?? ""} name="status">
              <option value="">전체</option>
              {MOBILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MOBILITY_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-action" type="submit">
            필터 적용
          </button>
        </form>

        <div className="trip-list">
          {groups.length > 0 ? (
            groups.map((group) => (
              <TripGroupCard
                canAssignLinker={canAssignLinker}
                canTaxiWrite={canTaxiWrite}
                canTripWrite={canTripWrite}
                formAction={formAction}
                group={group}
                key={group.id}
                linkerOptions={linkerOptions}
                pending={pending}
              />
            ))
          ) : (
            <p className="request-empty">조건에 맞는 운행 그룹이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

type TripGroupCardProps = {
  group: TripGroupListItem;
  linkerOptions: LinkerOption[];
  canAssignLinker: boolean;
  canTaxiWrite: boolean;
  canTripWrite: boolean;
  pending: boolean;
  formAction: (formData: FormData) => void;
};

function TripGroupCard({
  group,
  linkerOptions,
  canAssignLinker,
  canTaxiWrite,
  canTripWrite,
  pending,
  formAction,
}: TripGroupCardProps) {
  const availableStepSet = new Set(group.availableTripSteps);

  return (
    <article className="trip-card">
      <div className="trip-card-header">
        <div>
          <strong>{group.groupName}</strong>
          <span>
            {group.serviceDate} · {group.timeWindow} · {group.destinationSummary}
          </span>
        </div>
        <mark>{group.statusLabel}</mark>
      </div>

      <dl className="trip-summary">
        <div>
          <dt>동행링커</dt>
          <dd>{group.linker ? `${group.linker.name} · ${group.linker.phoneMasked}` : "미배정"}</dd>
        </div>
        <div>
          <dt>주민</dt>
          <dd>{group.memberCount}명</dd>
        </div>
        <div>
          <dt>귀가 예정</dt>
          <dd>{group.returnEta || "미입력"}</dd>
        </div>
        <div>
          <dt>예약 상태</dt>
          <dd>{group.taxiReservation?.reservationConfirmed ? "예약확정" : "확정 전"}</dd>
        </div>
      </dl>

      <form action={formAction} className="trip-inline-form">
        <input name="intent" type="hidden" value="assignLinker" />
        <input name="groupId" type="hidden" value={group.id} />
        <label>
          동행링커 배정
          <select defaultValue={group.linker?.id ?? ""} name="linkerId">
            <option value="">활동가능 링커 선택</option>
            {linkerOptions.map((linker) => (
              <option key={linker.id} value={linker.id}>
                {linker.name} · {linker.phoneMasked} · {linker.summary}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-action"
          disabled={!canAssignLinker || linkerOptions.length === 0 || pending}
          type="submit"
        >
          링커 배정
        </button>
      </form>

      <div className="trip-two-column">
        <form action={formAction} className="trip-subform">
          <input name="intent" type="hidden" value="requestTaxi" />
          <input name="groupId" type="hidden" value={group.id} />
          <h3>택시 예약요청</h3>
          <label>
            택시연합 담당자
            <input
              defaultValue={group.taxiReservation?.partnerManagerName ?? ""}
              maxLength={40}
              name="partnerManagerName"
            />
          </label>
          <label>
            요청 메모
            <textarea
              defaultValue={group.taxiReservation?.notes ?? ""}
              maxLength={300}
              name="notes"
              rows={2}
            />
          </label>
          <button className="secondary-action" disabled={!canTaxiWrite || pending} type="submit">
            예약요청 기록
          </button>
        </form>

        <form action={formAction} className="trip-subform">
          <input name="intent" type="hidden" value="confirmTaxi" />
          <input name="groupId" type="hidden" value={group.id} />
          <h3>예약 확정</h3>
          <div className="field-grid">
            <label>
              차량번호
              <input
                defaultValue={group.taxiReservation?.vehicleNumber ?? ""}
                maxLength={40}
                name="vehicleNumber"
              />
            </label>
            <label>
              기사 연락처
              <input inputMode="tel" maxLength={30} name="driverPhone" />
            </label>
            <label>
              확정 시각
              <input
                defaultValue={group.taxiReservation?.confirmedAt ?? ""}
                name="confirmedAt"
                type="datetime-local"
              />
            </label>
            <label>
              예상요금
              <input
                defaultValue={group.taxiReservation?.expectedFare ?? ""}
                inputMode="numeric"
                min={0}
                name="expectedFare"
                type="number"
              />
            </label>
            <label>
              실제요금
              <input
                defaultValue={group.taxiReservation?.actualFare ?? ""}
                inputMode="numeric"
                min={0}
                name="actualFare"
                type="number"
              />
            </label>
            <label>
              영수증 링크
              <input
                defaultValue={group.taxiReservation?.receiptUrl ?? ""}
                maxLength={300}
                name="receiptUrl"
              />
            </label>
          </div>
          <label className="check-row">
            <input
              defaultChecked={group.taxiReservation?.receiptAttached ?? false}
              name="receiptAttached"
              type="checkbox"
            />
            영수증 확인
          </label>
          <button className="primary-action" disabled={!canTaxiWrite || pending} type="submit">
            예약 확정 저장
          </button>
        </form>
      </div>

      <div className="trip-subform">
        <h3>운행 체크</h3>
        <div className="trip-step-grid">
          {tripStepOrder.map((step) => (
            <form action={formAction} className="trip-step-form" key={step}>
              <input name="intent" type="hidden" value="updateTripStatus" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="step" type="hidden" value={step} />
              <button
                className="trip-step-button"
                disabled={!canTripWrite || !availableStepSet.has(step) || pending}
                type="submit"
              >
                {tripStepLabels[step]}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="trip-subform">
        <h3>귀가 확인</h3>
        <div className="return-member-list">
          {group.members.map((member) => (
            <form action={formAction} className="return-row" key={member.id}>
              <input name="intent" type="hidden" value="confirmReturn" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="memberId" type="hidden" value={member.id} />
              <div>
                <strong>
                  {member.pickupOrder}. {member.residentName}
                </strong>
                <span>
                  {member.phoneMasked} · {member.returnConfirmedAt ? "귀가확인 완료" : "확인 전"}
                </span>
              </div>
              <button
                className="secondary-action"
                disabled={!canTripWrite || Boolean(member.returnConfirmedAt) || pending}
                type="submit"
              >
                귀가 확인
              </button>
            </form>
          ))}
        </div>
        <form action={formAction} className="trip-inline-form">
          <input name="intent" type="hidden" value="confirmReturn" />
          <input name="groupId" type="hidden" value={group.id} />
          <input name="confirmAll" type="hidden" value="true" />
          <label>
            특이사항
            <textarea maxLength={500} name="notes" rows={2} />
          </label>
          <button className="primary-action" disabled={!canTripWrite || pending} type="submit">
            전체 귀가 확인
          </button>
        </form>
      </div>
    </article>
  );
}
