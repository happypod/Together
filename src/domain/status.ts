import {
  BASE_MOBILITY_STATUSES,
  CANCELLATION_STATUSES,
  EXCEPTION_STATUSES,
  MOBILITY_STATUS_LABELS,
  type MobilityStatus,
} from "@/domain/definitions";

const baseStatusSet = new Set<MobilityStatus>(BASE_MOBILITY_STATUSES);
const cancellationStatusSet = new Set<MobilityStatus>(CANCELLATION_STATUSES);
const exceptionStatusSet = new Set<MobilityStatus>(EXCEPTION_STATUSES);

export const MOBILITY_STATUS_TRANSITIONS: Record<MobilityStatus, MobilityStatus[]> = {
  REQUESTED: ["RECRUITING", "CANCELED_BY_RESIDENT", "CANCELED_BY_OPERATOR"],
  RECRUITING: ["GROUP_READY", "CANCELED_BY_OPERATOR", "NO_SHOW"],
  GROUP_READY: ["LINKER_RECRUITING", "CANCELED_BY_OPERATOR"],
  LINKER_RECRUITING: ["LINKER_ASSIGNED", "CANCELED_BY_OPERATOR"],
  LINKER_ASSIGNED: ["TAXI_REQUESTED", "CANCELED_BY_OPERATOR"],
  TAXI_REQUESTED: ["TAXI_CONFIRMED", "CANCELED_BY_TAXI", "CANCELED_BY_WEATHER"],
  TAXI_CONFIRMED: ["IN_PROGRESS", "CANCELED_BY_TAXI", "NO_SHOW"],
  IN_PROGRESS: ["RETURN_CONFIRMED", "INCIDENT_REPORTED", "PARTIAL_COMPLETED"],
  RETURN_CONFIRMED: ["SETTLED", "COMPLAINT_REPORTED"],
  SETTLED: ["REPORTED"],
  REPORTED: [],
  CANCELED_BY_RESIDENT: [],
  CANCELED_BY_OPERATOR: [],
  CANCELED_BY_TAXI: [],
  CANCELED_BY_WEATHER: [],
  CANCELED_BY_OTHER: [],
  INCIDENT_REPORTED: ["PARTIAL_COMPLETED", "RETURN_CONFIRMED", "SETTLED"],
  COMPLAINT_REPORTED: ["SETTLED", "REPORTED"],
  NO_SHOW: [],
  PARTIAL_COMPLETED: ["RETURN_CONFIRMED", "SETTLED"],
};

export function isBaseMobilityStatus(status: MobilityStatus) {
  return baseStatusSet.has(status);
}

export function isCancellationStatus(status: MobilityStatus) {
  return cancellationStatusSet.has(status);
}

export function isExceptionStatus(status: MobilityStatus) {
  return exceptionStatusSet.has(status);
}

export function requiresStatusReason(status: MobilityStatus) {
  return isCancellationStatus(status) || isExceptionStatus(status);
}

export function canTransitionMobilityStatus(from: MobilityStatus, to: MobilityStatus) {
  return MOBILITY_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextMobilityStatusActions(status: MobilityStatus) {
  return MOBILITY_STATUS_TRANSITIONS[status].map((nextStatus) => ({
    value: nextStatus,
    label: MOBILITY_STATUS_LABELS[nextStatus],
  }));
}

export function describeNextMobilityStatusActions(status: MobilityStatus) {
  const actions = getNextMobilityStatusActions(status);
  return actions.length > 0 ? actions.map((action) => action.label).join(", ") : "최종 상태";
}
