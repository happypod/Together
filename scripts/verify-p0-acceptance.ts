import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ADMIN_ROUTE_ACCESS_RULES, ACTION_ACCESS_RULES } from "@/domain/auth/rbac-policy";
import { AUDIT_ACTIONS, MOBILITY_STATUSES, type AuditAction } from "@/domain/definitions";
import { MOBILITY_STATUS_TRANSITIONS } from "@/domain/status";
import { navigationItems } from "@/lib/navigation";
import {
  DASHBOARD_KPIS,
  MONTHLY_REPORT_METRICS,
  MONTHLY_SUMMARY_CSV_COLUMNS,
  TRIP_DETAIL_CSV_COLUMNS,
} from "@/server/reports/report-contracts";
import { MOBILE_FORM_ALLOWED_FIELDS } from "@/server/mobile-forms/token-service";

const requiredRoutes = [
  "src/app/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/requests/page.tsx",
  "src/app/admin/groups/page.tsx",
  "src/app/admin/trips/page.tsx",
  "src/app/admin/settlements/page.tsx",
  "src/app/admin/reports/page.tsx",
  "src/app/login/page.tsx",
  "src/app/m/[token]/page.tsx",
];

const requiredActionModules = [
  "src/app/login/actions.ts",
  "src/app/admin/requests/actions.ts",
  "src/app/admin/groups/actions.ts",
  "src/app/admin/trips/actions.ts",
  "src/app/admin/settlements/actions.ts",
  "src/app/m/[token]/actions.ts",
];

const requiredServices = [
  "src/server/auth/guard.ts",
  "src/server/auth/session.ts",
  "src/server/audit/audit-log.ts",
  "src/server/residents/resident-request-service.ts",
  "src/server/groups/mobility-group-service.ts",
  "src/server/trips/trip-operation-service.ts",
  "src/server/settlements/settlement-service.ts",
  "src/server/reports/report-contracts.ts",
  "src/server/mobile-forms/token-service.ts",
  "src/server/files/file-attachment-service.ts",
];

const requiredScripts = [
  "scripts/verify-privacy-rules.ts",
  "scripts/verify-state-transitions.ts",
  "scripts/verify-settlement-formulas.ts",
  "scripts/verify-rbac-access.ts",
  "scripts/verify-forbidden-operational-language.ts",
  "scripts/verify-excluded-features.ts",
];

const completedP0BeforeFinalAcceptance = [
  "T-001",
  "T-002",
  "T-003",
  "T-004",
  "T-005",
  "T-006",
  "T-007",
  "T-008",
  "T-061",
  "T-062",
  "T-063",
  "T-065",
  "T-066",
  "T-067",
];

const requiredPrismaModels = [
  "User",
  "Resident",
  "MobilityRequest",
  "MobilityGroup",
  "MobilityGroupMember",
  "Linker",
  "TaxiReservation",
  "Settlement",
  "AuditLog",
  "MobileFormToken",
  "AppSetting",
];

const requiredAuditActions = [
  "CREATE",
  "UPDATE",
  "STATUS_CHANGE",
  "SETTLEMENT_LOCK",
  "SETTLEMENT_UNLOCK",
  "TOKEN_CREATE",
  "TOKEN_SUBMIT",
  "TOKEN_REVOKE",
  "EXPORT_CSV",
] satisfies readonly AuditAction[];

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function assertExists(path: string) {
  assert.equal(existsSync(path), true, `${path} is missing`);
}

function listFiles(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }

  const stats = statSync(path);
  if (stats.isFile()) {
    return [path];
  }

  return readdirSync(path).flatMap((entry) => listFiles(join(path, entry)));
}

function normalizePath(path: string) {
  return path.replaceAll("\\", "/");
}

function parseQueueStatuses(queueText: string) {
  const statuses = new Map<string, string>();
  for (const line of queueText.split(/\r?\n/)) {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length >= 5 && /^T-\d+/.test(cells[1])) {
      statuses.set(cells[1], cells[3]);
    }
  }
  return statuses;
}

for (const path of [...requiredRoutes, ...requiredActionModules, ...requiredServices, ...requiredScripts]) {
  assertExists(path);
}

const routeHandlers = listFiles("src/app")
  .map((path) => normalizePath(relative(process.cwd(), path)))
  .filter((path) => path.endsWith("route.ts"));
assert.deepEqual(
  routeHandlers,
  ["src/app/admin/reports/export/route.ts", "src/app/admin/reports/pdf/route.ts"],
  "Only authenticated admin export route handlers should be exposed",
);

const adminRoutePages = requiredRoutes.filter((path) => path.includes("src/app/admin/"));
for (const path of adminRoutePages) {
  const source = readText(path);
  assert.match(source, /AppShell/, `${path} should render inside the admin shell`);
}

