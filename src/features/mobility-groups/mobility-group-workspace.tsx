"use client";

import { useActionState } from "react";
import { Slice } from "@/components/ui/slice";
import {
  groupOperationAction,
  type GroupOperationFormState,
} from "@/app/admin/groups/actions";
import {
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
} from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  type GroupCandidateRequest,
  type MobilityGroupListFilters,
  type MobilityGroupListItem,
} from "@/server/groups/mobility-group-service";
import { type OperatingSettings } from "@/server/settings/defaults";

type MobilityGroupWorkspaceProps = {
  settings: OperatingSettings;
  candidates: GroupCandidateRequest[];
  groups: MobilityGroupListItem[];
  filters: MobilityGroupListFilters;
  canWrite: boolean;
  notice?: string;
};

const initialState: GroupOperationFormState = {
  ok: false,
  message: "",
};

export function MobilityGroupWorkspace({
  settings,
  candidates,
  groups,
  filters,
  canWrite,
  notice,
}: MobilityGroupWorkspaceProps) {
  const [state, formAction, pending] = useActionState(groupOperationAction, initialState);

  return (
    <div className="group-workspace">
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

      <section className="group-panel" aria-labelledby="group-create-title">
        <div className="section-header">
          <p className="eyebrow">그룹 생성</p>
          <h2 id="group-create-title">후보 신청 선택</h2>
        </div>
        <form action={formAction} className="group-form">
          <input name="intent" type="hidden" value="createGroup" />
          <p className="group-limit">
            최대 {settings.maxGroupResidents}명 선택
          </p>
          <div className="candidate-list">
            {candidates.length > 0 ? (
              candidates.map((candidate) => (
                <label className="candidate-row" key={candidate.id}>
                  <input
                    disabled={!canWrite}
                    name="requestIds"
                    type="checkbox"
                    value={candidate.id}
                  />
                  <span>
                    <strong>{candidate.residentName}</strong>
                    <small>
                      {candidate.desiredDate} · {candidate.desiredTimeWindow} ·{" "}
                      {candidate.phoneMasked}
                    </small>
                    <em>
                      {candidate.origin} → {candidate.destination}
                    </em>
                  </span>
                </label>
              ))
            ) : (
              <p className="request-empty">그룹에 넣을 후보 신청이 없습니다.</p>
            )}
          </div>
          <label>
            목적지 요약
            <input maxLength={120} name="destinationSummary" placeholder="예: 백천종합병원" />
          </label>
          <label>
            귀가 예정시간
            <input name="returnEta" type="datetime-local" />
          </label>
          <label>
            그룹 메모
            <textarea
              maxLength={300}
              name="notes"
              placeholder="운영자가 판단한 편성 사유만 짧게 적어 주세요."
              rows={3}
            />
          </label>
          <button className="primary-action" disabled={!canWrite || pending} type="submit">
            {pending ? "저장 중" : canWrite ? "공동예약 그룹 생성" : "로그인 후 생성"}
          </button>
        </form>
      </section>

      <section className="group-panel" aria-labelledby="group-list-title">
        <div className="section-header">
          <p className="eyebrow">그룹 목록</p>
          <h2 id="group-list-title">상태와 픽업 순서</h2>
        </div>
        <form action="/admin/groups" className="group-filter-form">
          <label>
            검색
            <input
              defaultValue={filters.query ?? ""}
              name="query"
              placeholder="그룹명, 목적지, 주민명"
            />
          </label>
          <label>
            운행일
            <input defaultValue={filters.serviceDate ?? ""} name="serviceDate" type="date" />
          </label>
          <label>
            상태
            <select defaultValue={filters.status ?? ""} name="status">
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

        <div className="group-list">
          {groups.length > 0 ? (
            groups.map((group) => (
              <GroupCard
                canWrite={canWrite}
                candidates={candidates}
                formAction={formAction}
                group={group}
                key={group.id}
                maxGroupResidents={settings.maxGroupResidents}
                pending={pending}
              />
            ))
          ) : (
            <p className="request-empty">조건에 맞는 공동예약 그룹이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}

type GroupCardProps = {
  group: MobilityGroupListItem;
  candidates: GroupCandidateRequest[];
  maxGroupResidents: number;
  canWrite: boolean;
  pending: boolean;
  formAction: (formData: FormData) => void;
};

function GroupCard({
  group,
  candidates,
  maxGroupResidents,
  canWrite,
  pending,
  formAction,
}: GroupCardProps) {
  const matchingCandidates = candidates.filter(
    (candidate) =>
      candidate.desiredDate === group.serviceDate &&
      candidate.desiredTimeWindow === group.timeWindow,
  );
  const canAddMember = canWrite && group.memberCount < maxGroupResidents;

  return (
    <article className="group-card">
      <div className="group-card-header">
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

      <dl className="group-summary">
        <div>
          <dt>주민</dt>
          <dd>
            {group.memberCount}/{maxGroupResidents}명
          </dd>
        </div>
        <div>
          <dt>귀가 예정</dt>
          <dd>{group.returnEta || "미입력"}</dd>
        </div>
        <div>
          <dt>다음 행동</dt>
          <dd>
            {group.nextStatuses.length > 0
              ? group.nextStatuses.map((status) => status.label).join(", ")
              : "최종 상태"}
          </dd>
        </div>
        <div>
          <dt>사유</dt>
          <dd>{group.exceptionReason || "없음"}</dd>
        </div>
      </dl>

      <Slice
        icon="users"
        summary={`${group.memberCount}/${maxGroupResidents}명`}
        title="주민·픽업 순서"
        defaultOpen
      >
      <div className="member-list" aria-label={`${group.groupName} 멤버`}>
        {group.members.map((member) => (
          <div className="group-member-row" key={member.id}>
            <div className="member-title">
              <strong>
                {member.pickupOrder}. {member.residentName}
              </strong>
              <span>{member.phoneMasked}</span>
            </div>
            <form action={formAction} className="pickup-form">
              <input name="groupId" type="hidden" value={group.id} />
              <input name="memberId" type="hidden" value={member.id} />
              <label>
                순서
                <input
                  defaultValue={member.pickupOrder}
                  max={maxGroupResidents}
                  min={1}
                  name="pickupOrder"
                  type="number"
                />
              </label>
              <label>
                픽업 예정
                <input defaultValue={member.pickupEta} name="pickupEta" type="datetime-local" />
              </label>
              <label>
                픽업 장소
                <input defaultValue={member.pickupPlace} maxLength={120} name="pickupPlace" />
              </label>
              <button
                className="secondary-action"
                disabled={!canWrite || pending}
                name="intent"
                type="submit"
                value="updatePickup"
              >
                픽업 저장
              </button>
            </form>
            <form action={formAction}>
              <input name="groupId" type="hidden" value={group.id} />
              <input name="memberId" type="hidden" value={member.id} />
              <button
                className="text-danger-action"
                disabled={!canWrite || pending}
                name="intent"
                type="submit"
                value="removeMember"
              >
                멤버 제거
              </button>
            </form>
          </div>
        ))}
      </div>
      </Slice>

      <Slice icon="add" title="후보 추가" summary={canAddMember ? "추가 가능" : "정원/권한 확인"}>
      <form action={formAction} className="group-inline-form">
        <input name="groupId" type="hidden" value={group.id} />
        <label>
          후보 추가
          <select disabled={!canAddMember} name="requestId">
            <option value="">같은 날짜·시간대 후보 선택</option>
            {matchingCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.residentName} · {candidate.origin}
              </option>
            ))}
          </select>
        </label>
        <label>
          픽업 장소
          <input maxLength={120} name="pickupPlace" placeholder="미입력 시 신청 출발지 사용" />
        </label>
        <label>
          픽업 예정
          <input name="pickupEta" type="datetime-local" />
        </label>
        <button
          className="secondary-action"
          disabled={!canAddMember || matchingCandidates.length === 0 || pending}
          name="intent"
          type="submit"
          value="addMember"
        >
          멤버 추가
        </button>
      </form>
      </Slice>

      <Slice
        icon="rotate"
        title="상태 변경"
        summary={
          group.nextStatuses.length > 0
            ? group.nextStatuses.map((status) => status.label).join(", ")
            : "최종 상태"
        }
        tone="accent"
      >
      <form action={formAction} className="group-inline-form">
        <input name="groupId" type="hidden" value={group.id} />
        <label>
          상태 변경
          <select disabled={!canWrite || group.nextStatuses.length === 0} name="nextStatus">
            <option value="">다음 상태 선택</option>
            {group.nextStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          취소·예외 사유
          <textarea
            maxLength={300}
            name="reason"
            placeholder="예외 상태일 때 필요한 사유만 적어 주세요."
            rows={2}
          />
        </label>
        <button
          className="secondary-action"
          disabled={!canWrite || group.nextStatuses.length === 0 || pending}
          name="intent"
          type="submit"
          value="transitionStatus"
        >
          상태 변경
        </button>
      </form>
      </Slice>
    </article>
  );
}
