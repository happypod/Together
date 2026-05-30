import { Prisma, type PrismaClient } from "@prisma/client";
import { assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { ROUNDING_POLICIES, type RoundingPolicy } from "@/domain/definitions";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import {
  DEFAULT_OPERATING_SETTINGS,
  OPERATING_SETTING_KEYS,
  REPORT_DATE_BASES,
  SETTING_DESCRIPTIONS,
  type OperatingSettingKey,
  type OperatingSettings,
  type ReportDateBasis,
} from "@/server/settings/defaults";

type SettingReadClient = Pick<PrismaClient, "appSetting"> | Prisma.TransactionClient;
type SettingWriteClient =
  | Pick<PrismaClient, "appSetting" | "auditLog">
  | Prisma.TransactionClient;

const APP_SETTING_AUDIT_TARGET_ID = "00000000-0000-4000-8000-000000000101";

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function parsePositiveInteger(key: OperatingSettingKey, value: unknown) {
  if (!isPositiveInteger(value)) {
    throw new Error(`${key} 설정값은 1 이상의 정수여야 합니다.`);
  }
  return value;
}

function parseStringArray(key: OperatingSettingKey, value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "string" || !entry.trim())
  ) {
    throw new Error(`${key} 설정값은 비어 있지 않은 문자열 배열이어야 합니다.`);
  }
  return value.map((entry) => entry.trim());
}

function parseRoundingPolicy(value: unknown): RoundingPolicy {
  if (typeof value !== "string" || !ROUNDING_POLICIES.includes(value as RoundingPolicy)) {
    throw new Error("fareRoundingPolicy 설정값이 올바르지 않습니다.");
  }
  return value as RoundingPolicy;
}

function parseReportDateBasis(value: unknown): ReportDateBasis {
  if (typeof value !== "string" || !REPORT_DATE_BASES.includes(value as ReportDateBasis)) {
    throw new Error("reportDateBasis 설정값은 serviceDate 또는 returnConfirmedAt 이어야 합니다.");
  }
  return value as ReportDateBasis;
}

export function normalizeSettingValue<K extends OperatingSettingKey>(
  key: K,
  value: unknown,
): OperatingSettings[K] {
  switch (key) {
    case "defaultFare":
    case "defaultResidentCount":
    case "maxGroupResidents":
    case "mobileTokenTtlHours":
      return parsePositiveInteger(key, value) as OperatingSettings[K];
    case "fareRoundingPolicy":
      return parseRoundingPolicy(value) as OperatingSettings[K];
    case "reportDateBasis":
      return parseReportDateBasis(value) as OperatingSettings[K];
    case "villages":
    case "timeWindows":
      return parseStringArray(key, value) as OperatingSettings[K];
    default: {
      const exhaustive: never = key;
      return exhaustive;
    }
  }
}

export async function getOperatingSettings(
  client: SettingReadClient = prisma,
): Promise<OperatingSettings> {
  const rows = await client.appSetting.findMany({
    where: {
      key: {
        in: [...OPERATING_SETTING_KEYS],
      },
    },
  });

  const settings: OperatingSettings = { ...DEFAULT_OPERATING_SETTINGS };
  for (const row of rows) {
    const key = row.key as OperatingSettingKey;
    if (OPERATING_SETTING_KEYS.includes(key)) {
      settings[key] = normalizeSettingValue(key, row.value) as never;
    }
  }

  return settings;
}

export async function updateAppSetting<K extends OperatingSettingKey>(
  user: AuthUser,
  key: K,
  value: OperatingSettings[K],
  client: SettingWriteClient = prisma,
) {
  assertPermission(user, "setting:manage");

  const normalizedValue = normalizeSettingValue(key, value);
  const previous = await client.appSetting.findUnique({ where: { key } });

  const setting = await client.appSetting.upsert({
    where: { key },
    update: {
      value: normalizedValue as Prisma.InputJsonValue,
      description: SETTING_DESCRIPTIONS[key],
      updatedByUserId: user.id,
    },
    create: {
      key,
      value: normalizedValue as Prisma.InputJsonValue,
      description: SETTING_DESCRIPTIONS[key],
      updatedByUserId: user.id,
    },
  });

  await writeAuditLog(client, {
    userId: user.id,
    action: "UPDATE",
    targetType: "AppSetting",
    targetId: APP_SETTING_AUDIT_TARGET_ID,
    beforeValue: previous ? { key, value: previous.value } : undefined,
    afterValue: { key, value: normalizedValue },
    note: `${key} 운영 설정 변경`,
  });

  return setting;
}
