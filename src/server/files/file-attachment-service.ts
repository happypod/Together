import { type FileType, type Prisma, type PrismaClient } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/audit/audit-log";

type FileClient = Pick<PrismaClient, "fileAttachment" | "auditLog"> | Prisma.TransactionClient;

export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type FileAttachmentInput = {
  targetType: string;
  targetId: string;
  fileType: FileType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

function getMaxFileSizeBytes() {
  const mb = Number(process.env.RECEIPT_MAX_FILE_MB ?? "10");
  return Math.max(1, mb) * 1024 * 1024;
}

export function validateFileAttachment(input: FileAttachmentInput) {
  if (!ALLOWED_FILE_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_FILE_MIME_TYPES)[number])) {
    throw new Error("PDF 또는 이미지 파일만 등록할 수 있습니다.");
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > getMaxFileSizeBytes()) {
    throw new Error(`파일 크기는 ${process.env.RECEIPT_MAX_FILE_MB ?? "10"}MB 이하만 가능합니다.`);
  }

  const url = new URL(input.url);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("영수증 링크는 http 또는 https 주소여야 합니다.");
  }
}

export async function createFileAttachment(
  user: AuthUser,
  input: FileAttachmentInput,
  client: FileClient = prisma,
) {
  assertPermission(user, "file:write");
  validateFileAttachment(input);

  const file = await client.fileAttachment.create({
    data: {
      ...input,
      uploadedByUserId: user.id,
    },
  });

  await writeAuditLog(client, {
    userId: user.id,
    action: "UPLOAD_FILE",
    targetType: input.targetType,
    targetId: input.targetId,
    afterValue: {
      fileType: input.fileType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      url: input.url,
    },
  });

  return file;
}
