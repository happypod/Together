"use client";

import { useActionState } from "react";
import { FaIcon } from "@/components/ui/fa-icon";
import { Slice } from "@/components/ui/slice";
import { SurveyScale } from "@/components/ui/survey-scale";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import {
  tripOperationAction,
  type TripOperationFormState,
} from "@/app/admin/trips/actions";
import {
  INCIDENT_TYPES,
  INCIDENT_TYPE_LABELS,
  LINKER_STATUS_LABELS,
  LINKER_STATUSES,
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
  SURVEY_QUESTIONS,
  describeSurveyScore,
} from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  tripStepLabels,
  type LinkerListFilters,
  type LinkerListItem,
  type LinkerOption,
  type TripGroupFilters,
  type TripGroupListItem,
  type TripStep,
} from "@/server/trips/trip-operation-service";
import { type GroupSurveySummary } from "@/server/surveys/satisfaction-survey-service";

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
  canSubmitSurvey: boolean;
  canIncidentWrite: boolean;
  canIssueMobileLink: boolean;
  surveySummaries: Record<string, GroupSurveySummary>;
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
  canSubmitSurvey,
  canIncidentWrite,
  canIssueMobileLink,
  surveySummaries,
  notice,
}: TripOperationWorkspaceProps) {
  const [state, formAction, pending] = useActionState(tripOperationAction, initialState);

  const createLinkerSection = (
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
          <textarea
            maxLength={300}
            name="incidentComplaintHistory"
            placeholder="건강정보 없이 운영에 필요한 요약만 적어 주세요."
            rows={3}
          />
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
  );

  const linkerListSection = (
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
                <mark data-ready={linker.readyForAssignment}>{linker.statusLabel}</mark>
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
                <li data-ok={linker.trainingCompleted}>{linker.trainingCompleted ? "교육 완료" : "교육 필요"}</li>
                <li data-ok={linker.fieldPracticeCompleted}>{linker.fieldPracticeCompleted ? "실습 완료" : "실습 필요"}</li>
                <li data-ok={linker.privacyPledgeSigned}>{linker.privacyPledgeSigned ? "서약 완료" : "서약 필요"}</li>
                <li data-ok={linker.insuranceRegistered}>{linker.insuranceRegistered ? "보험 등록" : "보험 필요"}</li>
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
  );

  const tripSection = (
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
              canIncidentWrite={canIncidentWrite}
              canIssueMobileLink={canIssueMobileLink}
              canSubmitSurvey={canSubmitSurvey}
              canTaxiWrite={canTaxiWrite}
              canTripWrite={canTripWrite}
              formAction={formAction}
              group={group}
              key={group.id}
              linkerOptions={linkerOptions}
              pending={pending}
              surveySummary={surveySummaries[group.id]}
            />
          ))
        ) : (
          <p className="request-empty">조건에 맞는 운행 그룹이 없습니다.</p>
        )}
      </div>
    </section>
  );

  const tabs: TabItem[] = [
    { id: "linker-new", label: "링커 등록", icon: "add", content: createLinkerSection },
    {
      id: "linker-list",
      label: "링커 목록",
      icon: "clipboardList",
      badge: linkers.length,
      content: linkerListSection,
    },
    { id: "trips", label: "운행", icon: "car", badge: groups.length, content: tripSection },
  ];

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
      <p className="privacy-guidance">{PRIVACY_INPUT_GUIDANCE}</p>

      <Tabs ariaLabel="동행링커 운영 메뉴" defaultTabId="trips" tabs={tabs} />
    </div>
  );
}

type TripGroupCardProps = {
  group: TripGroupListItem;
  linkerOptions: LinkerOption[];
  canAssignLinker: boolean;
  canTaxiWrite: boolean;
  canTripWrite: boolean;
  canSubmitSurvey: boolean;
  canIncidentWrite: boolean;
  canIssueMobileLink: boolean;
  surveySummary?: GroupSurveySummary;
  pending: boolean;
  formAction: (formData: FormData) => void;
};