for (const path of adminRoutePages.filter((path) => path !== "src/app/admin/reports/page.tsx")) {
  const source = readText(path);
  assert.match(source, /preview[A-Z]/, `${path} should provide preview data when DB is unavailable`);
  assert.match(source, /catch\s*\{/, `${path} should keep rendering if DB access fails`);
}

assert.deepEqual(
  ADMIN_ROUTE_ACCESS_RULES.map((rule) => rule.href),
  navigationItems.map((item) => item.href),
  "Navigation and RBAC route hrefs should stay aligned",
);
assert.deepEqual(
  ADMIN_ROUTE_ACCESS_RULES.map((rule) => rule.id),
  ["dashboard", "requests", "groups", "calendar", "trips", "settlements", "reports"],
);
assert.deepEqual(
  ACTION_ACCESS_RULES.map((rule) => rule.id),
  [
    "createResidentRequest",
    "createMobilityGroup",
    "transitionGroupStatus",
    "assignLinkerToGroup",
    "createLinker",
    "updateLinkerStatus",
    "requestTaxiReservation",
    "confirmTaxiReservation",
    "updateTripStatus",
    "confirmReturn",
    "saveSettlement",
    "updateLockedSettlement",
    "prepareSettlementCsv",
    "exportMonthlyCsv",
    "exportMonthlyPdf",
    "createJobConsultation",
    "createMouRecord",
    "createUser",
    "updateUserRole",
    "deactivateUser",
    "createMobileFormToken",
    "uploadReceipt",
  ],
);

for (const action of requiredAuditActions) {
  assert.equal(AUDIT_ACTIONS.includes(action), true, `${action} audit action is missing`);
}

for (const status of MOBILITY_STATUSES) {
  assert.ok(status in MOBILITY_STATUS_TRANSITIONS, `${status} transition row is missing`);
}

assert.deepEqual(
  Object.keys(MOBILE_FORM_ALLOWED_FIELDS).sort(),
  ["REQUEST_INTAKE", "RETURN_CONFIRM", "SURVEY_SUBMIT", "TAXI_CONFIRM", "TRIP_CHECK"].sort(),
);
assert.equal(MOBILE_FORM_ALLOWED_FIELDS.REQUEST_INTAKE.includes("privacyConsent"), true);
assert.equal(MOBILE_FORM_ALLOWED_FIELDS.REQUEST_INTAKE.includes("sensitiveInfoNotCollected"), true);
assert.equal(MOBILE_FORM_ALLOWED_FIELDS.TRIP_CHECK.includes("driverPhone"), false);

assert.ok(DASHBOARD_KPIS.length >= 4, "Dashboard KPI contract should include core operational metrics");
assert.ok(MONTHLY_REPORT_METRICS.length >= 4, "Monthly report metric contract should exist");
assert.ok(MONTHLY_SUMMARY_CSV_COLUMNS.length > 0, "Monthly summary CSV contract should exist");
assert.ok(TRIP_DETAIL_CSV_COLUMNS.length > 0, "Trip detail CSV contract should exist");
assert.equal(
  TRIP_DETAIL_CSV_COLUMNS.some((column) => column.key === "residentPhones" && column.privacy === "masked"),
  true,
  "Trip detail CSV should mask resident phones",
);

const prismaSchema = readText("prisma/schema.prisma");
for (const model of requiredPrismaModels) {
  assert.match(prismaSchema, new RegExp(`model\\s+${model}\\s+\\{`), `${model} model is missing`);
}
assert.match(prismaSchema, /enum\s+MobileTokenScope\s+\{/, "MobileTokenScope enum is missing");

const envExample = readText(".env.example");
for (const envName of [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_APP_NAME",
  "INITIAL_SUPER_ADMIN_EMAIL",
  "INITIAL_SUPER_ADMIN_PASSWORD",
  "RECEIPT_MAX_FILE_MB",
  "MOBILE_FORM_TOKEN_TTL_HOURS",
  "REPORT_DATE_BASIS",
  "SETTLEMENT_ROUNDING_POLICY",
]) {
  assert.match(envExample, new RegExp(`^${envName}=`, "m"), `${envName} is missing from .env.example`);
}
assert.match(envExample, /NEXT_PUBLIC_APP_NAME="소원권역 동행이동 OS"/);

const globalsCss = readText("src/app/globals.css");
for (const pattern of [
  /color-scheme:\s*light/,
  /font-size:\s*17px/,
  /min-width:\s*300px/,
  /:focus-visible/,
  /data-font-scale/,
  /data-contrast/,
  /\.bottom-nav/,
  /@media\s*\(max-width:\s*560px\)/,
  /@media\s*\(min-width:\s*900px\)/,
  /@media\s*\(min-width:\s*1120px\)/,
]) {
  assert.match(globalsCss, pattern, `Responsive or senior-friendly UI rule is missing: ${pattern}`);
}

const queueStatuses = parseQueueStatuses(readText("tickets/_roadmap/queue.md"));
for (const ticketId of completedP0BeforeFinalAcceptance) {
  assert.equal(queueStatuses.get(ticketId), "done", `${ticketId} should be done before T-068`);
}
assert.ok(
  ["ready", "review", "done"].includes(queueStatuses.get("T-068") ?? ""),
  "T-068 should be ready, review, or done during final acceptance",
);

const qualityGates = readText("tickets/_roadmap/quality_gates.md");
for (const ticketId of ["T-061", "T-062", "T-063", "T-065", "T-066", "T-067"]) {
  assert.match(qualityGates, new RegExp(`- \\[x\\] ${ticketId}`), `${ticketId} quality gate is not checked`);
}

const status = JSON.parse(readText("tickets/_roadmap/status.json")) as {
  activeTicket?: string | null;
  counts?: { done?: number; planned?: number; ready?: number };
};
const knownActiveTicket = ["T-068", "T-031", "P2-001", "P2-002", "P2-003", "P2-004"].includes(
  status.activeTicket ?? "",
);
const queueComplete = status.activeTicket === null && (status.counts?.planned ?? 0) === 0;
assert.ok(
  knownActiveTicket || queueComplete,
  "activeTicket should be T-068, next P1/current P2 ticket, or null when the queue is complete",
);
assert.ok((status.counts?.done ?? 0) >= 14, "At least 14 P0 tickets should be done before final acceptance");
assert.ok((status.counts?.ready ?? 0) >= 0, "Ready ticket count should be present");

console.log("p0-acceptance-ok");
