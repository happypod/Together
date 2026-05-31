import assert from "node:assert/strict";
import {
  assertNoForbiddenSensitiveInfo,
  hasForbiddenSensitiveInfo,
  maskPhone,
  redactSensitiveValue,
} from "../src/domain/privacy";
import { hasPermission, type AuthUser } from "../src/domain/auth/permissions";
import { validateFileAttachment } from "../src/server/files/file-attachment-service";
import {
  getDisallowedMobileFields,
  MOBILE_FORM_ALLOWED_FIELDS,
} from "../src/server/mobile-forms/token-service";
import { TRIP_DETAIL_CSV_COLUMNS } from "../src/server/reports/report-contracts";

function expectPrivacyBlock(name: string, callback: () => void) {
  assert.throws(callback, {
    message: /주민등록번호/,
  }, `${name} should reject forbidden sensitive information`);
}

const viewer: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "VIEWER",
  isActive: true,
};
const anchorAdmin: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  role: "ANCHOR_ADMIN",
  isActive: true,
};

assert.equal(maskPhone("010-1234-5678"), "010-****-5678");
assert.equal(maskPhone("123456"), "******");

assert.equal(hasForbiddenSensitiveInfo("주민등록번호 123456-1234567"), true);
assert.equal(hasForbiddenSensitiveInfo("진단명과 처치 내용을 기록"), true);
assert.equal(hasForbiddenSensitiveInfo("백천마을 회관에서 탑승"), false);

expectPrivacyBlock("field validation", () =>
  assertNoForbiddenSensitiveInfo({
    요청메모: "주민등록번호 123456-1234567",
  }),
);

const redacted = redactSensitiveValue({
  phone: "010-1234-5678",
  memo: "운영 메모",
  notes: "진단명 입력",
  tokenHash: "plain-token-hash",
}) as Record<string, unknown>;
assert.equal(redacted.phone, "010-****-5678");
assert.equal(redacted.memo, "[SUMMARY_REDACTED]");
assert.equal(redacted.notes, "[SUMMARY_REDACTED]");
assert.equal(redacted.tokenHash, "[REDACTED]");

assert.equal(hasPermission(viewer, "csv:export"), false);
assert.equal(hasPermission(anchorAdmin, "csv:export"), true);

assert.deepEqual(getDisallowedMobileFields("TRIP_CHECK", ["notes", "driverPhone"]), [
  "driverPhone",
]);
assert.equal(MOBILE_FORM_ALLOWED_FIELDS.TRIP_CHECK.includes("driverPhone"), false);
assert.equal(MOBILE_FORM_ALLOWED_FIELDS.TAXI_CONFIRM.includes("driverPhone"), true);

const residentNames = TRIP_DETAIL_CSV_COLUMNS.find((column) => column.key === "residentNames");
const residentPhones = TRIP_DETAIL_CSV_COLUMNS.find((column) => column.key === "residentPhones");
assert.equal(residentNames?.privacy, "restricted");
assert.equal(residentPhones?.privacy, "masked");

validateFileAttachment({
  targetType: "Settlement",
  targetId: "00000000-0000-4000-8000-000000000003",
  fileType: "RECEIPT",
  fileName: "receipt-2026-06-03.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  url: "https://example.com/receipt-2026-06-03.pdf",
});

expectPrivacyBlock("file metadata validation", () =>
  validateFileAttachment({
    targetType: "Settlement",
    targetId: "00000000-0000-4000-8000-000000000004",
    fileType: "RECEIPT",
    fileName: "주민등록번호-영수증.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    url: "https://example.com/receipt.pdf",
  }),
);

console.log("privacy-rules-ok");
