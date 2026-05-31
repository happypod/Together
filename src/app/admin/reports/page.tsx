import Link from "next/link";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { FaIcon } from "@/components/ui/fa-icon";
import { hasPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import {
  CONTACT_LOG_INPUT_RULES,
  DASHBOARD_KPIS,
  MONTHLY_REPORT_METRICS,
  MONTHLY_SUMMARY_CSV_COLUMNS,
  TRIP_DETAIL_CSV_COLUMNS,
} from "@/server/reports/report-contracts";
import {
  createPreviewMonthlyReport,
  getMonthlyReport,
  parseReportMonth,
  previewMonthlyOperationReport,
  type MonthlyOperationReport,
  type MonthlyReportComparisonRow,
} from "@/server/reports/monthly-report-service";
import {
  createPreviewLinkerActivityStats,
  getLinkerActivityStats,
  type LinkerActivityRow,
  type LinkerActivityStats,
} from "@/server/reports/linker-activity-statistics-service";
import { estimateDefaultResidentShare } from "@/server/settlements/calculator";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import {
  createPreviewSatisfactionStats,
  getSatisfactionStats,
  type SatisfactionFeedbackItem,
  type SatisfactionScoreMetric,
  type SatisfactionStats,
} from "@/server/surveys/satisfaction-survey-service";

const numberFormatter = new Intl.NumberFormat("ko-KR");

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatKrw(value: number) {
  return `${numberFormatter.format(value)}원`;
}

function formatCount(value: number, unit: "건" | "명") {
  return `${numberFormatter.format(value)}${unit}`;
}

function formatScore(value: number) {
  return value > 0 ? `${value.toFixed(1)}점` : "응답 없음";
}

function formatOptionalScore(value: number | null) {
  return value === null ? "응답 없음" : formatScore(value);
}

function formatPercent(value: number) {
  return `${numberFormatter.format(value)}%`;
}

function formatMetricValue(value: number, format: MonthlyReportComparisonRow["format"]) {
  if (format === "krw") {
    return formatKrw(value);
  }
  if (format === "score") {
    return value > 0 ? `${value.toFixed(1)}점` : "응답 없음";
  }
  if (format === "people") {
    return `${numberFormatter.format(value)}명`;
  }
  return `${numberFormatter.format(value)}건`;
}

function formatDelta(value: number, format: MonthlyReportComparisonRow["format"]) {
  const prefix = value > 0 ? "+" : "";
  if (format === "krw") {
    return `${prefix}${formatKrw(value)}`;
  }
  if (format === "score") {
    return `${prefix}${value.toFixed(1)}점`;
  }
  if (format === "people") {
    return `${prefix}${numberFormatter.format(value)}명`;
  }
  return `${prefix}${numberFormatter.format(value)}건`;
}

function reportBasisLabel(report: MonthlyOperationReport) {
  return report.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function safeMonth(value: string | undefined, fallbackMonth: string) {
  try {
    return parseReportMonth(value ?? fallbackMonth);
  } catch {
    return fallbackMonth;
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user && !hasPermission(user, "report:read")) {
    return (
      <AppShell currentHref="/admin/reports">
        <main className="page report-page">
          <AccessDeniedPanel description="이 역할은 리포트와 CSV 기준을 볼 수 없습니다. 필요한 경우 운영 책임자에게 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  const selectedMonth = safeMonth(
    firstValue(params.month),
    user ? currentMonth() : previewMonthlyOperationReport.month,
  );
  const selectedLinkerStatus = firstValue(params.linkerStatus) ?? "";
  const canExportCsv = hasPermission(user, "csv:export");
  const canExportPdf =
    canExportCsv && (user?.role === "SUPER_ADMIN" || user?.role === "ANCHOR_ADMIN");
  const canExportFullCsv = canExportCsv && user?.role === "SUPER_ADMIN";
  let monthlyReport = createPreviewMonthlyReport(selectedMonth);
  let satisfactionStats = createPreviewSatisfactionStats(selectedMonth);
  let linkerActivityStats = createPreviewLinkerActivityStats({
    month: selectedMonth,
    status: selectedLinkerStatus,
  });
  if (user && hasPermission(user, "report:read")) {
    try {
      const [report, stats, linkerStats] = await Promise.all([
        getMonthlyReport(user, { month: selectedMonth }),
        getSatisfactionStats(user, { month: selectedMonth }),
        getLinkerActivityStats(user, {
          month: selectedMonth,
          status: selectedLinkerStatus,
        }),
      ]);
      monthlyReport = report;
      satisfactionStats = stats;
      linkerActivityStats = linkerStats;
    } catch {
      monthlyReport = createPreviewMonthlyReport(selectedMonth);
      satisfactionStats = createPreviewSatisfactionStats(selectedMonth);
      linkerActivityStats = createPreviewLinkerActivityStats({
        month: selectedMonth,
        status: selectedLinkerStatus,
      });
    }
  }

  const settings = DEFAULT_OPERATING_SETTINGS;
  const snapshot = monthlyReport.snapshot;
  const estimatedResidentShare = estimateDefaultResidentShare(
    settings.defaultFare,
    settings.defaultResidentCount,
    settings.fareRoundingPolicy,
  );
  const headlineCards = [
    {
      label: "월 운행건수",
      value: formatCount(snapshot.tripCount, "건"),
      note: `${monthlyReport.month} 성과 확정`,
    },
    {
      label: "월 이용 주민",
      value: formatCount(snapshot.monthlyResidentCount, "명"),
      note: `누적 ${formatCount(snapshot.cumulativeResidentCount, "명")}`,
    },
    {
      label: "활동 동행링커",
      value: formatCount(snapshot.activeLinkerCount, "명"),
      note: `${formatCount(snapshot.linkerActivityCount, "건")} 활동`,
    },
    {
      label: "평균 택시요금",
      value: formatKrw(snapshot.averageFare),
      note: "정산 완료 건 기준",
    },
    {
      label: "총 이동지원비",
      value: formatKrw(snapshot.totalAnchorSupport),
      note: `절감 추정 ${formatKrw(snapshot.estimatedSaving)}`,
    },
    {
      label: "만족도 평균",
      value: formatScore(snapshot.satisfactionAverage),
      note: `정서회복 ${formatScore(snapshot.emotionalRecoveryAverage)}`,
    },
    {
      label: "사고·민원",
      value: formatCount(snapshot.incidentComplaintCount, "건"),
      note: "세부 내용은 제외",
    },
    {
      label: "상생기금 조성",
      value: formatKrw(snapshot.communityFundAmount),
      note: "지원 기록과 분리",
    },
    {
      label: "취업연계 상담",
      value: formatCount(snapshot.jobConsultationCount, "건"),
      note: "민감 세부 기록 제외",
    },
    {
      label: "MOU",
      value: formatCount(snapshot.mouCount, "건"),
      note: "월 체결 기준",
    },
  ];
  const qualityRows = [
    ["만족도 평균", formatScore(snapshot.satisfactionAverage)],
    ["정서회복 평균", formatScore(snapshot.emotionalRecoveryAverage)],
    ["사고·민원 건수", formatCount(snapshot.incidentComplaintCount, "건")],
    ["취업연계 상담", formatCount(snapshot.jobConsultationCount, "건")],
    ["MOU", formatCount(snapshot.mouCount, "건")],
    ["상생기금 지원 기록", formatKrw(monthlyReport.communityFundSummary.supportRecordAmount)],
  ];
  const settingRows = [
    ["월간 리포트 기준일", reportBasisLabel(monthlyReport)],
    ["정산 원 단위 처리", settings.fareRoundingPolicy],
    ["기본 택시요금", formatKrw(settings.defaultFare)],
    ["주민 1인 예상액", formatKrw(estimatedResidentShare)],
    ["운영 마을", settings.villages.join(", ")],
    ["운영 시간대", settings.timeWindows.join(", ")],
  ];

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page report-page">
        <section className="report-hero" aria-labelledby="report-title">
          <div>
            <p className="eyebrow">월간 운영리포트</p>
            <h1 id="report-title">월간 운영 성과</h1>
            <p className="lead">
              운행, 주민 이용, 동행링커 활동, 정산, 만족도, 사고·민원 지표를 한 화면에서
              확인합니다.
              <br />
              개인정보 없이 집계값만 표시합니다.
            </p>
          </div>
          <div className="report-hero-note" aria-label="현재 기준">
            <strong>{monthlyReport.month}</strong>
            <span>{reportBasisLabel(monthlyReport)}</span>
            <small>
              {monthlyReport.sourceLabel} · {monthlyReport.generatedAt}
            </small>
          </div>
        </section>

        <section className="report-band monthly-report-control" aria-labelledby="monthly-report-filter-title">
          <div className="section-header">
            <p className="eyebrow">조회</p>
            <h2 id="monthly-report-filter-title">대상 월 선택</h2>
          </div>
          <form action="/admin/reports" className="report-month-form">
            <label htmlFor="month">
              월 선택
              <input defaultValue={monthlyReport.month} id="month" name="month" type="month" />
            </label>
            <button type="submit">월간 리포트 조회</button>
          </form>
          <div className="report-control-actions">
            <Link className="secondary-action" href={`/admin/reports/administrative?month=${monthlyReport.month}`}>
              행정 열람 리포트
            </Link>
            <Link className="secondary-action" href={`/admin/reports/print?month=${monthlyReport.month}`}>
              인쇄용 월간보고서
            </Link>
            <Link className="secondary-action" href={`/admin/job-consultations?month=${monthlyReport.month}`}>
              취업연계 상담관리
            </Link>
            <Link className="secondary-action" href={`/admin/mou-records?month=${monthlyReport.month}`}>
              MOU 관리
            </Link>
          </div>
          {user?.role === "VIEWER" ? (
            <p className="form-help">
              VIEWER 권한에서는 주민명과 연락처 없이 월별 집계 지표만 표시합니다.
            </p>
          ) : null}
        </section>

        <section className="report-band" aria-labelledby="monthly-summary-title">
          <div className="section-header">
            <p className="eyebrow">요약</p>
            <h2 id="monthly-summary-title">핵심 운영지표</h2>
          </div>
          <div className="monthly-report-card-grid" aria-label="월간 운영지표">
            {headlineCards.map((card) => (
              <article className="monthly-report-card" key={card.label}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.note}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="report-band" aria-labelledby="monthly-comparison-title">
          <div className="section-header">
            <p className="eyebrow">비교</p>
            <h2 id="monthly-comparison-title">전월 대비</h2>
          </div>
          <div className="monthly-comparison-grid">
            {monthlyReport.comparisonRows.map((row) => (
              <ComparisonCard key={row.key} row={row} previousMonth={monthlyReport.previousMonth} />
            ))}
          </div>
        </section>

        <section className="report-band" aria-labelledby="monthly-quality-title">
          <div className="section-header">
            <p className="eyebrow">품질</p>
            <h2 id="monthly-quality-title">만족도와 안전 지표</h2>
          </div>
          <dl className="monthly-quality-grid">
            {qualityRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="report-band" aria-labelledby="linker-activity-title">
          <div className="section-header">
            <p className="eyebrow">동행링커 활동통계</p>
            <h2 id="linker-activity-title">월별 배정과 활동 이력</h2>
          </div>
          <LinkerActivityStatsSection stats={linkerActivityStats} />
        </section>

        <section className="report-band" aria-labelledby="satisfaction-stats-title">
          <div className="section-header">
            <p className="eyebrow">만족도 통계</p>
            <h2 id="satisfaction-stats-title">항목별 만족도와 개선 요청</h2>
          </div>
          <SatisfactionStatsSection stats={satisfactionStats} />
        </section>

        <section className="report-band" aria-labelledby="settings-title">
          <div className="section-header">
            <p className="eyebrow">운영 설정</p>
            <h2 id="settings-title">AppSetting 기본 계약</h2>
          </div>
          <dl className="report-definition-list">
            {settingRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="report-band" aria-labelledby="community-fund-report-title">
          <div className="section-header">
            <p className="eyebrow">상생기금</p>
            <h2 id="community-fund-report-title">월간 리포트 반영</h2>
          </div>
          <dl className="report-definition-list">
            <div>
              <dt>대상 월</dt>
              <dd>{monthlyReport.communityFundSummary.month}</dd>
            </div>
            <div>
              <dt>조성액</dt>
              <dd>{formatKrw(monthlyReport.communityFundSummary.contributionAmount)}</dd>
            </div>
            <div>
              <dt>지원 기록</dt>
              <dd>{formatKrw(monthlyReport.communityFundSummary.supportRecordAmount)}</dd>
            </div>
            <div>
              <dt>기록 수</dt>
              <dd>{monthlyReport.communityFundSummary.recordCount}건</dd>
            </div>
          </dl>
          <p className="form-help">
            월간 리포트의 상생기금 조성액은 `CommunityFund.CONTRIBUTION` 합계만 사용하며,
            지원 기록은 운임 정산이나 주민 지급 처리로 계산하지 않습니다.
          </p>
        </section>

        <div className="report-two-column">
          <section className="report-band" aria-labelledby="dashboard-kpi-title">
            <div className="section-header">
              <p className="eyebrow">대시보드</p>
              <h2 id="dashboard-kpi-title">KPI 산식</h2>
            </div>
            <ul className="report-contract-list">
              {DASHBOARD_KPIS.map((metric) => (
                <li key={metric.key}>
                  <strong>{metric.label}</strong>
                  <span>{metric.formula}</span>
                  <small>{metric.source}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="report-band" aria-labelledby="monthly-metric-title">
            <div className="section-header">
              <p className="eyebrow">월간 리포트</p>
              <h2 id="monthly-metric-title">집계 지표</h2>
            </div>
            <ul className="report-contract-list">
              {MONTHLY_REPORT_METRICS.map((metric) => (
                <li key={metric.key}>
                  <strong>{metric.label}</strong>
                  <span>{metric.formula}</span>
                  <small>{metric.source}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="report-band" aria-labelledby="csv-title">
          <div className="section-header">
            <p className="eyebrow">내보내기</p>
            <h2 id="csv-title">PDF, CSV와 개인정보 표시 기준</h2>
          </div>
          <PdfDownloadPanel canExport={canExportPdf} month={monthlyReport.month} />
          <CsvDownloadPanel
            canExport={canExportCsv}
            canExportFull={canExportFullCsv}
            month={monthlyReport.month}
          />
          <div className="report-table-grid">
            <CsvContractTable title="월간 요약 CSV" columns={MONTHLY_SUMMARY_CSV_COLUMNS} />
            <CsvContractTable title="운행 상세 CSV" columns={TRIP_DETAIL_CSV_COLUMNS} />
          </div>
        </section>

        <section className="report-band" aria-labelledby="contact-log-title">
          <div className="section-header">
            <p className="eyebrow">연락 기록</p>
            <h2 id="contact-log-title">ContactLog 입력 기준</h2>
          </div>
          <div className="contact-rule-grid">
            <div>
              <strong>연결 대상</strong>
              <p>{CONTACT_LOG_INPUT_RULES.targetTypes.join(", ")}</p>
            </div>
            <div>
              <strong>필수 입력</strong>
              <p>{CONTACT_LOG_INPUT_RULES.requiredFields.join(", ")}</p>
            </div>
            <div>
              <strong>개인정보 기준</strong>
              <p>{CONTACT_LOG_INPUT_RULES.privacyRule}</p>
            </div>
            <div>
              <strong>연결 규칙</strong>
              <p>{CONTACT_LOG_INPUT_RULES.linkRule}</p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function LinkerActivityStatsSection({ stats }: { stats: LinkerActivityStats }) {
  const basisLabel = stats.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
  const overview = [
    {
      label: "활동 링커",
      value: formatCount(stats.activeLinkerCount, "명"),
      note: `배정 링커 ${formatCount(stats.assignedLinkerCount, "명")}`,
    },
    {
      label: "월 배정 건수",
      value: formatCount(stats.monthlyAssignmentCount, "건"),
      note: `${basisLabel} · 완료 ${formatCount(stats.completedTripCount, "건")}`,
    },
    {
      label: "배정 가능",
      value: formatCount(stats.readyLinkerCount, "명"),
      note: `대상 ${formatCount(stats.totalLinkerCount, "명")}`,
    },
    {
      label: "사고·민원 연결",
      value: formatCount(stats.incidentComplaintCount, "건"),
      note: `링커 만족도 ${formatOptionalScore(stats.averageLinkerSatisfaction)}`,
    },
  ];

  return (
    <div className="linker-activity-block">
      <div className="linker-activity-summary-grid" aria-label="동행링커 활동 요약">
        {overview.map((item) => (
          <article className="linker-activity-summary-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.note}</span>
          </article>
        ))}
      </div>

      <form action="/admin/reports" className="linker-activity-filter">
        <input name="month" type="hidden" value={stats.month} />
        <label htmlFor="linkerStatus">
          상태별 필터
          <select
            defaultValue={stats.statusFilter ?? ""}
            id="linkerStatus"
            name="linkerStatus"
          >
            <option value="">전체 상태</option>
            {stats.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">필터 적용</button>
      </form>

      {stats.rows.length > 0 ? (
        <>
          <div className="linker-activity-card-list" aria-label="동행링커별 활동 카드">
            {stats.rows.map((row) => (
              <LinkerActivityCard key={row.linkerId} row={row} />
            ))}
          </div>

          <div className="linker-activity-table-wrap">
            <table className="linker-activity-table">
              <thead>
                <tr>
                  <th>동행링커</th>
                  <th>상태</th>
                  <th>배정</th>
                  <th>완료</th>
                  <th>사고·민원</th>
                  <th>만족도</th>
                  <th>최근 배정</th>
                </tr>
              </thead>
              <tbody>
                {stats.rows.map((row) => (
                  <tr key={row.linkerId}>
                    <td>
                      <strong>{row.name}</strong>
                      <span>{row.villageName}</span>
                    </td>
                    <td>
                      <mark data-ready={row.readyForAssignment}>{row.statusLabel}</mark>
                    </td>
                    <td>{formatCount(row.monthlyAssignmentCount, "건")}</td>
                    <td>{formatCount(row.completedTripCount, "건")}</td>
                    <td>{formatCount(row.incidentComplaintCount, "건")}</td>
                    <td>{formatOptionalScore(row.averageSatisfaction)}</td>
                    <td>
                      {row.assignments[0] ? (
                        <span>
                          {row.assignments[0].serviceDate} · {row.assignments[0].destinationSummary}
                        </span>
                      ) : (
                        <span>이번 달 배정 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="form-help">선택한 조건에 해당하는 동행링커 활동 이력이 없습니다.</p>
      )}
    </div>
  );
}

function LinkerActivityCard({ row }: { row: LinkerActivityRow }) {
  const recentAssignments = row.assignments.slice(0, 3);
  return (
    <article className="linker-activity-card">
      <div className="linker-activity-card-header">
        <div>
          <h3>{row.name}</h3>
          <p>{row.villageName}</p>
        </div>
        <mark data-ready={row.readyForAssignment}>{row.statusLabel}</mark>
      </div>

      <dl className="linker-activity-card-metrics">
        <div>
          <dt>월 배정</dt>
          <dd>{formatCount(row.monthlyAssignmentCount, "건")}</dd>
        </div>
        <div>
          <dt>완료 활동</dt>
          <dd>{formatCount(row.completedTripCount, "건")}</dd>
        </div>
        <div>
          <dt>사고·민원</dt>
          <dd>{formatCount(row.incidentComplaintCount, "건")}</dd>
        </div>
        <div>
          <dt>만족도</dt>
          <dd>{formatOptionalScore(row.averageSatisfaction)}</dd>
        </div>
      </dl>

      <div className="linker-assignment-list" aria-label={`${row.name} 최근 배정`}>
        {recentAssignments.length > 0 ? (
          recentAssignments.map((assignment) => (
            <div className="linker-assignment-row" key={assignment.id}>
              <strong>
                {assignment.serviceDate} · {assignment.destinationSummary}
              </strong>
              <span>
                {assignment.statusLabel} · {formatCount(assignment.memberCount, "명")} · 이슈{" "}
                {formatCount(
                  Math.max(assignment.incidentReportCount, assignment.issueSurveyCount),
                  "건",
                )}
              </span>
            </div>
          ))
        ) : (
          <p>이번 달 배정 없음 · 누적 활동 {formatCount(row.totalActivityCount, "건")}</p>
        )}
      </div>
    </article>
  );
}

function SatisfactionStatsSection({ stats }: { stats: SatisfactionStats }) {
  const basisLabel = stats.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
  const overview = [
    {
      label: "응답 수",
      value: `${numberFormatter.format(stats.responseCount)}건`,
      note: `${stats.groupCount}개 운행 · ${basisLabel}`,
    },
    {
      label: "모바일 응답",
      value: `${numberFormatter.format(stats.mobileResponseCount)}건`,
      note: `운영자 입력 ${numberFormatter.format(stats.operatorResponseCount)}건`,
    },
    {
      label: "이슈 응답",
      value: `${numberFormatter.format(stats.issueSurveyCount)}건`,
      note: `사고·민원 기록 ${numberFormatter.format(stats.incidentReportCount)}건`,
    },
  ];

  return (
    <div className="satisfaction-stats-block">
      <div className="satisfaction-overview-grid">
        {overview.map((item) => (
          <article className="satisfaction-overview-card" key={item.label}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.note}</span>
          </article>
        ))}
      </div>

      <div className="satisfaction-score-grid" aria-label="만족도 항목별 평균">
        {stats.metrics.map((metric) => (
          <SatisfactionMetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      <div className="satisfaction-two-column">
        <article className="satisfaction-issue-panel">
          <h3>이슈 유형</h3>
          {stats.issueTypeRows.length > 0 ? (
            <div className="satisfaction-issue-list">
              {stats.issueTypeRows.map((row) => (
                <span key={row.label}>
                  {row.label} · {row.count}건
                </span>
              ))}
            </div>
          ) : (
            <p className="form-help">이번 달 이슈 유형 응답이 없습니다.</p>
          )}
        </article>

        <article className="satisfaction-feedback-panel">
          <h3>불편사항과 개선 요청</h3>
          {stats.feedbackAccess === "aggregateOnly" ? (
            <p className="form-help">
              VIEWER 권한에서는 주관식 문구를 표시하지 않고 집계값만 제공합니다.
            </p>
          ) : stats.feedbackItems.length > 0 ? (
            <div className="satisfaction-feedback-list">
              {stats.feedbackItems.map((item) => (
                <SatisfactionFeedbackCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="form-help">표시할 주관식 응답이 없습니다.</p>
          )}
          {stats.privacyOmittedCount > 0 ? (
            <p className="form-help">
              민감정보 가능성이 있는 문구 {stats.privacyOmittedCount}건은 표시하지 않았습니다.
            </p>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function SatisfactionMetricCard({ metric }: { metric: SatisfactionScoreMetric }) {
  return (
    <article className="satisfaction-score-card">
      <p>{metric.label}</p>
      <strong>{formatOptionalScore(metric.average)}</strong>
      <span>
        응답 {numberFormatter.format(metric.responseCount)}건 · 4점 이상{" "}
        {formatPercent(metric.positiveRate)}
      </span>
      <div aria-hidden="true" className="satisfaction-meter">
        <span style={{ width: `${metric.positiveRate}%` }} />
      </div>
    </article>
  );
}

function SatisfactionFeedbackCard({ item }: { item: SatisfactionFeedbackItem }) {
  return (
    <div className="satisfaction-feedback-card">
      <mark data-feedback={item.type}>{item.typeLabel}</mark>
      <p>{item.text}</p>
      <small>
        {item.groupLabel} · {item.collectedVia === "mobile" ? "모바일" : "운영자"}
      </small>
    </div>
  );
}

function ComparisonCard({
  row,
  previousMonth,
}: {
  row: MonthlyReportComparisonRow;
  previousMonth: string;
}) {
  const trend = row.delta > 0 ? "up" : row.delta < 0 ? "down" : "same";

  return (
    <article className="monthly-comparison-card">
      <p>{row.label}</p>
      <strong>{formatMetricValue(row.currentValue, row.format)}</strong>
      <span>{previousMonth} {formatMetricValue(row.previousValue, row.format)}</span>
      <small data-trend={trend}>{formatDelta(row.delta, row.format)}</small>
    </article>
  );
}

type CsvContractTableProps = {
  title: string;
  columns: {
    key: string;
    label: string;
    source: string;
    privacy: string;
    note: string;
  }[];
};

function PdfDownloadPanel({ canExport, month }: { canExport: boolean; month: string }) {
  return (
    <article className="pdf-download-card" aria-label="PDF 다운로드">
      <div>
        <p className="eyebrow">PDF</p>
        <h3>월간보고서 PDF 다운로드</h3>
        <p className="csv-download-copy">
          인쇄용 월간보고서를 개인정보 최소화 PDF 파일로 생성합니다.
        </p>
      </div>
      <form action="/admin/reports/pdf" className="csv-download-form" method="post">
        <input name="month" type="hidden" value={month} />
        <label htmlFor="monthly-pdf-reason">
          다운로드 사유
          <textarea
            disabled={!canExport}
            id="monthly-pdf-reason"
            maxLength={300}
            name="reason"
            placeholder="예: 주민협의체 월간 운영보고 제출"
            required
          />
        </label>
        <button disabled={!canExport} type="submit">
          <FaIcon name="pdf" />
          월간보고서 PDF 받기
        </button>
      </form>
      <p className="pdf-download-notice">
        PDF는 월간 집계, 전월 비교, 정산·품질 요약만 포함하며 주민명과 연락처를 제외합니다.
        다운로드 권한과 사유는 AuditLog에 기록됩니다.
        {!canExport ? " 현재 역할은 PDF 다운로드 권한이 없어 조회만 가능합니다." : null}
      </p>
    </article>
  );
}

function CsvDownloadPanel({
  canExport,
  canExportFull,
  month,
}: {
  canExport: boolean;
  canExportFull: boolean;
  month: string;
}) {
  return (
    <div className="csv-download-grid" aria-label="CSV 다운로드">
      <article className="csv-download-card">
        <div>
          <p className="eyebrow">월간 요약</p>
          <h3>집계 CSV 다운로드</h3>
          <p className="csv-download-copy">
            월별 운행, 주민 이용, 정산, 만족도, 사고와 상생기금 집계만 포함합니다.
          </p>
        </div>
        <form action="/admin/reports/export" className="csv-download-form" method="post">
          <input name="kind" type="hidden" value="summary" />
          <input name="month" type="hidden" value={month} />
          <label htmlFor="summary-csv-reason">
            다운로드 사유
            <textarea
              disabled={!canExport}
              id="summary-csv-reason"
              maxLength={300}
              name="reason"
              placeholder="예: 6월 행정 보고 자료 제출"
              required
            />
          </label>
          <button disabled={!canExport} type="submit">
            월간 요약 CSV 받기
          </button>
        </form>
      </article>

      <article className="csv-download-card">
        <div>
          <p className="eyebrow">운행 상세</p>
          <h3>개인정보 범위 선택</h3>
          <p className="csv-download-copy">
            운행별 주민, 동행링커, 택시비, 정산 금액을 권한 기준에 맞게 내보냅니다.
          </p>
        </div>
        <form action="/admin/reports/export" className="csv-download-form" method="post">
          <input name="kind" type="hidden" value="trip-detail" />
          <input name="month" type="hidden" value={month} />
          <label htmlFor="trip-detail-privacy-mode">
            표시 범위
            <select
              defaultValue="masked"
              disabled={!canExport}
              id="trip-detail-privacy-mode"
              name="privacyMode"
            >
              <option value="minimum">최소 공개: 이름과 연락처 제외</option>
              <option value="masked">내부 검토: 이름 포함, 연락처 마스킹</option>
              <option disabled={!canExportFull} value="full">
                전체 연락처 포함: SUPER_ADMIN 전용
              </option>
            </select>
          </label>
          <label htmlFor="trip-detail-csv-reason">
            다운로드 사유
            <textarea
              disabled={!canExport}
              id="trip-detail-csv-reason"
              maxLength={300}
              name="reason"
              placeholder="예: 민원 확인을 위한 내부 검토"
              required
            />
          </label>
          <button disabled={!canExport} type="submit">
            운행 상세 CSV 받기
          </button>
        </form>
      </article>

      <p className="csv-download-notice">
        CSV 다운로드는 권한과 사유 입력이 필요하며 AuditLog에 기록됩니다. CSV는 행정 보고와 내부 검토용이며
        백업 수단으로 사용하지 않습니다.
        {!canExport ? " 현재 역할은 CSV 다운로드 권한이 없어 조회만 가능합니다." : null}
      </p>
    </div>
  );
}

function CsvContractTable({ title, columns }: CsvContractTableProps) {
  return (
    <article className="csv-contract">
      <h3>{title}</h3>
      <div className="contract-table-wrap">
        <table className="contract-table">
          <thead>
            <tr>
              <th>컬럼</th>
              <th>출처</th>
              <th>표시</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((column) => (
              <tr key={column.key}>
                <td>{column.label}</td>
                <td>{column.source}</td>
                <td>{column.privacy}</td>
                <td>{column.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
