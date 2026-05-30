import { type AuditAction, type Prisma, type PrismaClient } from "@prisma/client";
import { redactSensitiveValue } from "@/domain/privacy";

type AuditClient = Pick<PrismaClient, "auditLog"> | Prisma.TransactionClient;

export type WriteAuditLogInput = {
  userId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  accessContext?: string;
  note?: string;
};

export async function writeAuditLog(client: AuditClient, input: WriteAuditLogInput) {
  return client.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      beforeValue: input.beforeValue
        ? (redactSensitiveValue(input.beforeValue) as Prisma.InputJsonValue)
        : undefined,
      afterValue: input.afterValue
        ? (redactSensitiveValue(input.afterValue) as Prisma.InputJsonValue)
        : undefined,
      accessContext: input.accessContext,
      note: input.note,
    },
  });
}
