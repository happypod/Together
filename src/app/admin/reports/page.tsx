import { AppShell } from "@/components/layout/app-shell";
import {
  CONTACT_LOG_INPUT_RULES,
  DASHBOARD_KPIS,
  MONTHLY_REPORT_METRICS,
  MONTHLY_SUMMARY_CSV_COLUMNS,
  TRIP_DETAIL_CSV_COLUMNS,
} from "@/server/reports/report-contracts";
import { estimateDefaultResidentShare } from "@/server/settlements/calculator";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";

const numberFormatter = new Intl.NumberFormat("ko-KR");

function formatKrw(value: number) {
  return `${numberFormatter.format(value)}원`;
}

export default function ReportsPage() {
  const settings = DEFAULT_OPERATING_SETTINGS;
  const estimatedResidentShare = estimateDefaultResidentShare(
    settings.defaultFare,
    settings.defaultResidentCount,
    settings.fareRoundingPolicy,
  );
  const headlineCards = [
    {
      label: "기본 택시요금",
      value: formatKrw(settings.defaultFare),
      note: "정산 입력 기본값",
    },
    {
      label: "주민 1인 예상액",
      value: formatKrw(estimatedResidentShare),
      note: `${settings.defaultResidentCount}명 기준`,
    },
    {
      label: "그룹 최대 인원",
      value: `${settings.maxGroupResidents}명`,
      note: "공동예약 기준",
    },
    {
      label: "모바일 링크 만료",
      value: `${settings.mobileTokenTtlHours}시간`,
      note: "기본 토큰 TTL",
    },
  ];
  const settingRows = [
    ["월간 리포트 기준일", settings.reportDateBasis],
    ["정산 원 단위 처리", settings.fareRoundingPolicy],
    ["운영 마을", settings.villages.join(", ")],
    ["운영 시간대", settings.timeWindows.join(", ")],
  ];

  return (
    <AppShell currentHref="/admin/reports">
      <main className="page report-page">
        <section className="report-hero" aria-labelledby="report-title">
          <div>
            <p className="eyebrow">리포트 계약</p>
            <h1 id="report-title">월간 리포트와 CSV 기준</h1>
            <p className="lead">
              운영 설정과 정산 산식을 확인합니다.
              <br />
              월간 지표를 확인합니다.
              <br />
              CSV 개인정보 기준도 함께 표시합니다.
            </p>
          </div>
          <div className="report-hero-note" aria-label="현재 기준">
            <strong>성과 기준</strong>
            <span>RETURN_CONFIRMED 이상</span>
          </div>
        </section>

        <section className="report-kpi-grid" aria-label="운영 기본값">
          {headlineCards.map((card) => (
            <article className="report-kpi-card" key={card.label}>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.note}</span>
            </article>
          ))}
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
            <p className="eyebrow">CSV</p>
            <h2 id="csv-title">컬럼과 개인정보 표시 기준</h2>
          </div>
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
