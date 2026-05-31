import assert from "node:assert/strict";
import { AUDIT_ACTIONS } from "@/domain/definitions";
import { hasPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  calculateSettlement,
  estimateDefaultResidentShare,
  type SettlementCalculationResult,
} from "@/server/settlements/calculator";
import { calculateMonthlyReportSnapshot } from "@/server/reports/report-calculator";

function assertCoverage(result: SettlementCalculationResult) {
  const communityFundSupportAmount = result.communityFundSupportAmount ?? 0;
  assert.equal(
    result.residentTotalShare + result.anchorSupportAmount + communityFundSupportAmount,
    result.totalFare,
    `${result.settlementMode} coverage should match total fare`,
  );
}

function assertThrowsMessage(fn: () => unknown, pattern: RegExp) {
  assert.throws(fn, (error) => error instanceof Error && pattern.test(error.message));
}

const pilot = calculateSettlement({
  totalFare: 72_000,
  residentCount: 3,
  settlementMode: "PILOT",
  roundingPolicy: "FLOOR",
});
assert.equal(pilot.residentPerPersonShare, 0);
assert.equal(pilot.residentTotalShare, 0);
assert.equal(pilot.anchorSupportAmount, 72_000);
assertCoverage(pilot);

const oneResident = calculateSettlement({
  totalFare: 72_000,
  residentCount: 1,
  settlementMode: "SELF_RELIANCE",
  roundingPolicy: "FLOOR",
});
assert.equal(oneResident.residentPerPersonShare, 72_000);
assert.equal(oneResident.anchorSupportAmount, 0);
assertCoverage(oneResident);

const twoResidents = calculateSettlement({
  totalFare: 72_000,
  residentCount: 2,
  settlementMode: "SELF_RELIANCE",
  roundingPolicy: "FLOOR",
});
assert.equal(twoResidents.residentPerPersonShare, 36_000);
assert.equal(twoResidents.anchorSupportAmount, 0);
assertCoverage(twoResidents);

const threeResidents = calculateSettlement({
  totalFare: 72_000,
  residentCount: 3,
  settlementMode: "SELF_RELIANCE",
  roundingPolicy: "FLOOR",
});
assert.equal(threeResidents.residentPerPersonShare, 24_000);
assert.equal(threeResidents.anchorSupportAmount, 0);
assert.equal(estimateDefaultResidentShare(), 24_000);
assertCoverage(threeResidents);

const floorRemainder = calculateSettlement({
  totalFare: 10_000,
  residentCount: 3,
  settlementMode: "SELF_RELIANCE",
  roundingPolicy: "FLOOR",
});
assert.equal(floorRemainder.residentPerPersonShare, 3_333);
assert.equal(floorRemainder.residentTotalShare, 9_999);
assert.equal(floorRemainder.anchorSupportAmount, 1);
assert.equal(floorRemainder.roundingAdjustmentAmount, 1);
assertCoverage(floorRemainder);

const communitySupport = calculateSettlement({
  totalFare: 72_000,
  residentCount: 3,
  settlementMode: "COMMUNITY_SUPPORT",
  roundingPolicy: "FLOOR",
  communityFundSupportAmount: 30_000,
});
assert.equal(communitySupport.communityFundSupportAmount, 30_000);
assert.equal(communitySupport.residentPerPersonShare, 14_000);
assert.equal(communitySupport.residentTotalShare, 42_000);
assert.equal(communitySupport.anchorSupportAmount, 0);
assertCoverage(communitySupport);

const communityRemainder = calculateSettlement({
  totalFare: 72_000,
  residentCount: 3,
  settlementMode: "COMMUNITY_SUPPORT",
  roundingPolicy: "FLOOR",
  communityFundSupportAmount: 30_001,
});
assert.equal(communityRemainder.residentPerPersonShare, 13_999);
assert.equal(communityRemainder.residentTotalShare, 41_997);
assert.equal(communityRemainder.anchorSupportAmount, 2);
assert.equal(communityRemainder.roundingAdjustmentAmount, 2);
assertCoverage(communityRemainder);

