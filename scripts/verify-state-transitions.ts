import assert from "node:assert/strict";
import {
  AUDIT_ACTIONS,
  BASE_MOBILITY_STATUSES,
  CANCELLATION_STATUSES,
  EXCEPTION_STATUSES,
  MOBILITY_STATUSES,
  MOBILITY_STATUS_LABELS,
} from "../src/domain/definitions";
import { hasPermission, type AuthUser } from "../src/domain/auth/permissions";
import {
  canTransitionMobilityStatus,
  describeNextMobilityStatusActions,
  getNextMobilityStatusActions,
  isBaseMobilityStatus,
  isCancellationStatus,
  isExceptionStatus,
  MOBILITY_STATUS_TRANSITIONS,
  requiresStatusReason,
} from "../src/domain/status";
import { getTripNextActionLabel } from "../src/server/trips/trip-operation-service";

const statusSet = new Set(MOBILITY_STATUSES);
const baseSequence = BASE_MOBILITY_STATUSES;

for (const status of MOBILITY_STATUSES) {
  assert.ok(status in MOBILITY_STATUS_TRANSITIONS, `${status} transition row is missing`);
  assert.equal(typeof MOBILITY_STATUS_LABELS[status], "string", `${status} label is missing`);
  for (const nextStatus of MOBILITY_STATUS_TRANSITIONS[status]) {
    assert.ok(statusSet.has(nextStatus), `${status} has invalid transition target ${nextStatus}`);
  }
}

for (const [index, status] of baseSequence.entries()) {
  const nextBaseStatus = baseSequence[index + 1];
  if (nextBaseStatus) {
    assert.equal(
      canTransitionMobilityStatus(status, nextBaseStatus),
      true,
      `${status} should transition to ${nextBaseStatus}`,
    );
  }
  for (let targetIndex = 0; targetIndex < index; targetIndex += 1) {
    assert.equal(
      canTransitionMobilityStatus(status, baseSequence[targetIndex]),
      false,
      `${status} should not transition backward to ${baseSequence[targetIndex]}`,
    );
  }
  for (let targetIndex = index + 2; targetIndex < baseSequence.length; targetIndex += 1) {
    assert.equal(
      canTransitionMobilityStatus(status, baseSequence[targetIndex]),
      false,
      `${status} should not skip to ${baseSequence[targetIndex]}`,
    );
  }
}

assert.equal(canTransitionMobilityStatus("GROUP_READY", "LINKER_ASSIGNED"), false);
assert.equal(canTransitionMobilityStatus("GROUP_READY", "LINKER_RECRUITING"), true);
assert.equal(canTransitionMobilityStatus("LINKER_RECRUITING", "LINKER_ASSIGNED"), true);
assert.equal(canTransitionMobilityStatus("LINKER_ASSIGNED", "TAXI_CONFIRMED"), false);
assert.equal(canTransitionMobilityStatus("TAXI_REQUESTED", "TAXI_CONFIRMED"), true);
assert.equal(canTransitionMobilityStatus("TAXI_CONFIRMED", "IN_PROGRESS"), true);
assert.equal(canTransitionMobilityStatus("IN_PROGRESS", "RETURN_CONFIRMED"), true);

for (const status of CANCELLATION_STATUSES) {
  assert.equal(isCancellationStatus(status), true);
  assert.equal(requiresStatusReason(status), true);
  assert.deepEqual(MOBILITY_STATUS_TRANSITIONS[status], [], `${status} should be terminal`);
}

for (const status of EXCEPTION_STATUSES) {
  assert.equal(isExceptionStatus(status), true);
  assert.equal(requiresStatusReason(status), true);
}

for (const status of BASE_MOBILITY_STATUSES) {
  assert.equal(isBaseMobilityStatus(status), true);
  assert.equal(requiresStatusReason(status), false);
}

assert.equal(describeNextMobilityStatusActions("GROUP_READY"), "링커모집, 운영취소");
assert.deepEqual(getNextMobilityStatusActions("REPORTED"), []);
assert.equal(getTripNextActionLabel("LINKER_RECRUITING"), "동행링커 배정");
assert.equal(getTripNextActionLabel("LINKER_ASSIGNED"), "택시 예약요청");
assert.equal(getTripNextActionLabel("TAXI_REQUESTED"), "택시 예약확정");
assert.equal(getTripNextActionLabel("TAXI_CONFIRMED", ["linkerBoarded"]), "동행링커 탑승");
assert.equal(getTripNextActionLabel("IN_PROGRESS", ["returnStarted"]), "귀가 출발");
assert.equal(getTripNextActionLabel("RETURN_CONFIRMED"), "정산완료, 민원접수");

const viewer: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  role: "VIEWER",
  isActive: true,
};
const linker: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  role: "LINKER",
  isActive: true,
};
const taxiPartner: AuthUser = {
  id: "00000000-0000-4000-8000-000000000003",
  role: "TAXI_PARTNER",
  isActive: true,
};

assert.equal(hasPermission(viewer, "group:write"), false);
assert.equal(hasPermission(viewer, "trip:write"), false);
assert.equal(hasPermission(linker, "trip:write"), true);
assert.equal(hasPermission(linker, "group:write"), false);
assert.equal(hasPermission(taxiPartner, "taxi:write"), true);
assert.equal(hasPermission(taxiPartner, "trip:write"), false);
assert.equal(AUDIT_ACTIONS.includes("STATUS_CHANGE"), true);

console.log("state-transitions-ok");
