import Link from "next/link";
import { AccessDeniedPanel } from "@/components/layout/access-denied-panel";
import { AppShell } from "@/components/layout/app-shell";
import { hasPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  createAdministrativeReportProjection,
  type AdministrativeMonthlyReport,
  type AdministrativeReportMetric,
  type AdministrativeReportRow,
} from "@/server/reports/administrative-report-service";
import { getCurrentUser } from "@/server/auth/session";
import {
  createPreviewMonthlyReport,
  getMonthlyReport,
  parseReportMonth,
  previewMonthlyOperationReport,
} from "@/server/reports/monthly-report-service";

export const dynamic = "force-dynamic";

type AdministrativeReportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const administrativeReportRoles = new Set(["SUPER_ADMIN", "ANCHOR_ADMIN", "VIEWER"]);

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeMonth(value: string | undefined, fallbackMonth: string) {
  try {
    return parseReportMonth(value ?? fallbackMonth);
  } catch {
    return fallbackMonth;
  }
}

function reportBasisLabel(report: AdministrativeMonthlyReport) {
  return report.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
}

function canViewAdministrativeReport(user: AuthUser | null) {
  if (!user) {
    return true;
  }
  return administrativeReportRoles.has(user.role) && hasPermission(user, "report:read");
}

async function loadAdministrativeReport(month: string) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  if (!canViewAdministrativeReport(user)) {
    return { kind: "denied" as const, user };
  }

  if (user && hasPermission(user, "report:read")) {
    try {
      const report = await getMonthlyReport(user, { month });
      return {
        kind: "report" as const,
        report: createAdministrativeReportProjection(report),
        user,
      };
    } catch {
      return {
        kind: "report" as const,
        report: createAdministrativeReportProjection(createPreviewMonthlyReport(month)),
        user,
      };
    }
  }

  return {
    kind: "report" as const,
    report: createAdministrativeReportProjection(createPreviewMonthlyReport(month)),
    user,
  };
}

