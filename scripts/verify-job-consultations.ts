import assert from "node:assert/strict";
import { AuthorizationError, type AuthUser } from "@/domain/auth/permissions";
import {
  calculateMonthlyReportSnapshot,
  type ReportGroupRecord,
} from "@/server/reports/report-calculator";
import {
  createPreviewJobConsultationView,
  previewReportJobConsultations,
  saveJobConsultation,
} from "@/server/jobs/job-consultation-service";

const superAdmin: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "SUPER_ADMIN",
  isActive: true,
};

const viewer: AuthUser = {
  id: "00000000-0000-4000-8000-000000000006",
  role: "VIEWER",
  isActive: true,
};

const preview = createPreviewJobConsultationView({ month: "2026-06" });
assert.equal(preview.summary.totalCount, 3);
assert.equal(preview.summary.linkerCount, 2);
assert.equal(preview.summary.residentCount, 1);
assert.equal(preview.summary.connectedCount, 1);
assert.equal(preview.summary.inProgressCount, 1);
assert.equal(preview.records.every((record) => record.consultedAt.startsWith("2026-06")), true);
assert.equal(JSON.stringify(preview).includes("010-"), false);

const connectedOnly = createPreviewJobConsultationView({
  month: "2026-06",
  status: "CONNECTED",
});
assert.equal(connectedOnly.records.length, 1);
assert.equal(connectedOnly.records[0]?.status, "CONNECTED");

const report = calculateMonthlyReportSnapshot({
  month: "2026-06",
  groups: [] as ReportGroupRecord[],
  jobConsultations: previewReportJobConsultations,
});
assert.equal(report.jobConsultationCount, 3);

async function main() {
  await assert.rejects(
    () =>
      saveJobConsultation(viewer, {
        targetType: "LINKER",
        targetId: "00000000-0000-4000-8000-000000000301",
        consultedAt: "2026-06-01",
        field: "돌봄 보조",
        status: "REQUESTED",
      }),
    AuthorizationError,
  );

  await assert.rejects(
    () =>
      saveJobConsultation(superAdmin, {
        targetType: "LINKER",
        targetId: "00000000-0000-4000-8000-000000000301",
        consultedAt: "2026-06-01",
        field: "돌봄 보조",
        status: "REQUESTED",
        supportSummary: "주민등록번호 확인",
      }),
    /입력|정보/,
  );

  assert.throws(
    () => createPreviewJobConsultationView({ month: "2026-06", status: "UNKNOWN" }),
    /상태/,
  );

  console.log("job-consultations-ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