function TripGroupCard({
  group,
  linkerOptions,
  canAssignLinker,
  canTaxiWrite,
  canTripWrite,
  canSubmitSurvey,
  canIncidentWrite,
  canIssueMobileLink,
  surveySummary,
  pending,
  formAction,
}: TripGroupCardProps) {
  const availableStepSet = new Set(group.availableTripSteps);
  const canAssignInCurrentStatus =
    group.status === "LINKER_RECRUITING" || group.status === "LINKER_ASSIGNED";
  const canRequestTaxiInCurrentStatus =
    group.status === "LINKER_ASSIGNED" || group.status === "TAXI_REQUESTED";
  const canConfirmTaxiInCurrentStatus =
    group.status === "TAXI_REQUESTED" || group.status === "TAXI_CONFIRMED";
  const returnDone = group.members.filter((member) => member.returnConfirmedAt).length;

  return (
    <article className="trip-card">
      <div className="trip-card-header">
        <div>
          <strong>{group.groupName}</strong>
          <span>
            {group.serviceDate} · {group.timeWindow} · {group.destinationSummary}
          </span>
        </div>
        <mark className="status-badge" data-status={group.status}>
          {group.statusLabel}
        </mark>
      </div>
      <p className="next-action">
        <span aria-hidden="true">
          <FaIcon name="arrowRight" />
        </span>{" "}
        다음 행동: <strong>{group.nextActionLabel}</strong>
      </p>

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

      <div className="slice-stack">
        <Slice
          icon="users"
          summary={group.linker ? group.linker.name : "미배정"}
          title="동행링커 배정"
          tone="accent"
          defaultOpen={canAssignInCurrentStatus}
        >
          <form action={formAction} className="trip-inline-form">
            <input name="intent" type="hidden" value="assignLinker" />
            <input name="groupId" type="hidden" value={group.id} />
            <label>
              동행링커 배정
              <select
                defaultValue={group.linker?.id ?? ""}
                disabled={!canAssignInCurrentStatus || !canAssignLinker}
                name="linkerId"
              >
                <option value="">활동가능 링커 선택</option>
                {linkerOptions.map((linker) => (
                  <option key={linker.id} value={linker.id}>
                    {linker.name} · {linker.phoneMasked}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="secondary-action"
              disabled={
                !canAssignLinker ||
                !canAssignInCurrentStatus ||
                linkerOptions.length === 0 ||
                pending
              }
              type="submit"
            >
              링커 배정
            </button>
          </form>
        </Slice>

        <Slice
          icon="taxi"
          summary={group.taxiReservation?.reservationConfirmed ? "예약확정" : "확정 전"}
          title="택시 예약"
          defaultOpen={canRequestTaxiInCurrentStatus || canConfirmTaxiInCurrentStatus}
        >
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
                  placeholder="예약에 필요한 내용만 적어 주세요."
                  rows={2}
                />
              </label>
              <button
                className="secondary-action"
                disabled={!canTaxiWrite || !canRequestTaxiInCurrentStatus || pending}
                type="submit"
              >
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
              <button
                className="primary-action"
                disabled={!canTaxiWrite || !canConfirmTaxiInCurrentStatus || pending}
                type="submit"
              >
                예약 확정 저장
              </button>
            </form>
          </div>
        </Slice>

        <Slice icon="checklist" summary={`${group.availableTripSteps.length}단계 가능`} title="운행 체크">
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
        </Slice>

        <Slice
          icon="home"
          summary={`${returnDone}/${group.members.length} 귀가확인`}
          title="귀가 확인"
        >
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
              <textarea
                maxLength={500}
                name="notes"
                placeholder="귀가 확인에 필요한 내용만 적어 주세요."
                rows={2}
              />
            </label>
            <button className="primary-action" disabled={!canTripWrite || pending} type="submit">
              전체 귀가 확인
            </button>
          </form>
        </Slice>

        <Slice
          icon="warning"
          summary={`${group.incidentReports.length}건 기록`}
          title="사고·민원 기록"
          tone={group.incidentReports.length > 0 ? "accent" : "neutral"}
        >
          <form action={formAction} className="incident-report-form trip-subform">
            <input name="intent" type="hidden" value="createIncidentReport" />
            <input name="groupId" type="hidden" value={group.id} />
            <p className="privacy-guidance incident-privacy-note">{PRIVACY_INPUT_GUIDANCE}</p>
            <div className="field-grid">
              <label>
                유형
                <select defaultValue="" disabled={!canIncidentWrite} name="incidentType" required>
                  <option value="">선택</option>
                  {INCIDENT_TYPES.map((incidentType) => (
                    <option key={incidentType} value={incidentType}>
                      {INCIDENT_TYPE_LABELS[incidentType]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                발생 시각
                <input disabled={!canIncidentWrite} name="occurredAt" type="datetime-local" />
              </label>
            </div>
            <label>
              내용
              <textarea
                disabled={!canIncidentWrite}
                maxLength={600}
                name="description"
                placeholder="상황과 운영에 필요한 사실만 적어 주세요."
                required
                rows={4}
              />
            </label>
            <label>
              조치
              <textarea
                disabled={!canIncidentWrite}
                maxLength={500}
                name="actionTaken"
                placeholder="안내, 확인, 후속 조치 등"
                rows={3}
              />
            </label>
            <button className="primary-action" disabled={!canIncidentWrite || pending} type="submit">
              {canIncidentWrite ? "사고·민원 저장" : "권한 필요"}
            </button>
          </form>

          <div className="incident-report-list" aria-label={`${group.groupName} 사고·민원 기록`}>
            {group.incidentReports.length > 0 ? (
              group.incidentReports.map((report) => (
                <article className="incident-report-card" key={report.id}>
                  <div className="incident-report-card-header">
                    <strong>{report.incidentTypeLabel}</strong>
                    <span>{report.occurredAt || report.createdAt}</span>
                  </div>
                  <p>{report.description}</p>
                  {report.actionTaken ? <small>조치: {report.actionTaken}</small> : null}
                  <small>기록: {report.reportedByName}</small>
                </article>
              ))
            ) : (
              <p className="form-help">등록된 사고·민원 기록이 없습니다.</p>
            )}
          </div>
        </Slice>

        <Slice
          icon="clipboardList"
          summary={canIssueMobileLink ? "현장 입력 링크" : "권한 필요"}
          title="모바일 링크 발급"
          tone="accent"
        >
          <p className="form-help">
            링크를 받은 사람은 관리자 화면에 들어오지 않고, 선택한 항목만 1회 입력합니다.
          </p>
          <div className="mobile-link-issue-list">
            <form action={formAction} className="mobile-link-issue-form">
              <input name="intent" type="hidden" value="issueMobileLink" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="scope" type="hidden" value="TRIP_CHECK" />
              <div>
                <strong>운행 체크</strong>
                <span>탑승, 도착, 귀가 출발과 사고·민원을 현장에서 체크합니다.</span>
              </div>
              <button
                className="secondary-action"
                disabled={!canIssueMobileLink || group.availableTripSteps.length === 0 || pending}
                type="submit"
              >
                운행 체크 링크
              </button>
            </form>
            <form action={formAction} className="mobile-link-issue-form">
              <input name="intent" type="hidden" value="issueMobileLink" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="scope" type="hidden" value="RETURN_CONFIRM" />
              <div>
                <strong>귀가 확인</strong>
                <span>그룹 전체 귀가 확인과 특이사항을 남깁니다.</span>
              </div>
              <button
                className="secondary-action"
                disabled={!canIssueMobileLink || returnDone >= group.members.length || pending}
                type="submit"
              >
                귀가 확인 링크
              </button>
            </form>
            <form action={formAction} className="mobile-link-issue-form">
              <input name="intent" type="hidden" value="issueMobileLink" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="scope" type="hidden" value="TAXI_CONFIRM" />
              <div>
                <strong>택시 확정</strong>
                <span>차량번호, 기사 연락처, 요금, 영수증 링크를 입력합니다.</span>
              </div>
              <button
                className="secondary-action"
                disabled={
                  !canIssueMobileLink ||
                  !canConfirmTaxiInCurrentStatus ||
                  !group.taxiReservation ||
                  pending
                }
                type="submit"
              >
                택시 확정 링크
              </button>
            </form>
            <form action={formAction} className="mobile-link-issue-form">
              <input name="intent" type="hidden" value="issueMobileLink" />
              <input name="groupId" type="hidden" value={group.id} />
              <input name="scope" type="hidden" value="SURVEY_SUBMIT" />
              <div>
                <strong>만족도 입력</strong>
                <span>정서회복, 만족도, 재이용 의향을 최대 5회 수집합니다.</span>
              </div>
              <button className="secondary-action" disabled={!canIssueMobileLink || pending} type="submit">
                만족도 링크
              </button>
            </form>
          </div>
        </Slice>

        <Slice
          icon="heart"
          summary={
            surveySummary && surveySummary.count > 0
              ? `${surveySummary.count}명 · 정서회복 ${describeSurveyScore(surveySummary.emotionalRecoveryAvg).label}`
              : "응답 없음"
          }
          title="만족도·정서회복"
          tone="accent"
        >
          {surveySummary && surveySummary.count > 0 ? (
            <dl className="survey-summary">
              <div>
                <dt>응답</dt>
                <dd>{surveySummary.count}명</dd>
              </div>
              <div>
                <dt>정서회복</dt>
                <dd>
                  <FaIcon name={describeSurveyScore(surveySummary.emotionalRecoveryAvg).icon} />{" "}
                  {surveySummary.emotionalRecoveryAvg ?? "—"}
                </dd>
              </div>
              <div>
                <dt>만족도</dt>
                <dd>
                  <FaIcon name={describeSurveyScore(surveySummary.satisfactionAvg).icon} />{" "}
                  {surveySummary.satisfactionAvg ?? "—"}
                </dd>
              </div>
              <div>
                <dt>재이용</dt>
                <dd>
                  <FaIcon name={describeSurveyScore(surveySummary.reuseAvg).icon} />{" "}
                  {surveySummary.reuseAvg ?? "—"}
                </dd>
              </div>
              <div>
                <dt>마음이 좋아짐</dt>
                <dd>
                  {surveySummary.recoveredCount}/{surveySummary.count}명
                </dd>
              </div>
              <div>
                <dt>다시 이용 의향</dt>
                <dd>
                  {surveySummary.recommendCount}/{surveySummary.count}명
                </dd>
              </div>
            </dl>
          ) : (
            <p className="form-help">아직 수집된 만족도 응답이 없습니다.</p>
          )}

          <form action={formAction} className="survey-record-form">
            <input name="intent" type="hidden" value="submitSurvey" />
            <input name="groupId" type="hidden" value={group.id} />
            <p className="form-help">
              참여자에게 여쭤보고 함께 답하거나, 아래에서 모바일 입력 링크를 만들 수 있습니다.
            </p>
            <SurveyScale
              disabled={!canSubmitSurvey}
              legend={SURVEY_QUESTIONS.emotionalRecovery.legend}
              name={SURVEY_QUESTIONS.emotionalRecovery.field}
              options={SURVEY_QUESTIONS.emotionalRecovery.options}
            />
            <SurveyScale
              disabled={!canSubmitSurvey}
              legend={SURVEY_QUESTIONS.userSatisfaction.legend}
              name={SURVEY_QUESTIONS.userSatisfaction.field}
              options={SURVEY_QUESTIONS.userSatisfaction.options}
            />
            <SurveyScale
              disabled={!canSubmitSurvey}
              legend={SURVEY_QUESTIONS.reuseIntent.legend}
              name={SURVEY_QUESTIONS.reuseIntent.field}
              options={SURVEY_QUESTIONS.reuseIntent.options}
            />
            <label>
              한마디 (선택)
              <textarea
                maxLength={300}
                name="improvementRequest"
                placeholder="민감정보 없이 짧게 적어 주세요."
                rows={2}
              />
            </label>
            <button className="primary-action" disabled={!canSubmitSurvey || pending} type="submit">
              만족도 저장
            </button>
          </form>

          {canIssueMobileLink ? (
            <p className="form-help">모바일 만족도 링크는 위의 모바일 링크 발급 메뉴에서 만들 수 있습니다.</p>
          ) : null}
        </Slice>
      </div>
    </article>
  );
}
