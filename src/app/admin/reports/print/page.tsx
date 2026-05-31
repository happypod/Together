import Link from "next/link";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewMonthlyReport,
  getMonthlyReport,
  parseReportMonth,
  previewMonthlyOperationReport,
  type MonthlyOperationReport,
  type MonthlyReportComparisonRow,
} from "@/server/reports/monthly-report-service";
import { PrintReportActions } from "./print-report-actions";

export const dynamic = "force-dynamic";

type PrintableReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

type PrintSummaryRow = [label: string, value: string, note: string];

function formatKrw(value: number) {
  return `${numberFormatter.format(value)}원`;
}

function formatCount(value: number, unit: "건" | "명") {
  return `${numberFormatter.format(value)}${unit}`;
}

function formatScore(value: number) {
  return value > 0 ? `${value.toFixed(1)}점` : "응답 없음";
}

function formatMetricValue(value: number, format: MonthlyReportComparisonRow["format"]) {
  if (format === "krw") {
    return formatKrw(value);
  }
  if (format === "score") {
    return formatScore(value);
  }
  if (format === "people") {
    return formatCount(value, "명");
  }
  return formatCount(value, "건");
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
    return `${prefix}${formatCount(value, "명")}`;
  }
  return `${prefix}${formatCount(value, "건")}`;
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

async function loadMonthlyReport(month: string) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (user && !hasPermission(user, "report:read")) {
    return { kind: "denied" as const };
  }

  if (user && hasPermission(user, "report:read")) {
    try {
      return {
        kind: "report" as const,
        report: await getMonthlyReport(user, { month }),
      };
    } catch {
      return {
        kind: "report" as const,
        report: createPreviewMonthlyReport(month),
      };
    }
  }

  return {
    kind: "report" as const,
    report: createPreviewMonthlyReport(month),
  };
}

