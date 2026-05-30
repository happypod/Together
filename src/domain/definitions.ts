export const USER_ROLES = [
  "SUPER_ADMIN",
  "ANCHOR_ADMIN",
  "COUNCIL_OPERATOR",
  "LINKER",
  "TAXI_PARTNER",
  "VIEWER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MOBILITY_PURPOSES = [
  "HOSPITAL",
  "PHARMACY",
  "MARKET",
  "PUBLIC_OFFICE",
  "FINANCE",
  "POST_OFFICE",
  "OTHER",
] as const;

export type MobilityPurpose = (typeof MOBILITY_PURPOSES)[number];

export const BASE_MOBILITY_STATUSES = [
  "REQUESTED",
  "RECRUITING",
  "GROUP_READY",
  "LINKER_RECRUITING",
  "LINKER_ASSIGNED",
  "TAXI_REQUESTED",
  "TAXI_CONFIRMED",
  "IN_PROGRESS",
  "RETURN_CONFIRMED",
  "SETTLED",
  "REPORTED",
] as const;

export const CANCELLATION_STATUSES = [
  "CANCELED_BY_RESIDENT",
  "CANCELED_BY_OPERATOR",
  "CANCELED_BY_TAXI",
  "CANCELED_BY_WEATHER",
  "CANCELED_BY_OTHER",
] as const;

export const EXCEPTION_STATUSES = [
  "INCIDENT_REPORTED",
  "COMPLAINT_REPORTED",
  "NO_SHOW",
  "PARTIAL_COMPLETED",
] as const;

export const MOBILITY_STATUSES = [
  ...BASE_MOBILITY_STATUSES,
  ...CANCELLATION_STATUSES,
  ...EXCEPTION_STATUSES,
] as const;

export type MobilityStatus = (typeof MOBILITY_STATUSES)[number];

export const LINKER_STATUSES = [
  "CANDIDATE",
  "IN_TRAINING",
  "TRAINING_COMPLETED",
  "FIELD_PRACTICE_COMPLETED",
  "AVAILABLE",
  "ACTIVE",
  "PAUSED",
  "ENDED",
] as const;

export type LinkerStatus = (typeof LINKER_STATUSES)[number];

export const SETTLEMENT_MODES = [
  "PILOT",
  "SELF_RELIANCE",
  "COMMUNITY_SUPPORT",
  "CUSTOM",
] as const;

export type SettlementMode = (typeof SETTLEMENT_MODES)[number];

export const ROUNDING_POLICIES = ["ROUND", "FLOOR", "CEIL", "MANUAL"] as const;

export type RoundingPolicy = (typeof ROUNDING_POLICIES)[number];

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "SOFT_DELETE",
  "STATUS_CHANGE",
  "ASSIGN",
  "UNASSIGN",
  "EXPORT_CSV",
  "UPLOAD_FILE",
  "LOGIN",
  "LOGOUT",
  "TOKEN_CREATE",
  "TOKEN_SUBMIT",
  "TOKEN_REVOKE",
  "SETTLEMENT_LOCK",
  "SETTLEMENT_UNLOCK",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const MOBILE_TOKEN_SCOPES = [
  "REQUEST_INTAKE",
  "TRIP_CHECK",
  "RETURN_CONFIRM",
  "SURVEY_SUBMIT",
  "TAXI_CONFIRM",
] as const;

export type MobileTokenScope = (typeof MOBILE_TOKEN_SCOPES)[number];

export const CONTACT_TYPES = [
  "RESIDENT_CALL",
  "GUARDIAN_CALL",
  "LINKER_CALL",
  "TAXI_PARTNER_CALL",
  "ON_SITE",
  "SMS_MANUAL",
  "OTHER",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const MOBILITY_PURPOSE_LABELS: Record<MobilityPurpose, string> = {
  HOSPITAL: "병원",
  PHARMACY: "약국",
  MARKET: "장보기",
  PUBLIC_OFFICE: "공공기관",
  FINANCE: "금융기관",
  POST_OFFICE: "우체국",
  OTHER: "기타 생활이동",
};

export const MOBILITY_STATUS_LABELS: Record<MobilityStatus, string> = {
  REQUESTED: "신청접수",
  RECRUITING: "모집중",
  GROUP_READY: "그룹확정",
  LINKER_RECRUITING: "링커모집",
  LINKER_ASSIGNED: "링커확정",
  TAXI_REQUESTED: "택시요청",
  TAXI_CONFIRMED: "택시확정",
  IN_PROGRESS: "운행중",
  RETURN_CONFIRMED: "귀가확인",
  SETTLED: "정산완료",
  REPORTED: "보고완료",
  CANCELED_BY_RESIDENT: "주민취소",
  CANCELED_BY_OPERATOR: "운영취소",
  CANCELED_BY_TAXI: "택시취소",
  CANCELED_BY_WEATHER: "기상취소",
  CANCELED_BY_OTHER: "기타취소",
  INCIDENT_REPORTED: "사고접수",
  COMPLAINT_REPORTED: "민원접수",
  NO_SHOW: "미탑승",
  PARTIAL_COMPLETED: "부분완료",
};

export const LINKER_STATUS_LABELS: Record<LinkerStatus, string> = {
  CANDIDATE: "후보",
  IN_TRAINING: "교육중",
  TRAINING_COMPLETED: "교육이수",
  FIELD_PRACTICE_COMPLETED: "실습이수",
  AVAILABLE: "활동가능",
  ACTIVE: "활동중",
  PAUSED: "일시중지",
  ENDED: "활동종료",
};

export const SETTLEMENT_MODE_LABELS: Record<SettlementMode, string> = {
  PILOT: "시범기",
  SELF_RELIANCE: "자립전환기",
  COMMUNITY_SUPPORT: "취약계층 또는 상생기금 지원",
  CUSTOM: "직접 입력",
};

export const ROUNDING_POLICY_LABELS: Record<RoundingPolicy, string> = {
  ROUND: "반올림",
  FLOOR: "절사",
  CEIL: "올림",
  MANUAL: "직접 조정",
};
