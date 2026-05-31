import { type MonthlyOperationReport } from "@/server/reports/monthly-report-service";

const numberFormatter = new Intl.NumberFormat("ko-KR");

export type AdministrativeReportRow = {
  label: string;
  value: string;
  note: string;
};

export type AdministrativeReportMetric = AdministrativeReportRow & {
  tone: "primary" | "support" | "safety" | "neutral";
};

export type AdministrativeMonthlyReport = {
  month: string;
  previousMonth: string;
  reportDateBasis: MonthlyOperationReport["reportDateBasis"];
  generatedAt: string;
  sourceLabel: string;
  metrics: AdministrativeReportMetric[];
  settlementRows: AdministrativeReportRow[];
  operationRows: AdministrativeReportRow[];
  qualityRows: AdministrativeReportRow[];
  comparisonRows: AdministrativeReportRow[];
  privacyRules: string[];
  permissionRules: string[];
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

function reportBasisLabel(report: MonthlyOperationReport) {
  return report.reportDateBasis === "serviceDate" ? "운행일 기준" : "귀가확인 기준";
}

function formatComparisonValue(value: number, format: MonthlyOperationReport["comparisonRows"][number]["format"]) {
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

function formatDelta(value: number, format: MonthlyOperationReport["comparisonRows"][number]["format"]) {
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

export function createAdministrativeReportProjection(
  report: MonthlyOperationReport,
): AdministrativeMonthlyReport {
  const snapshot = report.snapshot;
  const basis = reportBasisLabel(report);

  return {
    month: report.month,
    previousMonth: report.previousMonth,
    reportDateBasis: report.reportDateBasis,
    generatedAt: report.generatedAt,
    sourceLabel: report.sourceLabel,
    metrics: [
      {
        label: "월간 운행",
        value: formatCount(snapshot.tripCount, "건"),
        note: `${basis} 확정 성과`,
        tone: "primary",
      },
      {
        label: "월 이용 주민",
        value: formatCount(snapshot.monthlyResidentCount, "명"),
        note: `누적 이용 ${formatCount(snapshot.cumulativeResidentCount, "명")}`,
        tone: "primary",
      },
      {
        label: "활동 동행링커",
        value: formatCount(snapshot.activeLinkerCount, "명"),
        note: `${formatCount(snapshot.linkerActivityCount, "건")} 배정 활동`,
        tone: "support",
      },
      {
        label: "총 이동지원비",
        value: formatKrw(snapshot.totalAnchorSupport),
        note: `절감 추정 ${formatKrw(snapshot.estimatedSaving)}`,
        tone: "support",
      },
      {
        label: "주민 평균 부담",
        value: formatKrw(snapshot.averageResidentShare),
        note: "정산 완료 운행 1인 평균",
        tone: "neutral",
      },
      {
        label: "만족도 평균",
        value: formatScore(snapshot.satisfactionAverage),
        note: `정서회복 ${formatScore(snapshot.emotionalRecoveryAverage)}`,
        tone: "safety",
      },
      {
        label: "사고·민원",
        value: formatCount(snapshot.incidentComplaintCount, "건"),
        note: "상세 내용과 작성자 정보 제외",
        tone: "safety",
      },
      {
        label: "상생기금 조성",
        value: formatKrw(snapshot.communityFundAmount),
        note: "지원 기록과 분리 표기",
        tone: "neutral",
      },
      {
        label: "취업연계 상담",
        value: formatCount(snapshot.jobConsultationCount, "건"),
        note: "민감 세부 기록 제외",
        tone: "support",
      },
      {
        label: "MOU",
        value: formatCount(snapshot.mouCount, "건"),
        note: "월 체결 기준",
        tone: "neutral",
      },
    ],
    operationRows: [
      { label: "보고 기준", value: basis, note: "운영 설정의 reportDateBasis 적용" },
      { label: "월 이용 주민", value: formatCount(snapshot.monthlyResidentCount, "명"), note: "주민명 없이 인원수만 제공" },
      { label: "동행링커 활동", value: formatCount(snapshot.linkerActivityCount, "건"), note: "이름과 연락처 없이 활동 건수만 제공" },
      { label: "상생기금", value: formatKrw(snapshot.communityFundAmount), note: "CONTRIBUTION 집계" },
      { label: "취업연계 상담", value: formatCount(snapshot.jobConsultationCount, "건"), note: "대상자 연락처 제외" },
      { label: "MOU", value: formatCount(snapshot.mouCount, "건"), note: "기관별 문서 링크 제외" },
    ],
    settlementRows: [
      { label: "평균 택시요금", value: formatKrw(snapshot.averageFare), note: "정산 완료 운행 기준" },
      { label: "총 이동지원비", value: formatKrw(snapshot.totalAnchorSupport), note: "마을 또는 앵커 지원 합계" },
      { label: "주민 1인 평균 부담", value: formatKrw(snapshot.averageResidentShare), note: "개인별 청구 내역 제외" },
      { label: "절감 추정", value: formatKrw(snapshot.estimatedSaving), note: "기준 요금 대비 추정" },
    ],
    qualityRows: [
      { label: "만족도 평균", value: formatScore(snapshot.satisfactionAverage), note: "주관식 응답 미노출" },
      { label: "정서회복 평균", value: formatScore(snapshot.emotionalRecoveryAverage), note: "점수 평균만 제공" },
      { label: "사고·민원 건수", value: formatCount(snapshot.incidentComplaintCount, "건"), note: "상세 민원 내용 미노출" },
      { label: "취업연계 상담", value: formatCount(snapshot.jobConsultationCount, "건"), note: "민감 세부 기록 미노출" },
      { label: "MOU", value: formatCount(snapshot.mouCount, "건"), note: "월 체결 수만 제공" },
      {
        label: "상생기금 지원 기록",
        value: formatKrw(report.communityFundSummary.supportRecordAmount),
        note: `${formatCount(report.communityFundSummary.recordCount, "건")} 기록 중 지원성 기록 별도 표기`,
      },
    ],
    comparisonRows: report.comparisonRows.map((row) => ({
      label: row.label,
      value: formatComparisonValue(row.currentValue, row.format),
      note: `${report.previousMonth} ${formatComparisonValue(row.previousValue, row.format)} · ${formatDelta(row.delta, row.format)}`,
    })),
    privacyRules: [
      "주민명, 연락처, 주소, 상세 이동 메모는 표시하지 않습니다.",
      "사고·민원은 건수만 표시하고 상세 내용과 작성자 정보는 제외합니다.",
      "만족도는 점수 집계만 표시하고 자유서술 응답은 제외합니다.",
      "동행링커는 활동 인원과 배정 건수만 표시하고 개인 연락처는 제외합니다.",
    ],
    permissionRules: [
      "행정 열람은 report:read 조회 권한 기준으로 제공됩니다.",
      "CSV 다운로드는 별도 csv:export 권한과 사유 입력이 필요합니다.",
      "외부 공유 링크와 공개 대시보드는 이 화면에서 제공하지 않습니다.",
      "PDF 자동 생성은 P2-001에서 별도 구현합니다.",
    ],
  };
}
