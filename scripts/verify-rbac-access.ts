import assert from "node:assert/strict";
import {
  ACTION_ACCESS_RULES,
  ADMIN_ROUTE_ACCESS_RULES,
  canAccessAdminRoute,
  canUseProtectedAction,
  type AdminRouteId,
  type ProtectedActionId,
} from "@/domain/auth/rbac-policy";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  type AuthUser,
  type Permission,
} from "@/domain/auth/permissions";
import { USER_ROLES, type UserRole } from "@/domain/definitions";
import {
  MOBILE_FORM_ALLOWED_FIELDS,
  getDisallowedMobileFields,
} from "@/server/mobile-forms/token-service";

function user(role: UserRole, isActive = true): AuthUser {
  return {
    id: `00000000-0000-4000-8000-${String(USER_ROLES.indexOf(role) + 1).padStart(12, "0")}`,
    role,
    isActive,
  };
}

function assertPermissionMatrix(role: UserRole, allowed: readonly Permission[]) {
  const actor = user(role);
  for (const permission of PERMISSIONS) {
    assert.equal(
      hasPermission(actor, permission),
      allowed.includes(permission),
      `${role} permission mismatch: ${permission}`,
    );
  }
}

function assertRoute(role: UserRole, routeId: AdminRouteId, expected: boolean) {
  assert.equal(canAccessAdminRoute(user(role), routeId), expected, `${role} route ${routeId}`);
}

function assertAction(
  role: UserRole,
  actionId: ProtectedActionId,
  expected: boolean,
  context?: Parameters<typeof canUseProtectedAction>[2],
) {
  assert.equal(
    canUseProtectedAction(user(role), actionId, context),
    expected,
    `${role} action ${actionId}`,
  );
}

for (const role of USER_ROLES) {
  assertPermissionMatrix(role, ROLE_PERMISSIONS[role]);
}

for (const permission of PERMISSIONS) {
  assert.equal(hasPermission(user("SUPER_ADMIN", false), permission), false);
}

assert.deepEqual(
  ADMIN_ROUTE_ACCESS_RULES.map((rule) => rule.id),
  [
    "dashboard",
    "requests",
    "groups",
    "calendar",
    "trips",
    "settlements",
    "reports",
  ],
);
assert.deepEqual(
  ACTION_ACCESS_RULES.map((rule) => rule.id),
  [
    "createResidentRequest",
    "createMobilityGroup",
    "transitionGroupStatus",
    "assignLinkerToGroup",
    "createLinker",
    "updateLinkerStatus",
    "requestTaxiReservation",
    "confirmTaxiReservation",
    "updateTripStatus",
    "confirmReturn",
    "saveSettlement",
    "updateLockedSettlement",
    "prepareSettlementCsv",
    "exportMonthlyCsv",
    "exportMonthlyPdf",
    "createJobConsultation",
    "createMouRecord",
    "createUser",
    "updateUserRole",
    "deactivateUser",
    "createMobileFormToken",
    "uploadReceipt",
  ],
);

assertRoute("SUPER_ADMIN", "dashboard", true);
assertRoute("ANCHOR_ADMIN", "dashboard", true);
assertRoute("COUNCIL_OPERATOR", "requests", true);
assertRoute("COUNCIL_OPERATOR", "settlements", true);
assertRoute("LINKER", "requests", false);
assertRoute("LINKER", "groups", true);
assertRoute("LINKER", "calendar", true);
assertRoute("LINKER", "trips", true);
assertRoute("LINKER", "reports", false);
assertRoute("TAXI_PARTNER", "dashboard", false);
assertRoute("TAXI_PARTNER", "trips", true);
assertRoute("TAXI_PARTNER", "settlements", false);
assertRoute("VIEWER", "dashboard", true);
assertRoute("VIEWER", "requests", true);
assertRoute("VIEWER", "settlements", true);
assertRoute("VIEWER", "reports", true);

assertAction("SUPER_ADMIN", "createResidentRequest", true);
assertAction("ANCHOR_ADMIN", "createResidentRequest", true);
assertAction("COUNCIL_OPERATOR", "createResidentRequest", true);
assertAction("VIEWER", "createResidentRequest", false);
assertAction("LINKER", "createResidentRequest", false);

assertAction("ANCHOR_ADMIN", "createLinker", true);
assertAction("COUNCIL_OPERATOR", "createLinker", false);
assertAction("COUNCIL_OPERATOR", "assignLinkerToGroup", true);

