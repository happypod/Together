import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { MOBILE_FORM_ALLOWED_FIELDS } from "@/server/mobile-forms/token-service";

type Violation = {
  area: string;
  file: string;
  line: number;
  rule: string;
  text: string;
};

const sourceRoots = [
  "src/app",
  "src/components",
  "src/features",
  "src/server",
  "src/domain",
  "src/lib",
  "README.md",
  "tickets/README.md",
  ".env.example",
  "next.config.ts",
  "package.json",
  "prisma/schema.prisma",
  "prisma/seed.mjs",
];

const skippedSourceFiles = new Set([
  "src/domain/privacy.ts",
]);

const includedExtensions = new Set([".ts", ".tsx", ".mjs", ".json", ".md", ".prisma", ".example"]);

const bannedDependencyPatterns = [
  /stripe/i,
  /toss.?payments/i,
  /portone/i,
  /iamport/i,
  /paypal/i,
  /nicepay/i,
  /bootpay/i,
  /mapbox/i,
  /@googlemaps/i,
  /openai/i,
  /anthropic/i,
  /langchain/i,
  /pdfkit/i,
  /jspdf/i,
  /pdfmake/i,
  /puppeteer/i,
  /@react-pdf/i,
  /html2pdf/i,
];

const bannedEnvPatterns = [
  /STRIPE|TOSS|PORTONE|IAMPORT|PAYPAL|NICEPAY|BOOTPAY/i,
  /PAYMENT|CARD|CHECKOUT/i,
  /KAKAO_MOBILITY|TAXI_API|DISPATCH_API|VEHICLE_API/i,
  /MAPBOX|GOOGLE_MAP|NAVER_MAP|KAKAO_MAP|GEOLOCATION|LOCATION_TRACKING/i,
  /OPENAI|ANTHROPIC|AI_ROUTE|ROUTE_OPTIMIZATION/i,
  /PDF_EXPORT|PDF_GENERATOR/i,
];

const bannedRouteSegments = [
  "api",
  "payment",
  "payments",
  "checkout",
  "dispatch",
  "tracking",
  "location",
  "map",
  "driver",
  "drivers",
  "pdf",
  "ai",
  "app-store",
];

const allowedInternalRouteHandlers = new Set([
  "src/app/admin/reports/export/route.ts",
  "src/app/admin/reports/pdf/route.ts",
]);

const sourcePatterns = [
  {
    rule: "payment-or-card-integration",
    pattern: /\b(stripe|tosspayments|portone|iamport|paypal|nicepay|bootpay|checkout|PaymentRequest)\b/i,
  },
  {
    rule: "external-map-or-geolocation",
    pattern: /\b(mapbox|google\.maps|@googlemaps|naver\.maps|kakao\.maps|navigator\.geolocation|watchPosition|getCurrentPosition)\b/i,
  },
  {
    rule: "auto-dispatch-or-external-vehicle-api",
    pattern: /\b(autoDispatch|automaticDispatch|dispatchVehicle|externalTaxiApi|vehicleApi|taxiApiClient)\b/i,
  },
  {
    rule: "ai-route-optimization",
    pattern: /\b(routeOptimization|optimizeRoute|aiRoute|openai|anthropic|langchain)\b/i,
  },
  {
    rule: "pdf-output-automation",
    pattern: /\b(pdfkit|jspdf|pdfmake|puppeteer|@react-pdf|html2pdf|generatePdf|pdfExport|printToPDF)\b/i,
  },
  {
    rule: "excluded-feature-copy",
    pattern:
      /공개\s*앱스토어|불특정\s*다수\s*가입|택시\s*호출|자동\s*배차|자동\s*결제|카드\s*결제|실시간\s*위치|위치\s*추적|좌표\s*추적|기사\s*전용\s*앱|AI\s*경로|경로\s*최적|의료\s*상담|전문\s*이송|건강\s*민감\s*세부정보\s*수집/i,
  },
];

const bannedPrismaFieldPatterns = [
  /\b(latitude|longitude|lat|lng|coordinate|coordinates|gps|geofence)\b/i,
  /\b(payment|payments|card|checkout|paymentIntent|transactionId|billingKey)\b/i,
  /\b(autoDispatch|dispatchProvider|externalTaxiApi|vehicleApi|mapProvider|routePolyline|routeOptimization)\b/i,
  /\b(diagnosis|treatment|prescription|medicalRecord|symptom|bloodPressure|bloodSugar)\b/i,
];

const bannedMobileFieldPatterns = [
  /payment|card|checkout|billing/i,
  /latitude|longitude|lat|lng|coordinate|gps|location/i,
  /diagnosis|treatment|prescription|medical|symptom|blood/i,
  /routeOptimization|autoDispatch|driverApp/i,
];

