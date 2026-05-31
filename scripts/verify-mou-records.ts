import assert from "node:assert/strict";
import { AuthorizationError, type AuthUser } from "@/domain/auth/permissions";
import {
  calculateMonthlyReportSnapshot,
  type ReportGroupRecord,
} from "@/server/reports/report-calculator";
import {
  createPreviewMouRecordView,
  previewReportMouRecords,
  saveMouRecord,
} from "@/server/mous/mou-record-service";

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

const preview = createPreviewMouRecordView({ month: "2026-06" });
assert.equal(preview.summary.totalCount, 3);
assert.equal(preview.summary.activeCount, 2);
assert.equal(preview.summary.renewalDueCount, 1);
assert.equal(preview.summary.documentCount, 2);
assert.equal(preview.records.every((record) => record.signedAt.startsWith("2026-06")), true);
assert.equal(JSON.stringify(preview).includes("010-"), false);

const viewerPreview = createPreviewMouRecordView(
  { month: "2026-06" },
  { viewerLimited: true },
);
assert.equal(viewerPreview.viewerLimited, true);
assert.equal(viewerPreview.records.every((record) => record.documentUrl === ""), true);
assert.equal(viewerPreview.records.every((record) => record.scopeSummary === ""), true);

const activeOnly = createPreviewMouRecordView({
  month: "2026-06",
  status: "ACTIVE",
});
assert.equal(activeOnly.records.length, 2);
assert.equal(activeOnly.records.every((record) => record.status === "ACTIVE"), true);

const report = calculateMonthlyReportSnapshot({
  month: "2026-06",
  groups: [] as ReportGroupRecord[],
  mouRecords: previewReportMouRecords,
});
assert.equal(report.mouCount, 3);

async function main() {
  await assert.rejects(
    () =>
      saveMouRecord(viewer, {
        organizationName: "백천보건지소",
        signedAt: "2026-06-01",
        status: "ACTIVE",
      }),
    AuthorizationError,
  );

  await assert.rejects(
    () =>
      saveMouRecord(superAdmin, {
        organizationName: "주민등록번호 확인",
        signedAt: "2026-06-01",
        status: "ACTIVE",
      }),
    /입력|정보/,
  );

  await assert.rejects(
    () =>
      saveMouRecord(superAdmin, {
        organizationName: "백천보건지소",
        signedAt: "2026-06-01",
        startAt: "2026-07-01",
        endAt: "2026-06-30",
        status: "ACTIVE",
      }),
    /시작일/,
  );

  assert.throws(
    () => createPreviewMouRecordView({ month: "2026-06", status: "UNKNOWN" }),
    /상태/,
  );

  console.log("mou-records-ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
