import type { FontAwesomeIconName } from "@/lib/fa-icons";

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

export const INCIDENT_TYPES = [
  "INCIDENT",
  "COMPLAINT",
  "LOST_ITEM",
  "DELAY",
  "RETURN_ISSUE",
  "OTHER",
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const COMMUNITY_FUND_TYPES = ["CONTRIBUTION", "SUPPORT_RECORD"] as const;

export type CommunityFundType = (typeof COMMUNITY_FUND_TYPES)[number];

export const JOB_CONSULTATION_TARGET_TYPES = ["LINKER", "RESIDENT"] as const;

export type JobConsultationTargetType = (typeof JOB_CONSULTATION_TARGET_TYPES)[number];

export const JOB_CONSULTATION_STATUSES = [
  "REQUESTED",
  "IN_PROGRESS",
  "CONNECTED",
  "CLOSED",
] as const;

export type JobConsultationStatus = (typeof JOB_CONSULTATION_STATUSES)[number];

export const MOU_STATUSES = ["ACTIVE", "RENEWAL_DUE", "EXPIRED", "TERMINATED"] as const;

export type MouStatus = (typeof MOU_STATUSES)[number];

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
  "PDF_EXPORT",
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

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  INCIDENT: "사고",
  COMPLAINT: "민원",
  LOST_ITEM: "분실",
  DELAY: "지연",
  RETURN_ISSUE: "귀가 이슈",
  OTHER: "기타",
};

export const COMMUNITY_FUND_TYPE_LABELS: Record<CommunityFundType, string> = {
  CONTRIBUTION: "조성액",
  SUPPORT_RECORD: "지원 기록",
};

export const JOB_CONSULTATION_TARGET_TYPE_LABELS: Record<JobConsultationTargetType, string> = {
  LINKER: "동행링커",
  RESIDENT: "주민",
};

export const JOB_CONSULTATION_STATUS_LABELS: Record<JobConsultationStatus, string> = {
  REQUESTED: "접수",
  IN_PROGRESS: "진행",
  CONNECTED: "연계 완료",
  CLOSED: "종료",
};

export const MOU_STATUS_LABELS: Record<MouStatus, string> = {
  ACTIVE: "유효",
  RENEWAL_DUE: "갱신 필요",
  EXPIRED: "기간 만료",
  TERMINATED: "종료",
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

// 고령 참여자를 위한 3단계 친화 설문 척도. 한 문항을 큰 버튼 3개로 답한다.
// 내부 점수는 기존 1~5 척도와 호환되도록 5/3/1로 저장한다.
export type SurveyScaleOption = {
  value: number;
  label: string;
  icon: FontAwesomeIconName;
};

export const SURVEY_SCORE_MIN = 1;
export const SURVEY_SCORE_MAX = 5;

export const EMOTIONAL_RECOVERY_OPTIONS: readonly SurveyScaleOption[] = [
  { value: 5, label: "좋아졌어요", icon: "smile" },
  { value: 3, label: "그대로예요", icon: "meh" },
  { value: 1, label: "힘들었어요", icon: "frown" },
];

export const SATISFACTION_OPTIONS: readonly SurveyScaleOption[] = [
  { value: 5, label: "좋았어요", icon: "smile" },
  { value: 3, label: "보통이에요", icon: "meh" },
  { value: 1, label: "아쉬웠어요", icon: "frown" },
];

export const REUSE_INTENT_OPTIONS: readonly SurveyScaleOption[] = [
  { value: 5, label: "또 이용할래요", icon: "thumbsUp" },
  { value: 3, label: "글쎄요", icon: "question" },
  { value: 1, label: "어려워요", icon: "thumbsDown" },
];

export const SURVEY_QUESTIONS = {
  emotionalRecovery: {
    field: "emotionalRecovery",
    legend: "오늘 나들이 뒤, 마음이 어떠셨어요?",
    options: EMOTIONAL_RECOVERY_OPTIONS,
  },
  userSatisfaction: {
    field: "userSatisfaction",
    legend: "오늘 동행은 어떠셨어요?",
    options: SATISFACTION_OPTIONS,
  },
  reuseIntent: {
    field: "reuseIntent",
    legend: "다음에도 함께 하실래요?",
    options: REUSE_INTENT_OPTIONS,
  },
} as const;

export function describeSurveyScore(value: number | null | undefined): SurveyScaleOption {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { value: 0, label: "응답 없음", icon: "question" };
  }
  if (value >= 4) {
    return { value: 5, label: "좋음", icon: "smile" };
  }
  if (value >= 2.5) {
    return { value: 3, label: "보통", icon: "meh" };
  }
  return { value: 1, label: "아쉬움", icon: "frown" };
}
