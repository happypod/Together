"use client";

import { useActionState } from "react";
import { Slice } from "@/components/ui/slice";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import {
  settlementAction,
  type SettlementFormState,
} from "@/app/admin/settlements/actions";
import {
  COMMUNITY_FUND_TYPES,
  COMMUNITY_FUND_TYPE_LABELS,
  ROUNDING_POLICIES,
  ROUNDING_POLICY_LABELS,
  SETTLEMENT_MODE_LABELS,
  SETTLEMENT_MODES,
} from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  type CommunityFundGroupOption,
  type CommunityFundListItem,
  type CommunityFundMonthlySummary,
} from "@/server/funds/community-fund-service";
import {
  type MonthlySettlementRow,
  type MonthlySettlementTable,
  type SettlementListFilters,
  type SettlementListItem,
} from "@/server/settlements/settlement-service";
import { type OperatingSettings } from "@/server/settings/defaults";

type SettlementWorkspaceProps = {
  settings: OperatingSettings;
  groups: SettlementListItem[];
  monthlySettlementTable: MonthlySettlementTable;
  filters: SettlementListFilters;
  canWrite: boolean;
  canPrepareCsv: boolean;
  communityFundRecords: CommunityFundListItem[];
  communityFundSummary: CommunityFundMonthlySummary;
  communityFundGroupOptions: CommunityFundGroupOption[];
  notice?: string;
};

const initialState: SettlementFormState = {
  ok: false,
  message: "",
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatKrw(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "미입력";
  }
  return `${numberFormatter.format(value)}원`;
}