function extensionOf(path: string) {
  if (path === ".env.example") {
    return ".example";
  }
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index) : "";
}

function normalizePath(path: string) {
  return path.replaceAll("\\", "/");
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

function scanText(area: string, file: string, text: string, patterns = sourcePatterns) {
  const violations: Violation[] = [];
  const lines = text.split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    for (const rule of patterns) {
      if (rule.pattern.test(line)) {
        violations.push({
          area,
          file,
          line: lineIndex + 1,
          rule: rule.rule,
          text: line.trim(),
        });
      }
    }
  }
  return violations;
}

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

const packageJson = readJson("package.json") as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
const dependencyViolations = Object.keys(dependencies).filter((name) =>
  bannedDependencyPatterns.some((pattern) => pattern.test(name)),
);
assert.deepEqual(dependencyViolations, [], "Excluded external SDK dependency is installed");

const envText = readFileSync(".env.example", "utf8");
const envViolations = envText
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.trim().startsWith("#"))
  .filter((line) => bannedEnvPatterns.some((pattern) => pattern.test(line)));
assert.deepEqual(envViolations, [], "Excluded feature environment variable exists");
assert.match(envText, /NEXT_PUBLIC_APP_NAME="소원권역 동행이동 OS"/);
assert.doesNotMatch(envText, /백천만/);

const routeFiles = listFiles("src/app").filter((file) => file.endsWith("route.ts"));
const publicRouteFiles = routeFiles.filter((file) => !allowedInternalRouteHandlers.has(normalizePath(file)));
assert.deepEqual(publicRouteFiles, [], "P0 should not expose public route-handler APIs");

for (const routeFile of routeFiles) {
  const normalized = normalizePath(routeFile);
  const routeText = readFileSync(routeFile, "utf8");
  if (allowedInternalRouteHandlers.has(normalized)) {
    assert.match(routeText, /requireCurrentUser/, `${normalized} should require an authenticated admin user`);
    assert.match(routeText, /export\s+async\s+function\s+POST/, `${normalized} should only expose a POST workflow`);
    assert.match(routeText, /export\s+function\s+GET/, `${normalized} should reject direct GET access`);
    assert.match(routeText, /status:\s*405/, `${normalized} should return 405 for GET access`);
    assert.match(routeText, /Cache-Control":\s*"no-store"/, `${normalized} should disable response caching`);
  }
}

const appRouteViolations = listFiles("src/app")
  .map((file) => normalizePath(relative("src/app", file)))
  .filter((path) => !allowedInternalRouteHandlers.has(`src/app/${path}`))
  .filter((path) =>
    path
      .split("/")
      .some((segment) => bannedRouteSegments.includes(segment.toLowerCase().replace(/\.(tsx|ts)$/, ""))),
  );
assert.deepEqual(appRouteViolations, [], "Excluded feature route segment exists");

const sourceViolations = sourceRoots.flatMap((root) =>
  listFiles(root).flatMap((file) => {
    const normalized = normalizePath(file);
    if (skippedSourceFiles.has(normalized)) {
      return [];
    }
    return scanText("source", normalized, readFileSync(file, "utf8"));
  }),
);
assert.deepEqual(
  sourceViolations,
  [],
  sourceViolations
    .map((violation) => `${violation.file}:${violation.line} [${violation.rule}] ${violation.text}`)
    .join("\n"),
);

const prismaText = readFileSync("prisma/schema.prisma", "utf8");
const prismaViolations = prismaText
  .split(/\r?\n/)
  .flatMap((line, index) =>
    bannedPrismaFieldPatterns
      .filter((pattern) => pattern.test(line))
      .map((pattern) => ({
        area: "prisma",
        file: "prisma/schema.prisma",
        line: index + 1,
        rule: pattern.source,
        text: line.trim(),
      })),
  );
assert.deepEqual(
  prismaViolations,
  [],
  prismaViolations
    .map((violation) => `${violation.file}:${violation.line} [${violation.rule}] ${violation.text}`)
    .join("\n"),
);

const mobileFields = Object.values(MOBILE_FORM_ALLOWED_FIELDS).flat();
const mobileFieldViolations = mobileFields.filter((field) =>
  bannedMobileFieldPatterns.some((pattern) => pattern.test(field)),
);
assert.deepEqual(mobileFieldViolations, [], "Mobile link allows excluded feature field");

assert.deepEqual(
  Object.keys(MOBILE_FORM_ALLOWED_FIELDS).sort(),
  ["REQUEST_INTAKE", "RETURN_CONFIRM", "SURVEY_SUBMIT", "TAXI_CONFIRM", "TRIP_CHECK"].sort(),
);

console.log("excluded-features-ok");
