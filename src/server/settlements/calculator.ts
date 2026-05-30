import {
  type RoundingPolicy,
  type SettlementMode,
} from "@/domain/definitions";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";

export type SettlementCalculationInput = {
  totalFare: number;
  residentCount?: number;
  settlementMode?: SettlementMode;
  roundingPolicy?: RoundingPolicy;
  communityFundSupportAmount?: number | null;
  customResidentTotalShare?: number;
  linkerActivityFee?: number | null;
};

export type SettlementCalculationResult = {
  settlementMode: SettlementMode;
  roundingPolicy: RoundingPolicy;
  totalFare: number;
  residentCount: number;
  residentTotalShare: number;
  residentPerPersonShare: number;
  anchorSupportAmount: number;
  communityFundSupportAmount: number | null;
  linkerActivityFee: number | null;
  roundingAdjustmentAmount: number;
};

function assertNonNegativeInteger(name: string, value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} 값은 0 이상의 정수여야 합니다.`);
  }
}

function assertPositiveInteger(name: string, value: number) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} 값은 1 이상의 정수여야 합니다.`);
  }
}

export function applyFareRounding(value: number, policy: RoundingPolicy) {
  switch (policy) {
    case "ROUND":
      return Math.round(value);
    case "FLOOR":
      return Math.floor(value);
    case "CEIL":
      return Math.ceil(value);
    case "MANUAL":
      return Math.trunc(value);
    default: {
      const exhaustive: never = policy;
      return exhaustive;
    }
  }
}

export function estimateDefaultResidentShare(
  totalFare = DEFAULT_OPERATING_SETTINGS.defaultFare,
  defaultResidentCount = DEFAULT_OPERATING_SETTINGS.defaultResidentCount,
  roundingPolicy = DEFAULT_OPERATING_SETTINGS.fareRoundingPolicy,
) {
  assertNonNegativeInteger("totalFare", totalFare);
  assertPositiveInteger("defaultResidentCount", defaultResidentCount);
  return applyFareRounding(totalFare / defaultResidentCount, roundingPolicy);
}

function getResidentTotalBeforeRounding(input: RequiredSettlementValues) {
  switch (input.settlementMode) {
    case "PILOT":
      return 0;
    case "SELF_RELIANCE":
      return input.totalFare;
    case "COMMUNITY_SUPPORT":
      return Math.max(0, input.totalFare - input.communityFundSupportAmount);
    case "CUSTOM":
      if (input.customResidentTotalShare === undefined) {
        throw new Error("CUSTOM 정산은 주민 총 분담금을 직접 입력해야 합니다.");
      }
      return input.customResidentTotalShare;
    default: {
      const exhaustive: never = input.settlementMode;
      return exhaustive;
    }
  }
}

type RequiredSettlementValues = {
  totalFare: number;
  residentCount: number;
  settlementMode: SettlementMode;
  roundingPolicy: RoundingPolicy;
  communityFundSupportAmount: number;
  customResidentTotalShare?: number;
};

export function calculateSettlement(
  input: SettlementCalculationInput,
): SettlementCalculationResult {
  const settlementMode = input.settlementMode ?? "PILOT";
  const roundingPolicy =
    input.roundingPolicy ?? DEFAULT_OPERATING_SETTINGS.fareRoundingPolicy;
  const residentCount =
    input.residentCount ?? DEFAULT_OPERATING_SETTINGS.defaultResidentCount;
  const communityFundSupportAmount = input.communityFundSupportAmount ?? 0;

  assertNonNegativeInteger("totalFare", input.totalFare);
  assertPositiveInteger("residentCount", residentCount);
  assertNonNegativeInteger("communityFundSupportAmount", communityFundSupportAmount);
  if (input.customResidentTotalShare !== undefined) {
    assertNonNegativeInteger("customResidentTotalShare", input.customResidentTotalShare);
  }
  if (input.linkerActivityFee !== undefined && input.linkerActivityFee !== null) {
    assertNonNegativeInteger("linkerActivityFee", input.linkerActivityFee);
  }

  const requiredValues: RequiredSettlementValues = {
    totalFare: input.totalFare,
    residentCount,
    settlementMode,
    roundingPolicy,
    communityFundSupportAmount,
    customResidentTotalShare: input.customResidentTotalShare,
  };
  const residentTotalBeforeRounding = getResidentTotalBeforeRounding(requiredValues);
  const residentPerPersonShare = applyFareRounding(
    residentTotalBeforeRounding / residentCount,
    roundingPolicy,
  );
  const residentTotalShare = Math.min(
    input.totalFare,
    residentPerPersonShare * residentCount,
  );
  const anchorSupportAmount = Math.max(0, input.totalFare - residentTotalShare);

  return {
    settlementMode,
    roundingPolicy,
    totalFare: input.totalFare,
    residentCount,
    residentTotalShare,
    residentPerPersonShare,
    anchorSupportAmount,
    communityFundSupportAmount: input.communityFundSupportAmount ?? null,
    linkerActivityFee: input.linkerActivityFee ?? null,
    roundingAdjustmentAmount: residentTotalBeforeRounding - residentTotalShare,
  };
}