export default async function AdministrativeReportPage({ searchParams }: AdministrativeReportPageProps) {
  const params = (await searchParams) ?? {};
  const selectedMonth = safeMonth(firstValue(params.month), previewMonthlyOperationReport.month);
  const result = await loadAdministrativeReport(selectedMonth);

  if (result.kind === "denied") {
    return (
      <AppShell currentHref="/admin/reports">
        <main className="page administrative-report-page">
          <AccessDeniedPanel description="행정 열람용 리포트를 볼 권한이 없습니다. VIEWER, ANCHOR_ADMIN, SUPER_ADMIN 권한을 확인해 주세요." />
        </main>
      </AppShell>
    );
  }

  const report = result.report;
  const roleLabel = result.user?.role ?? "PREVIEW";
  const canExportCsv = hasPermission(result.user, "csv:export");
  const screenReportUrl = `/admin/reports?month=${encodeURIComponent(report.month)}`;
  const printReportUrl = `/admin/reports/print?month=${encodeURIComponent(report.month)}`;

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page administrative-report-page">
        <section className="administrative-report-hero" aria-labelledby="administrative-report-title">
          <div>
            <p className="eyebrow">행정 열람 리포트</p>
            <h1 id="administrative-report-title">개인정보 최소화 운영성과</h1>
            <p className="lead">
              행정 열람자는 주민명, 연락처, 운영 메모 없이 월별 성과와 공익 지표만 확인합니다.
              <br />
              CSV 다운로드와 외부 공유는 이 화면에서 분리합니다.
            </p>
          </div>
          <dl className="administrative-report-status" aria-label="열람 기준">
            <div>
              <dt>대상 월</dt>
              <dd>{report.month}</dd>
            </div>
            <div>
              <dt>기준</dt>
              <dd>{reportBasisLabel(report)}</dd>
            </div>
            <div>
              <dt>현재 범위</dt>
              <dd>{roleLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="report-band administrative-report-control" aria-labelledby="administrative-filter-title">
          <div className="section-header">
            <p className="eyebrow">조회</p>
            <h2 id="administrative-filter-title">행정 열람 월 선택</h2>
          </div>
          <form action="/admin/reports/administrative" className="report-month-form">
            <label htmlFor="administrative-month">
              월 선택
              <input defaultValue={report.month} id="administrative-month" name="month" type="month" />
            </label>
            <button type="submit">행정 리포트 조회</button>
          </form>
          <div className="administrative-report-actions">
            <Link className="secondary-action" href={screenReportUrl}>
              전체 리포트
            </Link>
            <Link className="secondary-action" href={printReportUrl}>
              인쇄용 보고서
            </Link>
          </div>
        </section>

        <section className="report-band" aria-labelledby="administrative-privacy-title">
          <div className="section-header">
            <p className="eyebrow">열람 범위</p>
            <h2 id="administrative-privacy-title">VIEWER 기준 표시 범위</h2>
          </div>
          <div className="administrative-scope-grid">
            {report.privacyRules.map((rule) => (
              <div key={rule}>
                <strong>개인정보 제외</strong>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="report-band" aria-labelledby="administrative-summary-title">
          <div className="section-header">
            <p className="eyebrow">요약</p>
            <h2 id="administrative-summary-title">행정 제출 핵심지표</h2>
          </div>
          <div className="administrative-metric-grid">
            {report.metrics.map((metric) => (
              <AdministrativeMetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <div className="administrative-two-column">
          <AdministrativeRowsSection
            eyebrow="운영"
            id="administrative-operation-title"
            rows={report.operationRows}
            title="운영성과 요약"
          />
          <AdministrativeRowsSection
            eyebrow="정산"
            id="administrative-settlement-title"
            rows={report.settlementRows}
            title="정산 요약"
          />
        </div>

        <div className="administrative-two-column">
          <AdministrativeRowsSection
            eyebrow="품질"
            id="administrative-quality-title"
            rows={report.qualityRows}
            title="만족도·안전 요약"
          />
          <AdministrativeRowsSection
            eyebrow="권한"
            id="administrative-permission-title"
            rows={[
              {
                label: "조회 권한",
                value: roleLabel,
                note: "행정 열람은 조회 권한만 사용",
              },
              {
                label: "CSV 다운로드",
                value: canExportCsv ? "별도 권한 있음" : "분리됨",
                note: "다운로드는 사유 입력과 AuditLog 기록 필요",
              },
              ...report.permissionRules.map((rule, index) => ({
                label: `규칙 ${index + 1}`,
                value: "적용",
                note: rule,
              })),
            ]}
            title="권한과 공유 기준"
          />
        </div>

        <section className="report-band" aria-labelledby="administrative-comparison-title">
          <div className="section-header">
            <p className="eyebrow">전월 비교</p>
            <h2 id="administrative-comparison-title">{report.previousMonth} 대비 변화</h2>
          </div>
          <div className="administrative-comparison-grid">
            {report.comparisonRows.map((row) => (
              <article className="administrative-comparison-card" key={row.label}>
                <p>{row.label}</p>
                <strong>{row.value}</strong>
                <span>{row.note}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function AdministrativeMetricCard({ metric }: { metric: AdministrativeReportMetric }) {
  return (
    <article className="administrative-metric-card" data-tone={metric.tone}>
      <p>{metric.label}</p>
      <strong>{metric.value}</strong>
      <span>{metric.note}</span>
    </article>
  );
}

function AdministrativeRowsSection({
  eyebrow,
  id,
  rows,
  title,
}: {
  eyebrow: string;
  id: string;
  rows: AdministrativeReportRow[];
  title: string;
}) {
  return (
    <section className="report-band administrative-row-section" aria-labelledby={id}>
      <div className="section-header">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      <dl className="administrative-row-list">
        {rows.map((row) => (
          <div key={`${row.label}-${row.note}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <span>{row.note}</span>
          </div>
        ))}
      </dl>
    </section>
  );
}
