import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { MOBILITY_STATUS_LABELS, SETTLEMENT_MODE_LABELS } from "@/domain/definitions";
import { PRIVACY_INPUT_GUIDANCE } from "@/domain/privacy";
import {
  CONTACT_LOG_INPUT_RULES,
  DASHBOARD_KPIS,
  MONTHLY_REPORT_METRICS,
  MONTHLY_SUMMARY_CSV_COLUMNS,
  TRIP_DETAIL_CSV_COLUMNS,
} from "@/server/reports/report-contracts";

type Violation = {
  file: string;
  line: number;
  term: string;
  text: string;
};

const scanRoots = [
  "src/app",
  "src/components",
  "src/features",
  "src/lib",
  "src/server/reports",
  "README.md",
  "tickets/README.md",
];

const includedExtensions = new Set([".ts", ".tsx", ".md"]);

const forbiddenPatterns = [
  { term: "의료상담", pattern: /의료\s*상담/i },
  { term: "전문 이송", pattern: /전문\s*이송/i },
  { term: "환자 이송", pattern: /환자\s*이송/i },
  { term: "치료", pattern: /치료/i },
  { term: "진단", pattern: /진단/i },
  { term: "처치", pattern: /처치/i },
  { term: "상담 내용", pattern: /상담\s*내용/i },
  { term: "자동 배차", pattern: /자동\s*배차/i },
  { term: "자동 결제", pattern: /자동\s*결제/i },
  { term: "카드 결제", pattern: /카드\s*결제/i },
  { term: "할인", pattern: /할인/i },
  { term: "환급", pattern: /환급/i },
  { term: "실시간 위치", pattern: /실시간\s*위치/i },
  { term: "위치 추적", pattern: /위치\s*추적/i },
  { term: "택시 호출", pattern: /택시\s*호출/i },
  { term: "공개 모빌리티", pattern: /공개\s*모빌리티/i },
  { term: "모빌리티 플랫폼", pattern: /모빌리티\s*플랫폼/i },
  { term: "앱스토어", pattern: /앱\s*스토어/i },
  { term: "공개 앱", pattern: /공개\s*앱/i },
  { term: "기사 전용 앱", pattern: /기사\s*전용\s*앱/i },
];

function extensionOf(path: string) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index) : "";
}

function listFiles(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }

  const stats = statSync(path);
  if (stats.isFile()) {
    return includedExtensions.has(extensionOf(path)) ? [path] : [];
  }

  return readdirSync(path).flatMap((entry) => listFiles(join(path, entry)));
}

function scanText(file: string, text: string) {
  const violations: Violation[] = [];
  const lines = text.split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    for (const forbidden of forbiddenPatterns) {
      if (forbidden.pattern.test(line)) {
        violations.push({
          file,
          line: lineIndex + 1,
          term: forbidden.term,
          text: line.trim(),
        });
      }
    }
  }
  return violations;
}

const sourceViolations = scanRoots.flatMap((root) =>
  listFiles(root).flatMap((file) => scanText(file, readFileSync(file, "utf8"))),
);

const visibleStrings = [
  PRIVACY_INPUT_GUIDANCE,
  ...Object.values(MOBILITY_STATUS_LABELS),
  ...Object.values(SETTLEMENT_MODE_LABELS),
  ...DASHBOARD_KPIS.flatMap((metric) => [metric.label, metric.formula]),
  ...MONTHLY_REPORT_METRICS.flatMap((metric) => [metric.label, metric.formula]),
  ...MONTHLY_SUMMARY_CSV_COLUMNS.flatMap((column) => [column.label, column.note]),
  ...TRIP_DETAIL_CSV_COLUMNS.flatMap((column) => [column.label, column.note]),
  CONTACT_LOG_INPUT_RULES.privacyRule,
  CONTACT_LOG_INPUT_RULES.linkRule,
];

const constantViolations = visibleStrings.flatMap((value, index) =>
  scanText(`visible-constant-${index}`, value),
);

const violations = [...sourceViolations, ...constantViolations];

assert.deepEqual(
  violations,
  [],
  violations
    .map((violation) => `${violation.file}:${violation.line} [${violation.term}] ${violation.text}`)
    .join("\n"),
);

assert.equal(PRIVACY_INPUT_GUIDANCE.includes("건강 세부정보"), true);
assert.equal(CONTACT_LOG_INPUT_RULES.privacyRule.includes("건강 세부정보"), true);
assert.equal(
  TRIP_DETAIL_CSV_COLUMNS.some(
    (column) => column.key === "communityFundSupportAmount" && column.note === "별도 지원 항목",
  ),
  true,
);

console.log("forbidden-operational-language-ok");
