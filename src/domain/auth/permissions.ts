import { type UserRole } from "@/domain/definitions";

export const PERMISSIONS = [
  "dashboard:read",
  "resident:read",
  "resident:write",
  "request:read",
  "request:write",
  "group:read",
  "group:write",
  "linker:read",
  "linker:write",
  "taxi:read",
  "taxi:write",
  "trip:read",
  "trip:write",
  "settlement:read",
  "settlement:write",
  "settlement:unlock",
  "report:read",
  "csv:export",
  "audit:read",
  "user:manage",
  "setting:manage",
  "mobile-token:write",
  "file:write",
  "contact-log:write",
  "incident:write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type AuthUser = {
  id: string;
  role: UserRole;
  isActive: boolean;
};

const rolePermissions = {
  SUPER_ADMIN: PERMISSIONS,
  ANCHOR_ADMIN: [
    "dashboard:read",
    "resident:read",
    "resident:write",
    "request:read",
    "request:write",
    "group:read",
    "group:write",
    "linker:read",
    "linker:write",
    "taxi:read",
    "taxi:write",
    "trip:read",
    "trip:write",
    "settlement:read",
    "settlement:write",
    "report:read",
    "csv:export",
    "audit:read",
    "user:manage",
    "setting:manage",
    "mobile-token:write",
    "file:write",
    "contact-log:write",
    "incident:write",
  ],
  COUNCIL_OPERATOR: [
    "dashboard:read",
    "resident:read",
    "resident:write",
    "request:read",
    "request:write",
    "group:read",
    "group:write",
    "linker:read",
    "taxi:read",
    "taxi:write",
    "trip:read",
    "trip:write",
    "settlement:read",
    "report:read",
    "file:write",
    "contact-log:write",
    "incident:write",
  ],
  LINKER: [
    "dashboard:read",
    "group:read",
    "trip:read",
    "trip:write",
    "contact-log:write",
    "incident:write",
  ],
  TAXI_PARTNER: ["taxi:read", "taxi:write", "file:write"],
  VIEWER: [
    "dashboard:read",
    "resident:read",
    "request:read",
    "group:read",
    "linker:read",
    "taxi:read",
    "trip:read",
    "settlement:read",
    "report:read",
  ],
} satisfies Record<UserRole, readonly Permission[]>;

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = rolePermissions;

export class AuthorizationError extends Error {
  constructor(message = "권한이 없습니다.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function hasPermission(user: AuthUser | null | undefined, permission: Permission) {
  if (!user?.isActive) {
    return false;
  }
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

export function assertPermission(user: AuthUser | null | undefined, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError();
  }
}
