import { createHash, randomBytes } from "node:crypto";
import {
  type MobileFormToken,
  type MobileTokenScope,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/audit/audit-log";

type TokenClient = Pick<PrismaClient, "mobileFormToken" | "auditLog"> | Prisma.TransactionClient;

export const MOBILE_FORM_ALLOWED_FIELDS = {
  REQUEST_INTAKE: [
    "residentName",
    "villageName",
    "phone",
    "guardianPhone",
    "desiredDate",
    "desiredTimeWindow",
    "purpose",
    "origin",
    "destination",
    "needsCompanion",
    "privacyConsent",
    "thirdPartyConsent",
    "sensitiveInfoNotCollected",
  ],
  TRIP_CHECK: [
    "linkerBoardedAt",
    "resident1BoardedAt",
    "resident2BoardedAt",
    "resident3BoardedAt",
    "arrivedAtDestination",
    "serviceTaskConfirmed",
    "returnStartedAt",
    "notes",
  ],
  RETURN_CONFIRM: ["returnConfirmedAt", "allReturnsConfirmedAt", "notes"],
  SURVEY_SUBMIT: [
    "userSatisfaction",
    "linkerSatisfaction",
    "taxiSatisfaction",
    "costBurdenFeeling",
    "reuseIntent",
    "inconvenience",
    "improvementRequest",
    "hasIncident",
    "hasComplaint",
    "issueTypes",
  ],
  TAXI_CONFIRM: [
    "partnerManagerName",
    "reservationConfirmed",
    "confirmedAt",
    "vehicleNumber",
    "driverPhone",
    "expectedFare",
    "actualFare",
    "receiptUrl",
    "notes",
  ],
} satisfies Record<MobileTokenScope, readonly string[]>;

export type MobileTokenStatus =
  | { ok: true; token: MobileFormToken }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "used_up" };

export function createRawMobileToken() {
  return randomBytes(32).toString("base64url");
}

export function hashMobileToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function getDisallowedMobileFields(scope: MobileTokenScope, fields: Iterable<string>) {
  const allowed = new Set(MOBILE_FORM_ALLOWED_FIELDS[scope]);
  return [...fields].filter((field) => !allowed.has(field));
}

export function assertMobileFieldsAllowed(scope: MobileTokenScope, fields: Iterable<string>) {
  const disallowed = getDisallowedMobileFields(scope, fields);
  if (disallowed.length > 0) {
    throw new Error(`허용되지 않은 입력 항목입니다: ${disallowed.join(", ")}`);
  }
}

export async function createMobileFormToken(input: {
  createdByUserId: string;
  scope: MobileTokenScope;
  targetType: string;
  targetId: string;
  expiresAt: Date;
  maxUseCount?: number;
}) {
  const rawToken = createRawMobileToken();
  const tokenHash = hashMobileToken(rawToken);

  const token = await prisma.$transaction(async (tx) => {
    const created = await tx.mobileFormToken.create({
      data: {
        tokenHash,
        scope: input.scope,
        targetType: input.targetType,
        targetId: input.targetId,
        expiresAt: input.expiresAt,
        maxUseCount: input.maxUseCount ?? 1,
        createdByUserId: input.createdByUserId,
      },
    });

    await writeAuditLog(tx, {
      userId: input.createdByUserId,
      action: "TOKEN_CREATE",
      targetType: "MobileFormToken",
      targetId: created.id,
      afterValue: {
        scope: created.scope,
        targetType: created.targetType,
        targetId: created.targetId,
        expiresAt: created.expiresAt,
        maxUseCount: created.maxUseCount,
      },
    });

    return created;
  });

  return { rawToken, token };
}

export async function validateMobileFormToken(
  rawToken: string,
  expectedScope?: MobileTokenScope,
  client: TokenClient = prisma,
): Promise<MobileTokenStatus> {
  const tokenHash = hashMobileToken(rawToken);
  const token = await client.mobileFormToken.findUnique({
    where: { tokenHash },
  });

  if (!token || (expectedScope && token.scope !== expectedScope)) {
    return { ok: false, reason: "not_found" };
  }
  if (token.revokedAt) {
    return { ok: false, reason: "revoked" };
  }
  if (token.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (token.usedCount >= token.maxUseCount) {
    return { ok: false, reason: "used_up" };
  }

  return { ok: true, token };
}

export async function consumeMobileFormToken(input: {
  rawToken: string;
  submittedFields: string[];
  submittedByUserId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const status = await validateMobileFormToken(input.rawToken, undefined, tx);
    if (!status.ok) {
      throw new Error("사용할 수 없는 모바일 입력 링크입니다.");
    }

    assertMobileFieldsAllowed(status.token.scope, input.submittedFields);

    const updated = await tx.mobileFormToken.update({
      where: { id: status.token.id },
      data: { usedCount: { increment: 1 } },
    });

    await writeAuditLog(tx, {
      userId: input.submittedByUserId ?? status.token.createdByUserId,
      action: "TOKEN_SUBMIT",
      targetType: status.token.targetType,
      targetId: status.token.targetId,
      afterValue: {
        scope: status.token.scope,
        submittedFields: input.submittedFields,
        usedCount: updated.usedCount,
      },
    });

    return updated;
  });
}

export async function revokeMobileFormToken(input: {
  tokenId: string;
  revokedByUserId: string;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const token = await tx.mobileFormToken.update({
      where: { id: input.tokenId },
      data: { revokedAt: new Date() },
    });

    await writeAuditLog(tx, {
      userId: input.revokedByUserId,
      action: "TOKEN_REVOKE",
      targetType: "MobileFormToken",
      targetId: token.id,
      afterValue: { revokedAt: token.revokedAt, scope: token.scope },
      note: input.note,
    });

    return token;
  });
}

export async function getMobileTokenView(rawToken: string) {
  try {
    const status = await validateMobileFormToken(rawToken);
    if (!status.ok) {
      return status;
    }
    return {
      ok: true as const,
      scope: status.token.scope,
      targetType: status.token.targetType,
      expiresAt: status.token.expiresAt,
      remainingUses: status.token.maxUseCount - status.token.usedCount,
      allowedFields: MOBILE_FORM_ALLOWED_FIELDS[status.token.scope],
    };
  } catch {
    return { ok: false as const, reason: "not_found" as const };
  }
}