export default async function PrintableMonthlyReportPage({ searchParams }: PrintableReportPageProps) {
  const params = (await searchParams) ?? {};
  const selectedMonth = safeMonth(
    firstValue(params.month),
    previewMonthlyOperationReport.month || currentMonth(),
  );
  const result = await loadMonthlyReport(selectedMonth);

  if (result.kind === "denied") {
    return (
      <AppShell currentHref="/admin/reports">
        <main className="page print-report-page">
          <AccessDeniedPanel description="월간보고서를 인쇄할 권한이 없습니다. 운영 책임자에게 권한 확인을 요청하세요." />
        </main>
      </AppShell>
    );
  }

  const monthlyReport = result.report;
  const snapshot = monthlyReport.snapshot;
  const screenReportUrl = `/admin/reports?month=${encodeURIComponent(monthlyReport.month)}`;
  const headlineMetrics = [
    {
      label: "월간 운행건수",
      value: formatCount(snapshot.tripCount, "건"),
      note: `${reportBasisLabel(monthlyReport)} 집계`,
    },
    {
      label: "월 이용 주민",
      value: formatCount(snapshot.monthlyResidentCount, "명"),
      note: `누적 ${formatCount(snapshot.cumulativeResidentCount, "명")}`,
    },
    {
      label: "활동 동행링커",
      value: formatCount(snapshot.activeLinkerCount, "명"),
      note: `${formatCount(snapshot.linkerActivityCount, "건")} 배정 활동`,
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
      label: "주민 평균 부담",
      value: formatKrw(snapshot.averageResidentShare),
      note: "1인 평균 부담액",
    },
    {
      label: "만족도 평균",
      value: formatScore(snapshot.satisfactionAverage),
      note: `정서회복 ${formatScore(snapshot.emotionalRecoveryAverage)}`,
    },
    {
      label: "사고·민원",
      value: formatCount(snapshot.incidentComplaintCount, "건"),
      note: "상세 내용은 제외",
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
  const settlementRows: PrintSummaryRow[] = [
    ["평균 택시요금", formatKrw(snapshot.averageFare), "정산 완료 운행의 평균 총 요금"],
    ["총 이동지원비", formatKrw(snapshot.totalAnchorSupport), "마을 또는 앵커 지원 합계"],
    ["주민 1인 평균 부담", formatKrw(snapshot.averageResidentShare), "정산 완료 운행의 평균 부담액"],
    ["절감 추정", formatKrw(snapshot.estimatedSaving), "기준 요금 대비 절감 추정"],
  ];
  const qualityRows: PrintSummaryRow[] = [
    ["만족도 평균", formatScore(snapshot.satisfactionAverage), "개인 응답 문구 없이 점수만 표기"],
    ["정서회복 평균", formatScore(snapshot.emotionalRecoveryAverage), "응답 점수 평균"],
    ["사고·민원 건수", formatCount(snapshot.incidentComplaintCount, "건"), "상세 내용 및 작성자 정보 제외"],
    ["취업연계 상담", formatCount(snapshot.jobConsultationCount, "건"), "대상자 연락처와 민감 세부 기록 제외"],
    ["MOU", formatCount(snapshot.mouCount, "건"), "기관별 문서 링크 없이 체결 건수만 표기"],
  ];
  const communityFundRows: PrintSummaryRow[] = [
    ["대상 월", monthlyReport.communityFundSummary.month, "보고서 기준 월"],
    ["상생기금 조성", formatKrw(monthlyReport.communityFundSummary.contributionAmount), "CONTRIBUTION 집계"],
    ["지원 기록", formatKrw(monthlyReport.communityFundSummary.supportRecordAmount), "SUPPORT_RECORD 별도 표기"],
    ["기록 수", formatCount(monthlyReport.communityFundSummary.recordCount, "건"), "월 기준 기록 건수"],
  ];

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page print-report-page">
        <section className="print-report-toolbar" aria-label="인쇄용 보고서 조작">
          <form action="/admin/reports/print" className="report-month-form">
            <label htmlFor="print-month">
              인쇄 월 선택
              <input defaultValue={monthlyReport.month} id="print-month" name="month" type="month" />
            </label>
            <button type="submit">인쇄 화면 조회</button>
          </form>
          <div className="print-report-actions">
            <Link className="secondary-action" href={screenReportUrl}>
              화면 리포트
            </Link>
            <PrintReportActions />
          </div>
        </section>

        <article className="print-sheet" aria-labelledby="print-report-title">
          <header className="print-report-header">
            <div>
              <p className="eyebrow">인쇄용 월간보고서</p>
              <h1 id="print-report-title">소원권역 동행이동 월간보고서</h1>
              <p>
                {monthlyReport.month} · {reportBasisLabel(monthlyReport)}
              </p>
            </div>
            <dl className="print-report-meta">
              <div>
                <dt>생성 기준</dt>
                <dd>{monthlyReport.sourceLabel}</dd>
              </div>
              <div>
                <dt>생성 시각</dt>
                <dd>{monthlyReport.generatedAt}</dd>
              </div>
              <div>
                <dt>개인정보</dt>
                <dd>주민명·연락처 제외</dd>
              </div>
            </dl>
          </header>

          <section className="print-section" aria-labelledby="print-summary-title">
            <div className="print-section-heading">
              <p className="eyebrow">요약</p>
              <h2 id="print-summary-title">월간 운영지표</h2>
            </div>
            <div className="print-kpi-grid">
              {headlineMetrics.map((metric) => (
                <div className="print-kpi-card" key={metric.label}>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <span>{metric.note}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="print-two-column">
            <PrintSummarySection rows={settlementRows} title="정산 요약" />
            <PrintSummarySection rows={qualityRows} title="만족도·안전 요약" />
          </div>

          <section className="print-section" aria-labelledby="print-fund-title">
            <div className="print-section-heading">
              <p className="eyebrow">상생기금</p>
              <h2 id="print-fund-title">상생기금 기록</h2>
            </div>
            <PrintSummaryTable rows={communityFundRows} />
          </section>

          <section className="print-section" aria-labelledby="print-compare-title">
            <div className="print-section-heading">
              <p className="eyebrow">전월 비교</p>
              <h2 id="print-compare-title">{monthlyReport.previousMonth} 대비 변화</h2>
            </div>
            <div className="print-table-wrap">
              <table className="print-table">
                <thead>
                  <tr>
                    <th>지표</th>
                    <th>{monthlyReport.month}</th>
                    <th>{monthlyReport.previousMonth}</th>
                    <th>증감</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.comparisonRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td>{formatMetricValue(row.currentValue, row.format)}</td>
                      <td>{formatMetricValue(row.previousValue, row.format)}</td>
                      <td>{formatDelta(row.delta, row.format)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="print-section print-note" aria-labelledby="print-privacy-title">
            <h2 id="print-privacy-title">개인정보 최소화 기준</h2>
            <p>
              본 인쇄용 보고서는 운영회의와 행정 공유를 위한 집계 보고서입니다. 주민명, 연락처, 상세 민원
              내용, 자유서술 응답은 포함하지 않으며 월별 집계 수치와 요약 문구만 표시합니다.
            </p>
          </section>

          <footer className="print-footer">
            <span>소원권역 동행이동 OS</span>
            <span>{monthlyReport.month} 인쇄용 월간보고서</span>
          </footer>
        </article>
      </main>
    </AppShell>
  );
}

function PrintSummarySection({ rows, title }: { rows: PrintSummaryRow[]; title: string }) {
  const titleId = title === "정산 요약" ? "print-settlement-title" : "print-quality-title";

  return (
    <section className="print-section" aria-labelledby={titleId}>
      <div className="print-section-heading">
        <p className="eyebrow">집계</p>
        <h2 id={titleId}>{title}</h2>
      </div>
      <PrintSummaryTable rows={rows} />
    </section>
  );
}

function PrintSummaryTable({ rows }: { rows: PrintSummaryRow[] }) {
  return (
    <div className="print-table-wrap">
      <table className="print-table">
        <tbody>
          {rows.map(([label, value, note]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
              <td>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