const custom = calculateSettlement({
  totalFare: 72_000,
  residentCount: 3,
  settlementMode: "CUSTOM",
  roundingPolicy: "FLOOR",
  customResidentTotalShare: 45_000,
  communityFundSupportAmount: 10_000,
});
assert.equal(custom.residentPerPersonShare, 15_000);
assert.equal(custom.residentTotalShare, 45_000);
assert.equal(custom.communityFundSupportAmount, 10_000);
assert.equal(custom.anchorSupportAmount, 17_000);
assertCoverage(custom);

const zeroFare = calculateSettlement({
  totalFare: 0,
  residentCount: 3,
  settlementMode: "SELF_RELIANCE",
  roundingPolicy: "FLOOR",
});
assert.equal(zeroFare.residentPerPersonShare, 0);
assert.equal(zeroFare.anchorSupportAmount, 0);
assertCoverage(zeroFare);

assertThrowsMessage(
  () => calculateSettlement({ totalFare: -1, residentCount: 3 }),
  /0 이상의 정수/,
);
assertThrowsMessage(
  () => calculateSettlement({ totalFare: 10_000, residentCount: 0 }),
  /1 이상의 정수/,
);
assertThrowsMessage(
  () =>
    calculateSettlement({
      totalFare: 10_000,
      residentCount: 3,
      settlementMode: "COMMUNITY_SUPPORT",
      communityFundSupportAmount: 10_001,
    }),
  /총 택시요금/,
);
assertThrowsMessage(
  () => calculateSettlement({ totalFare: 10_000, residentCount: 3, settlementMode: "CUSTOM" }),
  /주민 총 분담금/,
);
assertThrowsMessage(
  () =>
    calculateSettlement({
      totalFare: 10_000,
      residentCount: 3,
      settlementMode: "CUSTOM",
      customResidentTotalShare: 8_000,
      communityFundSupportAmount: 3_000,
    }),
  /합은 총 택시요금/,
);

const report = calculateMonthlyReportSnapshot({
  month: "2026-06",
  groups: [
    {
      id: "group-1",
      serviceDate: "2026-06-03",
      status: "SETTLED",
      linkerId: "linker-1",
      members: [
        { residentId: "resident-1", memberStatus: "ACTIVE" },
        { residentId: "resident-2", memberStatus: "ACTIVE" },
        { residentId: "resident-3", memberStatus: "ACTIVE" },
      ],
    },
  ],
  settlements: [
    {
      groupId: "group-1",
      totalFare: communitySupport.totalFare,
      residentTotalShare: communitySupport.residentTotalShare,
      residentPerPersonShare: communitySupport.residentPerPersonShare,
      anchorSupportAmount: communitySupport.anchorSupportAmount,
      isSettled: true,
    },
  ],
  communityFunds: [{ month: "2026-06", amount: 30_000, fundType: "CONTRIBUTION" }],
});
assert.equal(report.averageFare, 72_000);
assert.equal(report.averageResidentShare, 14_000);
assert.equal(report.totalAnchorSupport, 0);
assert.equal(report.communityFundAmount, 30_000);

const active = true;
const users = {
  superAdmin: { id: "00000000-0000-4000-8000-000000000001", role: "SUPER_ADMIN", isActive: active },
  anchorAdmin: { id: "00000000-0000-4000-8000-000000000002", role: "ANCHOR_ADMIN", isActive: active },
  councilOperator: {
    id: "00000000-0000-4000-8000-000000000003",
    role: "COUNCIL_OPERATOR",
    isActive: active,
  },
  viewer: { id: "00000000-0000-4000-8000-000000000004", role: "VIEWER", isActive: active },
} satisfies Record<string, AuthUser>;
assert.equal(hasPermission(users.superAdmin, "settlement:write"), true);
assert.equal(hasPermission(users.superAdmin, "settlement:unlock"), true);
assert.equal(hasPermission(users.anchorAdmin, "settlement:write"), true);
assert.equal(hasPermission(users.anchorAdmin, "settlement:unlock"), false);
assert.equal(hasPermission(users.councilOperator, "settlement:write"), false);
assert.equal(hasPermission(users.viewer, "settlement:read"), true);
assert.equal(hasPermission(users.viewer, "settlement:write"), false);
assert.equal(AUDIT_ACTIONS.includes("SETTLEMENT_LOCK"), true);
assert.equal(AUDIT_ACTIONS.includes("SETTLEMENT_UNLOCK"), true);

console.log("settlement-formulas-ok");
