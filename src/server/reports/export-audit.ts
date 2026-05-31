import { type Prisma, type PrismaClient } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

type ExportClient = Pick<PrismaClient, "auditLog"> | Prisma.TransactionClient;

export async function recordCsvExportAudit(
  user: AuthUser,
  input: {
    targetType: string;
    targetId: string;
    reason: string;
    columns: string[];
  },
  client: ExportClient = prisma,
) {
  assertPermission(user, "csv:export");

  if (!input.reason.trim()) {
    throw new Error("CSV 내보내기 사유를 입력해야 합니다.");
  }
  assertNoForbiddenSensitiveInfo({ "CSV 내보내기 사유": input.reason });

  return writeAuditLog(client, {
    userId: user.id,
    action: "EXPORT_CSV",
    targetType: input.targetType,
    targetId: input.targetId,
    afterValue: {
      reason: input.reason,
      columns: input.columns,
    },
  });
}

export async function recordPdfExportAudit(
  user: AuthUser,
  input: {
    targetType: string;
    targetId: string;
    reason: string;
    sections: string[];
  },
  client: ExportClient = prisma,
) {
  assertPermission(user, "csv:export");

  if (!input.reason.trim()) {
    throw new Error("PDF 다운로드 사유를 입력해야 합니다.");
  }
  assertNoForbiddenSensitiveInfo({ "PDF 다운로드 사유": input.reason });

  return writeAuditLog(client, {
    userId: user.id,
    action: "PDF_EXPORT",
    targetType: input.targetType,
    targetId: input.targetId,
    afterValue: {
      reason: input.reason,
      sections: input.sections,
      privacy: "aggregate_only",
    },
  });
}
