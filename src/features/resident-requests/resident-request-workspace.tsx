"use client";

import { useActionState } from "react";
import {
  createResidentRequestAction,
  type ResidentRequestFormState,
} from "@/app/admin/requests/actions";
import {
  MOBILITY_PURPOSE_LABELS,
  MOBILITY_PURPOSES,
  MOBILITY_STATUS_LABELS,
  MOBILITY_STATUSES,
} from "@/domain/definitions";
import {
  type ResidentOption,
  type ResidentRequestListFilters,
  type ResidentRequestListItem,
} from "@/server/residents/resident-request-service";
import { type OperatingSettings } from "@/server/settings/defaults";

type ResidentRequestWorkspaceProps = {
  settings: OperatingSettings;
  residents: ResidentOption[];
  requests: ResidentRequestListItem[];
  filters: ResidentRequestListFilters;
  canWrite: boolean;
  notice?: string;
};

const initialState: ResidentRequestFormState = {
  ok: false,
  message: "",
};

export function ResidentRequestWorkspace({
  settings,
  residents,
  requests,
  filters,
  canWrite,
  notice,
}: ResidentRequestWorkspaceProps) {
  const [state, formAction, pending] = useActionState(
    createResidentRequestAction,
    initialState,
  );

  return (
    <div className="request-workspace">
      {notice ? (
        <p className="request-notice" role="status">
          {notice}
        </p>
      ) : null}

      <section className="request-form-panel" aria-labelledby="request-create-title">
        <div className="section-header">
          <p className="eyebrow">신청 등록</p>
          <h2 id="request-create-title">주민과 이동 신청</h2>
        </div>
        <form action={formAction} className="request-form">
          <fieldset>
            <legend>주민 정보</legend>
            <label>
              기존 주민 선택
              <select name="residentId">
                <option value="">새 주민으로 등록</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} · {resident.villageName} · {resident.phoneMasked}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-grid">
              <label>
                주민명
                <input autoComplete="name" maxLength={80} name="residentName" />
              </label>
              <label>
                연락처
                <input autoComplete="tel" inputMode="tel" maxLength={30} name="phone" />
              </label>
              <label>
                보호자 연락처
                <input autoComplete="tel" inputMode="tel" maxLength={30} name="guardianPhone" />
              </label>
              <label>
                마을명
                <select name="villageName">
                  <option value="">선택</option>
                  {settings.villages.map((village) => (
                    <option key={village} value={village}>
                      {village}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              주민 메모
              <textarea
                maxLength={300}
                name="memo"
                placeholder="이동 지원에 필요한 운영 메모만 적어 주세요."
                rows={3}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>이동 신청</legend>
            <div className="field-grid">
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
            </div>
            <div className="field-grid">
              <label>
                출발지
                <input maxLength={120} name="origin" required />
              </label>
              <label>
                목적지
                <input maxLength={120} name="destination" required />
              </label>
            </div>
            <label>
              신청 메모
              <textarea
                maxLength={300}
                name="notes"
                placeholder="예약과 이동에 필요한 내용만 적어 주세요."
                rows={3}
              />
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
              주민등록번호와 세부 건강정보를 입력하지 않았음
            </label>
          </fieldset>

          {state.message ? (
            <p className={state.ok ? "form-message success" : "form-message"} role="status">
              {state.message}
            </p>
          ) : null}

          <button className="primary-action" disabled={!canWrite || pending} type="submit">
            {pending ? "저장 중" : canWrite ? "신청 저장" : "로그인 후 저장"}
          </button>
        </form>
      </section>

      <section className="request-list-panel" aria-labelledby="request-list-title">
        <div className="section-header">
          <p className="eyebrow">신청 목록</p>
          <h2 id="request-list-title">검색과 필터</h2>
        </div>
        <form action="/admin/requests" className="request-filter-form">
          <label>
            검색
            <input
              defaultValue={filters.query ?? ""}
              name="query"
              placeholder="주민명, 연락처, 출발지, 목적지"
            />
          </label>
          <label>
            마을
            <select defaultValue={filters.villageName ?? ""} name="villageName">
              <option value="">전체</option>
              {settings.villages.map((village) => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
            </select>
          </label>
          <label>
            희망일
            <input defaultValue={filters.desiredDate ?? ""} name="desiredDate" type="date" />
          </label>
          <label>
            목적
            <select defaultValue={filters.purpose ?? ""} name="purpose">
              <option value="">전체</option>
              {MOBILITY_PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {MOBILITY_PURPOSE_LABELS[purpose]}
                </option>
              ))}
            </select>
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

        <div className="request-list" aria-live="polite">
          {requests.length > 0 ? (
            requests.map((request) => (
              <article className="request-card" key={request.id}>
                <div className="request-card-header">
                  <div>
                    <strong>{request.residentName}</strong>
                    <span>
                      {request.villageName} · {request.phoneMasked}
                    </span>
                  </div>
                  <mark>{request.statusLabel}</mark>
                </div>
                <dl className="request-card-details">
                  <div>
                    <dt>희망일</dt>
                    <dd>
                      {request.desiredDate} · {request.desiredTimeWindow}
                    </dd>
                  </div>
                  <div>
                    <dt>목적</dt>
                    <dd>{request.purposeLabel}</dd>
                  </div>
                  <div>
                    <dt>이동</dt>
                    <dd>
                      {request.origin} → {request.destination}
                    </dd>
                  </div>
                  <div>
                    <dt>동의</dt>
                    <dd>{request.privacyReady ? "확인 완료" : "확인 필요"}</dd>
                  </div>
                </dl>
              </article>
            ))
          ) : (
            <p className="request-empty">조건에 맞는 신청이 없습니다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