assertAction("COUNCIL_OPERATOR", "requestTaxiReservation", true);
assertAction("TAXI_PARTNER", "requestTaxiReservation", false);
assertAction("TAXI_PARTNER", "confirmTaxiReservation", true);
assertAction("VIEWER", "confirmTaxiReservation", false);

assertAction("LINKER", "updateTripStatus", false);
assertAction("LINKER", "updateTripStatus", true, { assignedLinker: true });
assertAction("LINKER", "confirmReturn", false);
assertAction("LINKER", "confirmReturn", true, { assignedLinker: true });
assertAction("TAXI_PARTNER", "updateTripStatus", false);

assertAction("SUPER_ADMIN", "saveSettlement", true);
assertAction("ANCHOR_ADMIN", "saveSettlement", true);
assertAction("COUNCIL_OPERATOR", "saveSettlement", false);
assertAction("SUPER_ADMIN", "updateLockedSettlement", true);
assertAction("ANCHOR_ADMIN", "updateLockedSettlement", false);
assertAction("VIEWER", "updateLockedSettlement", false);

assertAction("SUPER_ADMIN", "prepareSettlementCsv", true);
assertAction("ANCHOR_ADMIN", "prepareSettlementCsv", true);
assertAction("VIEWER", "prepareSettlementCsv", false);
assertAction("SUPER_ADMIN", "exportMonthlyCsv", true);
assertAction("ANCHOR_ADMIN", "exportMonthlyCsv", true);
assertAction("COUNCIL_OPERATOR", "exportMonthlyCsv", false);
assertAction("VIEWER", "exportMonthlyCsv", false);
assertAction("SUPER_ADMIN", "exportMonthlyPdf", true);
assertAction("ANCHOR_ADMIN", "exportMonthlyPdf", true);
assertAction("COUNCIL_OPERATOR", "exportMonthlyPdf", false);
assertAction("VIEWER", "exportMonthlyPdf", false);
assertAction("SUPER_ADMIN", "createJobConsultation", true);
assertAction("ANCHOR_ADMIN", "createJobConsultation", true);
assertAction("COUNCIL_OPERATOR", "createJobConsultation", true);
assertAction("LINKER", "createJobConsultation", false);
assertAction("VIEWER", "createJobConsultation", false);
assertAction("SUPER_ADMIN", "createMouRecord", true);
assertAction("ANCHOR_ADMIN", "createMouRecord", true);
assertAction("COUNCIL_OPERATOR", "createMouRecord", false);
assertAction("VIEWER", "createMouRecord", false);
assertAction("SUPER_ADMIN", "createUser", true);
assertAction("ANCHOR_ADMIN", "createUser", true);
assertAction("COUNCIL_OPERATOR", "createUser", false);
assertAction("VIEWER", "createUser", false);
assertAction("SUPER_ADMIN", "updateUserRole", true);
assertAction("ANCHOR_ADMIN", "updateUserRole", true);
assertAction("COUNCIL_OPERATOR", "updateUserRole", false);
assertAction("SUPER_ADMIN", "deactivateUser", true);
assertAction("ANCHOR_ADMIN", "deactivateUser", true);
assertAction("VIEWER", "deactivateUser", false);

assertAction("SUPER_ADMIN", "createMobileFormToken", true);
assertAction("ANCHOR_ADMIN", "createMobileFormToken", true);
assertAction("COUNCIL_OPERATOR", "createMobileFormToken", false);

assertAction("TAXI_PARTNER", "uploadReceipt", true);
assertAction("LINKER", "uploadReceipt", false);

assert.deepEqual(MOBILE_FORM_ALLOWED_FIELDS.TAXI_CONFIRM, [
  "partnerManagerName",
  "reservationConfirmed",
  "confirmedAt",
  "vehicleNumber",
  "driverPhone",
  "expectedFare",
  "actualFare",
  "receiptUrl",
  "notes",
]);
assert.deepEqual(getDisallowedMobileFields("TAXI_CONFIRM", ["vehicleNumber", "residentName"]), [
  "residentName",
]);
assert.deepEqual(getDisallowedMobileFields("TRIP_CHECK", ["linkerBoardedAt", "allReturnsConfirmedAt"]), [
  "allReturnsConfirmedAt",
]);

console.log("rbac-access-ok");
