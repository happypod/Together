import { AuthorizationError, assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import {
  createPreviewMonthlyReport,
  getMonthlyReport,
  parseReportMonth,
  type MonthlyOperationReport,
  type MonthlyReportComparisonRow,
  type MonthlyReportMetricKey,
} from "@/server/reports/monthly-report-service";
import { recordPdfExportAudit } from "@/server/reports/export-audit";

export type MonthlyPdfExportInput = {
  month?: string | null;
  reason?: string | null;
};

export type MonthlyPdfExportResult = {
  month: string;
  filename: string;
  contentType: string;
  pdf: Buffer;
  byteLength: number;
  sections: string[];
};

type PdfTextLine = {
  text: string;
  size?: number;
  gapAfter?: number;
  indent?: number;
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const pageMarginX = 54;
const pageTop = 790;
const pageBottom = 54;
const defaultLineSize = 10.5;
const defaultLineGap = 14;
const reportSections = [
  "summary",
  "settlement",
  "quality",
  "communityFund",
  "comparison",
  "privacy",
] as const;

const comparisonMetricLabels: Record<MonthlyReportMetricKey, string> = {
  tripCount: "월간 운행건수",
  monthlyResidentCount: "월 이용 주민",
  activeLinkerCount: "활동 동행링커",
  averageFare: "평균 택시요금",
  totalAnchorSupport: "총 이동지원비",
  satisfactionAverage: "만족도 평균",
  incidentComplaintCount: "사고·민원",
  communityFundAmount: "상생기금 조성",
  jobConsultationCount: "취업연계 상담",
  mouCount: "MOU",
};

const numberFormatter = new Intl.NumberFormat("ko-KR");

function assertPdfExportAllowed(user: AuthUser) {
  assertPermission(user, "csv:export");
  if (!["SUPER_ADMIN", "ANCHOR_ADMIN"].includes(user.role)) {
    throw new AuthorizationError("PDF 다운로드는 운영 책임자 권한에서만 가능합니다.");
  }
}

function normalizeReason(value?: string | null) {
  const reason = String(value ?? "").trim().slice(0, 300);
  if (!reason) {
    throw new Error("PDF 다운로드 사유를 입력해야 합니다.");
  }
  assertNoForbiddenSensitiveInfo({ "PDF 다운로드 사유": reason });
  return reason;
}

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

function displayWidth(text: string) {
  return [...text].reduce((sum, char) => sum + (char.charCodeAt(0) > 0x7f ? 2 : 1), 0);
}

function wrapText(text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (displayWidth(next) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    if (displayWidth(word) <= maxWidth) {
      current = word;
      continue;
    }

    let segment = "";
    for (const char of [...word]) {
      const nextSegment = `${segment}${char}`;
      if (displayWidth(nextSegment) > maxWidth && segment) {
        lines.push(segment);
        segment = char;
      } else {
        segment = nextSegment;
      }
    }
    current = segment;
  }

  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

function pushWrappedLine(lines: PdfTextLine[], line: PdfTextLine) {
  const size = line.size ?? defaultLineSize;
  const indent = line.indent ?? 0;
  const width = Math.max(24, Math.floor((pageWidth - pageMarginX * 2 - indent) / (size * 0.82)));
  const wrapped = wrapText(line.text, width);
  wrapped.forEach((text, index) => {
    lines.push({
      ...line,
      text,
      gapAfter: index === wrapped.length - 1 ? line.gapAfter : size + 2,
    });
  });
}

function makeRow(label: string, value: string, note?: string) {
  return note ? `${label}: ${value} / ${note}` : `${label}: ${value}`;
}

function buildReportLines(report: MonthlyOperationReport) {
  const snapshot = report.snapshot;
  const lines: PdfTextLine[] = [];
  const add = (line: PdfTextLine) => pushWrappedLine(lines, line);

  add({ text: "소원권역 동행이동 월간보고서", size: 18, gapAfter: 22 });
  add({ text: `${report.month} · ${reportBasisLabel(report)}`, size: 12.5, gapAfter: 12 });
  add({ text: `생성 기준: ${report.sourceLabel} · 생성 시각: ${report.generatedAt}`, gapAfter: 18 });

  add({ text: "1. 월간 운영지표", size: 13, gapAfter: 16 });
  [
    makeRow("월간 운행건수", formatCount(snapshot.tripCount, "건"), `${reportBasisLabel(report)} 집계`),
    makeRow("월 이용 주민", formatCount(snapshot.monthlyResidentCount, "명"), `누적 ${formatCount(snapshot.cumulativeResidentCount, "명")}`),
    makeRow("활동 동행링커", formatCount(snapshot.activeLinkerCount, "명"), `${formatCount(snapshot.linkerActivityCount, "건")} 배정 활동`),
    makeRow("평균 택시요금", formatKrw(snapshot.averageFare), "정산 완료 건 기준"),
    makeRow("총 이동지원비", formatKrw(snapshot.totalAnchorSupport), `절감 추정 ${formatKrw(snapshot.estimatedSaving)}`),
    makeRow("주민 1인 평균 부담", formatKrw(snapshot.averageResidentShare), "정산 완료 운행 기준"),
    makeRow("만족도 평균", formatScore(snapshot.satisfactionAverage), `정서회복 ${formatScore(snapshot.emotionalRecoveryAverage)}`),
    makeRow("사고·민원", formatCount(snapshot.incidentComplaintCount, "건"), "상세 내용 제외"),
    makeRow("취업연계 상담", formatCount(snapshot.jobConsultationCount, "건"), "민감 세부 기록 제외"),
    makeRow("MOU", formatCount(snapshot.mouCount, "건"), "월 체결 기준"),
  ].forEach((text) => add({ text, indent: 12 }));

  add({ text: "", gapAfter: 8 });
  add({ text: "2. 정산·품질 요약", size: 13, gapAfter: 16 });
  [
    makeRow("정산 평균 요금", formatKrw(snapshot.averageFare), "운행별 총 요금 평균"),
    makeRow("지원 합계", formatKrw(snapshot.totalAnchorSupport), "마을·앵커 지원 합계"),
    makeRow("주민 부담 평균", formatKrw(snapshot.averageResidentShare), "1인 평균 부담"),
    makeRow("만족도 응답", formatScore(snapshot.satisfactionAverage), "개인 응답 문구 제외"),
    makeRow("정서회복 평균", formatScore(snapshot.emotionalRecoveryAverage), "점수 평균"),
  ].forEach((text) => add({ text, indent: 12 }));

  add({ text: "", gapAfter: 8 });
  add({ text: "3. 상생기금 기록", size: 13, gapAfter: 16 });
  [
    makeRow("대상 월", report.communityFundSummary.month),
    makeRow("상생기금 조성", formatKrw(report.communityFundSummary.contributionAmount), "CONTRIBUTION 집계"),
    makeRow("지원 기록", formatKrw(report.communityFundSummary.supportRecordAmount), "SUPPORT_RECORD 별도 표기"),
    makeRow("기록 수", formatCount(report.communityFundSummary.recordCount, "건"), "월 기준 기록"),
  ].forEach((text) => add({ text, indent: 12 }));

  add({ text: "", gapAfter: 8 });
  add({ text: `4. ${report.previousMonth} 대비 변화`, size: 13, gapAfter: 16 });
  for (const row of report.comparisonRows) {
    add({
      text: makeRow(
        comparisonMetricLabels[row.key],
        `${formatMetricValue(row.currentValue, row.format)} / 전월 ${formatMetricValue(row.previousValue, row.format)}`,
        `증감 ${formatDelta(row.delta, row.format)}`,
      ),
      indent: 12,
    });
  }

  add({ text: "", gapAfter: 8 });
  add({ text: "5. 개인정보 최소화 기준", size: 13, gapAfter: 16 });
  add({
    text:
      "본 PDF는 운영회의와 행정 공유를 위한 집계 보고서입니다. 주민명, 연락처, 상세 민원 내용, 자유서술 응답, 건강정보, 고유식별정보는 포함하지 않습니다.",
    indent: 12,
  });

  return lines;
}

function toUtf16BeHex(text: string) {
  const buffer = Buffer.from(text, "utf16le");
  let hex = "";
  for (let index = 0; index < buffer.length; index += 2) {
    hex += buffer[index + 1].toString(16).padStart(2, "0");
    hex += buffer[index].toString(16).padStart(2, "0");
  }
  return hex.toUpperCase();
}

function textCommand(line: PdfTextLine, y: number) {
  const x = pageMarginX + (line.indent ?? 0);
  const size = line.size ?? defaultLineSize;
  return `BT /FK ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td <${toUtf16BeHex(line.text)}> Tj ET`;
}

function paginate(lines: PdfTextLine[]) {
  const pages: PdfTextLine[][] = [[]];
  let y = pageTop;

  for (const line of lines) {
    const size = line.size ?? defaultLineSize;
    const gapAfter = line.gapAfter ?? defaultLineGap;
    if (line.text && y - size < pageBottom && pages[pages.length - 1].length > 0) {
      pages.push([]);
      y = pageTop;
    }
    pages[pages.length - 1].push(line);
    y -= gapAfter;
  }

  return pages;
}

function buildPageStream(lines: PdfTextLine[], pageNumber: number, totalPages: number) {
  const commands = [
    "1 1 1 rg 0 0 595.28 841.89 re f",
    "0.07 0.24 0.21 rg 54 815 487 3 re f",
    "0.08 0.10 0.09 rg",
  ];
  let y = pageTop;
  for (const line of lines) {
    if (line.text) {
      commands.push(textCommand(line, y));
    }
    y -= line.gapAfter ?? defaultLineGap;
  }
  commands.push(
    "0.31 0.40 0.36 rg 54 36 487 1 re f",
    textCommand(
      {
        text: `소원권역 동행이동 OS · 월간보고서 · ${pageNumber}/${totalPages}`,
        size: 8.5,
      },
      22,
    ),
  );
  return `${commands.join("\n")}\n`;
}

function buildPdfDocument(pageStreams: string[]) {
  const pageObjectIds = pageStreams.map((_, index) => 6 + index * 2);
  const contentObjectIds = pageStreams.map((_, index) => 7 + index * 2);
  const maxObjectId = contentObjectIds[contentObjectIds.length - 1] ?? 5;
  const objects: string[] = [];

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageStreams.length} >>`;
  objects[3] =
    "<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [4 0 R] >>";
  objects[4] =
    "<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor 5 0 R /DW 1000 >>";
  objects[5] =
    "<< /Type /FontDescriptor /FontName /HYGoThic-Medium /Flags 4 /FontBBox [-6 -145 1003 880] /ItalicAngle 0 /Ascent 880 /Descent -145 /CapHeight 880 /StemV 80 >>";

  pageStreams.forEach((stream, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    objects[pageObjectId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /FK 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId] =
      `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`;
  });

  let pdf = "%PDF-1.4\n%Together Mobility Report\n";
  const offsets = Array(maxObjectId + 1).fill(0);
  for (let id = 1; id <= maxObjectId; id += 1) {
    offsets[id] = Buffer.byteLength(pdf, "ascii");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${maxObjectId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxObjectId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "ascii");
}

function buildMonthlyReportPdf(report: MonthlyOperationReport) {
  const pages = paginate(buildReportLines(report));
  return buildPdfDocument(
    pages.map((page, index) => buildPageStream(page, index + 1, pages.length)),
  );
}

function buildResult(report: MonthlyOperationReport): MonthlyPdfExportResult {
  const pdf = buildMonthlyReportPdf(report);
  return {
    month: report.month,
    filename: `together-monthly-report-${report.month}.pdf`,
    contentType: "application/pdf",
    pdf,
    byteLength: pdf.byteLength,
    sections: [...reportSections],
  };
}

export async function exportMonthlyPdf(
  user: AuthUser,
  input: MonthlyPdfExportInput,
): Promise<MonthlyPdfExportResult> {
  assertPdfExportAllowed(user);
  const month = parseReportMonth(input.month);
  const reason = normalizeReason(input.reason);
  const result = buildResult(await getMonthlyReport(user, { month }));

  await recordPdfExportAudit(user, {
    targetType: "MonthlyReport",
    targetId: `pdf:${month}`,
    reason,
    sections: result.sections,
  });

  return result;
}

export function createPreviewMonthlyPdfExport(
  input: Omit<MonthlyPdfExportInput, "reason"> = {},
): MonthlyPdfExportResult {
  const month = parseReportMonth(input.month ?? "2026-06");
  return buildResult(createPreviewMonthlyReport(month));
}