export function SettlementWorkspace({
  settings,
  groups,
  monthlySettlementTable,
  filters,
  canWrite,
  canPrepareCsv,
  communityFundRecords,
  communityFundSummary,
  communityFundGroupOptions,
  notice,
}: SettlementWorkspaceProps) {
  const [state, formAction, pending] = useActionState(settlementAction, initialState);

  const filterSection = (
    <section className="settlement-panel" aria-labelledby="settlement-filter-title">
      <div className="section-header">
        <p className="eyebrow">정산 대상</p>
        <h2 id="settlement-filter-title">귀가확인 운행</h2>
      </div>
      <form action="/admin/settlements" className="settlement-filter-form">
        <label>
          검색
          <input
            defaultValue={filters.query ?? ""}
            name="query"
            placeholder="그룹명, 주민명, 목적지, 차량번호"
          />
        </label>
        <label>
          운행일
          <input defaultValue={filters.serviceDate ?? ""} name="serviceDate" type="date" />
        </label>
        <label>
          정산 상태
          <select defaultValue={filters.settled ?? ""} name="settled">
            <option value="">전체</option>
            <option value="unsettled">정산 대기</option>
            <option value="settled">정산 완료</option>
          </select>
        </label>
        <button className="secondary-action" type="submit">
          필터 적용
        </button>
      </form>
    </section>
  );

  const csvSection = (
    <section className="settlement-panel" aria-labelledby="settlement-csv-title">
      <div className="section-header">
        <p className="eyebrow">CSV 준비</p>
        <h2 id="settlement-csv-title">권한과 사유 기록</h2>
      </div>
      <form action={formAction} className="settlement-csv-form">
        <input name="intent" type="hidden" value="prepareCsv" />
        <label>
          대상 월
          <input name="month" placeholder="YYYY-MM" />
        </label>
        <label>
          내보내기 준비 사유
          <textarea
            maxLength={300}
            name="reason"
            placeholder="보고 제출, 내부 점검 등 목적만 적어 주세요."
            rows={3}
          />
        </label>
        <button className="secondary-action" disabled={!canPrepareCsv || pending} type="submit">
          AuditLog 기록
        </button>
      </form>
    </section>
  );

  const monthlySettlementSection = (
    <section
      className="settlement-panel settlement-list-panel"
      aria-labelledby="monthly-settlement-title"
    >
      <div className="section-header">
        <p className="eyebrow">월별 정산표</p>
        <h2 id="monthly-settlement-title">월 정산 검토</h2>
      </div>
      <MonthlySettlementSummary summary={monthlySettlementTable.summary} />
      <form action="/admin/settlements" className="monthly-settlement-filter settlement-filter-form">
        <input name="tab" type="hidden" value="monthly" />
        <label>
          대상 월
          <input
            defaultValue={monthlySettlementTable.summary.month}
            name="settlementMonth"
            type="month"
          />
        </label>
        <label>
          정산 상태
          <select defaultValue={filters.monthlySettled ?? ""} name="monthlySettled">
            <option value="">전체</option>
            <option value="settled">정산완료</option>
            <option value="unsettled">미정산</option>
          </select>
        </label>
        <label>
          영수증
          <select defaultValue={filters.receipt ?? ""} name="receipt">
            <option value="">전체</option>
            <option value="attached">영수증 확인</option>
            <option value="missing">영수증 누락</option>
          </select>
        </label>
        <button className="secondary-action" type="submit">
          월별 표 조회
        </button>
      </form>
      {monthlySettlementTable.rows.length > 0 ? (
        <>
          <div className="monthly-settlement-table-wrap">
            <table className="monthly-settlement-table">
              <thead>
                <tr>
                  <th>운행일</th>
                  <th>그룹</th>
                  <th>정산</th>
                  <th>영수증</th>
                  <th>총 택시요금</th>
                  <th>주민 총 분담</th>
                  <th>앵커 지원금</th>
                  <th>상생기금</th>
                </tr>
              </thead>
              <tbody>
                {monthlySettlementTable.rows.map((row) => (
                  <tr key={row.groupId}>
                    <td>{row.serviceDate}</td>
                    <td>
                      <strong>{row.groupName}</strong>
                      <span>{row.destinationSummary}</span>
                    </td>
                    <td>
                      <mark data-status={row.settlementStatus}>{row.settlementStatusLabel}</mark>
                    </td>
                    <td>
                      <mark data-receipt={row.receiptStatus}>{row.receiptStatusLabel}</mark>
                    </td>
                    <td>{formatKrw(row.totalFare)}</td>
                    <td>{formatKrw(row.residentTotalShare)}</td>
                    <td>{formatKrw(row.anchorSupportAmount)}</td>
                    <td>{formatKrw(row.communityFundSupportAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="monthly-settlement-card-list">
            {monthlySettlementTable.rows.map((row) => (
              <MonthlySettlementCard key={row.groupId} row={row} />
            ))}
          </div>
        </>
      ) : (
        <p className="request-empty">선택한 조건의 월별 정산 내역이 없습니다.</p>
      )}
    </section>
  );

  const communityFundSection = (
    <section className="settlement-panel settlement-list-panel" aria-labelledby="community-fund-title">
      <div className="section-header">
        <p className="eyebrow">상생기금</p>
        <h2 id="community-fund-title">조성액과 지원 기록</h2>
      </div>
      <dl className="community-fund-summary">
        <div>
          <dt>대상 월</dt>
          <dd>{communityFundSummary.month}</dd>
        </div>
        <div>
          <dt>월 조성액</dt>
          <dd>{formatKrw(communityFundSummary.contributionAmount)}</dd>
        </div>
        <div>
          <dt>지원 기록</dt>
          <dd>{formatKrw(communityFundSummary.supportRecordAmount)}</dd>
        </div>
        <div>
          <dt>기록 수</dt>
          <dd>{communityFundSummary.recordCount}건</dd>
        </div>
      </dl>
      <p className="form-help">
        월 조성액은 월간 리포트의 상생기금 조성액으로 합산합니다. 지원 기록은 운임 정산이나 주민 지급 처리로 표시하지 않습니다.
      </p>
      <form action="/admin/settlements" className="community-fund-month-form settlement-filter-form">
        <input name="tab" type="hidden" value="funds" />
        <label>
          조회 월
          <input defaultValue={communityFundSummary.month} name="fundMonth" type="month" />
        </label>
        <button className="secondary-action" type="submit">
          월 조회
        </button>
      </form>

      <CommunityFundForm
        canWrite={canWrite}
        defaultMonth={communityFundSummary.month}
        formAction={formAction}
        groupOptions={communityFundGroupOptions}
        pending={pending}
      />

      <div className="community-fund-list">
        {communityFundRecords.length > 0 ? (
          communityFundRecords.map((record) => (
            <CommunityFundCard
              canWrite={canWrite}
              formAction={formAction}
              groupOptions={communityFundGroupOptions}
              key={record.id}
              pending={pending}
              record={record}
            />
          ))
        ) : (
          <p className="request-empty">선택한 월의 상생기금 기록이 없습니다.</p>
        )}
      </div>
    </section>
  );

  const listSection = (
    <section className="settlement-panel settlement-list-panel" aria-labelledby="settlement-list-title">
      <div className="section-header">
        <p className="eyebrow">정산 목록</p>
        <h2 id="settlement-list-title">요금과 분담액</h2>
      </div>
      <div className="settlement-card-list">
        {groups.length > 0 ? (
          groups.map((group) => (
            <SettlementCard
              canWrite={canWrite}
              formAction={formAction}
              group={group}
              key={group.groupId}
              pending={pending}
              settings={settings}
            />
          ))
        ) : (
          <p className="request-empty">정산할 귀가확인 운행이 없습니다.</p>
        )}
      </div>
    </section>
  );

  const tabs: TabItem[] = [
    { id: "list", label: "정산 목록", icon: "receipt", badge: groups.length, content: listSection },
    {
      id: "monthly",
      label: "월별 표",
      icon: "calendar",
      badge: monthlySettlementTable.summary.rowCount,
      content: monthlySettlementSection,
    },
    {
      id: "funds",
      label: "상생기금",
      icon: "payment",
      badge: communityFundRecords.length,
      content: communityFundSection,
    },
    { id: "filter", label: "대상 검색", icon: "search", content: filterSection },
    { id: "csv", label: "CSV 준비", icon: "exportFile", content: csvSection },
  ];

  return (
    <div className="settlement-workspace">
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

      <Tabs
        ariaLabel="정산 메뉴"
        defaultTabId={
          filters.tab === "funds" ? "funds" : filters.tab === "monthly" ? "monthly" : "list"
        }
        tabs={tabs}
      />
    </div>
  );
}

type SettlementCardProps = {
  group: SettlementListItem;
  settings: OperatingSettings;
  canWrite: boolean;
  pending: boolean;
  formAction: (formData: FormData) => void;
};

function MonthlySettlementSummary({ summary }: { summary: MonthlySettlementTable["summary"] }) {
  const reportBasisLabel =
    summary.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
  return (
    <>
      <dl className="monthly-settlement-summary">
        <div>
          <dt>대상 월</dt>
          <dd>{summary.month}</dd>
        </div>
        <div>
          <dt>기준일</dt>
          <dd>{reportBasisLabel}</dd>
        </div>
        <div>
          <dt>총 택시요금</dt>
          <dd>{formatKrw(summary.totalFareSum)}</dd>
        </div>
        <div>
          <dt>주민 총 분담</dt>
          <dd>{formatKrw(summary.residentTotalShareSum)}</dd>
        </div>
        <div>
          <dt>앵커 지원금</dt>
          <dd>{formatKrw(summary.anchorSupportAmountSum)}</dd>
        </div>
        <div>
          <dt>상생기금 지원</dt>
          <dd>{formatKrw(summary.communityFundSupportAmountSum)}</dd>
        </div>
        <div>
          <dt>미정산</dt>
          <dd>{summary.unsettledCount}건</dd>
        </div>
        <div>
          <dt>영수증 누락</dt>
          <dd>{summary.receiptMissingCount}건</dd>
        </div>
      </dl>
      <p className="form-help">
        월별 정산표는 {reportBasisLabel}으로 묶습니다. 미정산과 영수증 누락을 먼저 확인해
        정산 입력 화면에서 보완합니다.
      </p>
    </>
  );
}

function MonthlySettlementCard({ row }: { row: MonthlySettlementRow }) {
  return (
    <article className="monthly-settlement-card">
      <div className="monthly-settlement-card-header">
        <div>
          <strong>{row.groupName}</strong>
          <span>
            {row.serviceDate} · {row.destinationSummary}
          </span>
        </div>
        <mark data-status={row.settlementStatus}>{row.settlementStatusLabel}</mark>
      </div>
      <dl className="monthly-settlement-card-summary">
        <div>
          <dt>영수증</dt>
          <dd data-receipt={row.receiptStatus}>{row.receiptStatusLabel}</dd>
        </div>
        <div>
          <dt>총 택시요금</dt>
          <dd>{formatKrw(row.totalFare)}</dd>
        </div>
        <div>
          <dt>주민 총 분담</dt>
          <dd>{formatKrw(row.residentTotalShare)}</dd>
        </div>
        <div>
          <dt>주민 1인</dt>
          <dd>{formatKrw(row.residentPerPersonShare)}</dd>
        </div>
        <div>
          <dt>앵커 지원금</dt>
          <dd>{formatKrw(row.anchorSupportAmount)}</dd>
        </div>
        <div>
          <dt>상생기금</dt>
          <dd>{formatKrw(row.communityFundSupportAmount)}</dd>
        </div>
      </dl>
    </article>
  );
}

type CommunityFundFormProps = {
  canWrite: boolean;
  defaultMonth: string;
  pending: boolean;
  formAction: (formData: FormData) => void;
  groupOptions: CommunityFundGroupOption[];
  record?: CommunityFundListItem;
};

function CommunityFundForm({
  canWrite,
  defaultMonth,
  pending,
  formAction,
  groupOptions,
  record,
}: CommunityFundFormProps) {
  const options =
    record?.groupId && !groupOptions.some((group) => group.id === record.groupId)
      ? [{ id: record.groupId, label: record.groupName, month: record.month }, ...groupOptions]
      : groupOptions;

  return (
    <form action={formAction} className="community-fund-form settlement-form">
      <input name="intent" type="hidden" value="saveCommunityFund" />
      {record ? <input name="communityFundId" type="hidden" value={record.id} /> : null}
      <div className="field-grid">
        <label>
          대상 월
          <input
            defaultValue={record?.month ?? defaultMonth}
            disabled={!canWrite}
            name="month"
            required
            type="month"
          />
        </label>
        <label>
          유형
          <select
            defaultValue={record?.fundType ?? "CONTRIBUTION"}
            disabled={!canWrite}
            name="fundType"
          >
            {COMMUNITY_FUND_TYPES.map((fundType) => (
              <option key={fundType} value={fundType}>
                {COMMUNITY_FUND_TYPE_LABELS[fundType]}
              </option>
            ))}
          </select>
        </label>
        <label>
          연결 운행
          <select defaultValue={record?.groupId ?? ""} disabled={!canWrite} name="groupId">
            <option value="">월 기준 기록</option>
            {options.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
          <span className="form-help">지원 기록은 관련 운행을 선택할 수 있습니다.</span>
        </label>
        <label>
          금액
          <input
            defaultValue={record?.amount ?? ""}
            disabled={!canWrite}
            inputMode="numeric"
            min={1}
            name="amount"
            required
            type="number"
          />
        </label>
        <label>
          출연처 또는 지원처
          <input
            defaultValue={record?.source ?? ""}
            disabled={!canWrite}
            maxLength={80}
            name="source"
            placeholder="예: 백천 상생기금"
            required
          />
        </label>
      </div>
      <label>
        메모
        <textarea
          defaultValue={record?.note ?? ""}
          disabled={!canWrite}
          maxLength={300}
          name="note"
          placeholder="금액 처리 표현 없이 보고에 필요한 내용만 적어 주세요."
          rows={3}
        />
      </label>
      <button className="primary-action" disabled={!canWrite || pending} type="submit">
        {record ? "상생기금 수정" : "상생기금 저장"}
      </button>
    </form>
  );
}

type CommunityFundCardProps = {
  record: CommunityFundListItem;
  groupOptions: CommunityFundGroupOption[];
  canWrite: boolean;
  pending: boolean;
  formAction: (formData: FormData) => void;
};

function CommunityFundCard({
  record,
  groupOptions,
  canWrite,
  pending,
  formAction,
}: CommunityFundCardProps) {
  return (
    <article className="community-fund-card">
      <div className="community-fund-card-header">
        <div>
          <strong>{record.fundTypeLabel}</strong>
          <span>
            {record.month} · {record.groupName}
          </span>
        </div>
        <mark>{formatKrw(record.amount)}</mark>
      </div>
      <dl className="community-fund-details">
        <div>
          <dt>출연처/지원처</dt>
          <dd>{record.source}</dd>
        </div>
        <div>
          <dt>기록일</dt>
          <dd>{record.createdAt}</dd>
        </div>
      </dl>
      {record.note ? <p>{record.note}</p> : null}
      <Slice icon="payment" summary="AuditLog UPDATE" title="기록 수정">
        <CommunityFundForm
          canWrite={canWrite}
          defaultMonth={record.month}
          formAction={formAction}
          groupOptions={groupOptions}
          pending={pending}
          record={record}
        />
      </Slice>
    </article>
  );
}

function SettlementCard({ group, settings, canWrite, pending, formAction }: SettlementCardProps) {
  const settlement = group.settlement;
  const defaultTotalFare =
    settlement?.totalFare ?? group.taxiActualFare ?? group.taxiExpectedFare ?? settings.defaultFare;
  const coverageTotal = settlement
    ? settlement.residentTotalShare +
      settlement.anchorSupportAmount +
      (settlement.communityFundSupportAmount ?? 0)
    : null;
  const coverageDifference = settlement ? settlement.totalFare - (coverageTotal ?? 0) : null;
  const coverageLabel =
    coverageDifference === null
      ? "저장 후 확인"
      : coverageDifference === 0
        ? "산식 일치"
        : `${formatKrw(Math.abs(coverageDifference))} 확인 필요`;

  return (
    <article className="settlement-card">
      <div className="settlement-card-header">
        <div>
          <strong>{group.groupName}</strong>
          <span>
            {group.serviceDate} · {group.destinationSummary} · {group.statusLabel}
          </span>
        </div>
        <mark>{settlement?.isSettled ? "정산완료" : "정산대기"}</mark>
      </div>

      <dl className="settlement-summary">
        <div>
          <dt>택시 실제요금</dt>
          <dd>{formatKrw(group.taxiActualFare)}</dd>
        </div>
        <div>
          <dt>정산 총액</dt>
          <dd>{formatKrw(settlement?.totalFare)}</dd>
        </div>
        <div>
          <dt>주민 수</dt>
          <dd>{group.residentCount}명</dd>
        </div>
        <div>
          <dt>주민 1인 분담</dt>
          <dd>{formatKrw(settlement?.residentPerPersonShare)}</dd>
        </div>
        <div>
          <dt>주민 총 분담</dt>
          <dd>{formatKrw(settlement?.residentTotalShare)}</dd>
        </div>
        <div>
          <dt>앵커 지원금</dt>
          <dd>{formatKrw(settlement?.anchorSupportAmount)}</dd>
        </div>
        <div>
          <dt>상생기금</dt>
          <dd>{formatKrw(settlement?.communityFundSupportAmount)}</dd>
        </div>
        <div>
          <dt>산식 검증</dt>
          <dd>{coverageLabel}</dd>
        </div>
      </dl>
      <p className="form-help">
        정산 총액 = 주민 총 분담 + 앵커 지원금 + 상생기금입니다. 상생기금은 별도
        지원 기록으로 표시합니다.
      </p>

      <Slice icon="users" summary={`${group.members.length}명`} title="주민 명단">
        <div className="settlement-member-list">
          {group.members.map((member) => (
            <div className="settlement-member-row" key={member.id}>
              <strong>
                {member.pickupOrder}. {member.residentName}
              </strong>
              <span>{member.phoneMasked}</span>
            </div>
          ))}
        </div>
      </Slice>

      <Slice
        icon="payment"
        summary={settlement?.isSettled ? "정산완료" : "입력 필요"}
        title="정산 입력"
        tone="accent"
        defaultOpen={!settlement?.isSettled}
      >
      <form action={formAction} className="settlement-form">
        <input name="intent" type="hidden" value="saveSettlement" />
        <input name="groupId" type="hidden" value={group.groupId} />
        <div className="field-grid">
          <label>
            정산 모드
            <select defaultValue={settlement?.settlementMode ?? "PILOT"} name="settlementMode">
              {SETTLEMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {SETTLEMENT_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </label>
          <label>
            원 단위 처리
            <select
              defaultValue={settlement?.roundingPolicy ?? settings.fareRoundingPolicy}
              name="roundingPolicy"
            >
              {ROUNDING_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {ROUNDING_POLICY_LABELS[policy]}
                </option>
              ))}
            </select>
          </label>
          <label>
            총 택시요금
            <input
              defaultValue={defaultTotalFare}
              inputMode="numeric"
              min={0}
              name="totalFare"
              type="number"
            />
            <span className="form-help">0원 이상 정수로 입력합니다.</span>
          </label>
          <label>
            주민 수
            <input
              defaultValue={settlement?.residentCount ?? group.residentCount}
              inputMode="numeric"
              min={1}
              name="residentCount"
              type="number"
            />
          </label>
          <label>
            상생기금 지원금
            <input
              defaultValue={settlement?.communityFundSupportAmount ?? ""}
              inputMode="numeric"
              min={0}
              name="communityFundSupportAmount"
              type="number"
            />
            <span className="form-help">상생기금은 별도 지원 항목으로 기록됩니다.</span>
          </label>
          <label>
            주민 총 분담금
            <input inputMode="numeric" min={0} name="customResidentTotalShare" type="number" />
            <span className="form-help">직접 입력 모드에서만 필요한 조정 금액입니다.</span>
          </label>
          <label>
            동행링커 활동비
            <input
              defaultValue={settlement?.linkerActivityFee ?? ""}
              inputMode="numeric"
              min={0}
              name="linkerActivityFee"
              type="number"
            />
          </label>
          <label>
            영수증 링크
            <input
              defaultValue={settlement?.receiptUrl ?? ""}
              maxLength={300}
              name="receiptUrl"
              placeholder="영수증 파일 주소"
            />
          </label>
        </div>
        <label>
          완료 후 수정 사유
          <textarea
            maxLength={300}
            name="updatedReason"
            placeholder="정산 완료 후 다시 수정할 때 필요한 사유만 적어 주세요."
            rows={2}
          />
          <span className="form-help">정산 완료 후 다시 저장할 때는 사유가 필요합니다.</span>
        </label>
        <label className="check-row">
          <input
            defaultChecked={settlement?.isSettled ?? false}
            disabled={settlement?.isSettled}
            name="isSettled"
            type="checkbox"
          />
          정산 완료 처리
        </label>
        <button className="primary-action" disabled={!canWrite || pending} type="submit">
          {pending ? "저장 중" : "정산 저장"}
        </button>
      </form>
      </Slice>
    </article>
  );
}
