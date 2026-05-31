import {
  hasPermission,
  type AuthUser,
  type Permission,
} from "@/domain/auth/permissions";
import { type UserRole } from "@/domain/definitions";

export type AdminRouteId =
  | "dashboard"
  | "requests"
  | "groups"
  | "calendar"
  | "trips"
  | "settlements"
  | "reports"
  | "publicContent";

export type ProtectedActionId =
  | "createResidentRequest"
  | "createMobilityGroup"
  | "transitionGroupStatus"
  | "assignLinkerToGroup"
  | "createLinker"
  | "updateLinkerStatus"
  | "requestTaxiReservation"
  | "confirmTaxiReservation"
  | "updateTripStatus"
  | "confirmReturn"
  | "saveSettlement"
  | "updateLockedSettlement"
  | "prepareSettlementCsv"
  | "exportMonthlyCsv"
  | "exportMonthlyPdf"
  | "createJobConsultation"
  | "createMouRecord"
  | "createUser"
  | "updateUserRole"
  | "deactivateUser"
  | "createMobileFormToken"
  | "uploadReceipt";

export type RouteAccessRule = {
  id: AdminRouteId;
  label: string;
  href: string;
  anyPermission: readonly Permission[];
};

export type ActionAccessRule = {
  id: ProtectedActionId;
  label: string;
  allPermissions: readonly Permission[];
  allowedRoles: readonly UserRole[];
  assignedOnlyFor?: readonly UserRole[];
};

export type ActionAccessContext = {
  assignedLinker?: boolean;
};

export const ADMIN_ROUTE_ACCESS_RULES = [
  {
    id: "dashboard",
    label: "대시보드",
    href: "/",
    anyPermission: ["dashboard:read"],
  },
  {
    id: "requests",
    label: "주민 신청",
    href: "/admin/requests",
    anyPermission: ["request:read"],
  },
  {
    id: "groups",
    label: "공동예약",
    href: "/admin/groups",
    anyPermission: ["group:read"],
  },
  {
    id: "calendar",
    label: "캘린더",
    href: "/admin/calendar",
    anyPermission: ["request:read", "group:read", "trip:read", "taxi:read"],
  },
  {
    id: "trips",
    label: "동행링커와 운행",
    href: "/admin/trips",
    anyPermission: ["trip:read", "taxi:read", "linker:read", "group:write"],
  },
  {
    id: "settlements",
    label: "정산",
    href: "/admin/settlements",
    anyPermission: ["settlement:read"],
  },
  {
    id: "reports",
    label: "리포트",
    href: "/admin/reports",
    anyPermission: ["report:read"],
  },
  {
    id: "publicContent",
    label: "공개 홈",
    href: "/admin/public-content",
    anyPermission: ["setting:manage", "request:read"],
  },
] satisfies readonly RouteAccessRule[];

export const ACTION_ACCESS_RULES = [
  {
    id: "createResidentRequest",
    label: "주민 신청 저장",
    allPermissions: ["resident:write", "request:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "createMobilityGroup",
    label: "공동예약 그룹 생성",
    allPermissions: ["group:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "transitionGroupStatus",
    label: "그룹 상태 변경",
    allPermissions: ["group:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "assignLinkerToGroup",
    label: "동행링커 배정",
    allPermissions: ["group:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "createLinker",
    label: "동행링커 등록",
    allPermissions: ["linker:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "updateLinkerStatus",
    label: "동행링커 상태 변경",
    allPermissions: ["linker:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "requestTaxiReservation",
    label: "택시 예약요청",
    allPermissions: ["taxi:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "confirmTaxiReservation",
    label: "택시 예약확정",
    allPermissions: ["taxi:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "TAXI_PARTNER"],
  },
  {
    id: "updateTripStatus",
    label: "운행 체크",
    allPermissions: ["trip:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR", "LINKER"],
    assignedOnlyFor: ["LINKER"],
  },
  {
    id: "confirmReturn",
    label: "귀가 확인",
    allPermissions: ["trip:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR", "LINKER"],
    assignedOnlyFor: ["LINKER"],
  },
  {
    id: "saveSettlement",
    label: "정산 저장",
    allPermissions: ["settlement:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "updateLockedSettlement",
    label: "정산 완료 후 수정",
    allPermissions: ["settlement:write", "settlement:unlock"],
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    id: "prepareSettlementCsv",
    label: "CSV 준비 기록",
    allPermissions: ["csv:export"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "exportMonthlyCsv",
    label: "월간 CSV 다운로드",
    allPermissions: ["csv:export"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "exportMonthlyPdf",
    label: "월간 PDF 다운로드",
    allPermissions: ["csv:export"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "createJobConsultation",
    label: "취업연계 상담 기록",
    allPermissions: ["contact-log:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "COUNCIL_OPERATOR"],
  },
  {
    id: "createMouRecord",
    label: "MOU 기록",
    allPermissions: ["setting:manage"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "createUser",
    label: "사용자 생성",
    allPermissions: ["user:manage"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "updateUserRole",
    label: "사용자 역할 변경",
    allPermissions: ["user:manage"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "deactivateUser",
    label: "사용자 비활성화",
    allPermissions: ["user:manage"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "createMobileFormToken",
    label: "모바일 링크 발급",
    allPermissions: ["mobile-token:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN"],
  },
  {
    id: "uploadReceipt",
    label: "영수증 첨부",
    allPermissions: ["file:write"],
    allowedRoles: ["SUPER_ADMIN", "ANCHOR_ADMIN", "TAXI_PARTNER"],
  },
] satisfies readonly ActionAccessRule[];

export function canAccessAdminRoute(user: AuthUser | null | undefined, routeId: AdminRouteId) {
  const rule = ADMIN_ROUTE_ACCESS_RULES.find((item) => item.id === routeId);
  if (!rule) {
    return false;
  }
  return rule.anyPermission.some((permission) => hasPermission(user, permission));
}

export function canUseProtectedAction(
  user: AuthUser | null | undefined,
  actionId: ProtectedActionId,
  context: ActionAccessContext = {},
) {
  if (!user?.isActive) {
    return false;
  }
  const rule = ACTION_ACCESS_RULES.find((item) => item.id === actionId);
  if (!rule) {
    return false;
  }
  if (!(rule.allowedRoles as readonly UserRole[]).includes(user.role)) {
    return false;
  }
  if (
    (rule.assignedOnlyFor as readonly UserRole[] | undefined)?.includes(user.role) &&
    user.role === "LINKER" &&
    !context.assignedLinker
  ) {
    return false;
  }
  return rule.allPermissions.every((permission) => hasPermission(user, permission));
}
