import { Prisma } from "@prisma/client";
import { AuthorizationError, assertPermission, type AuthUser } from "@/domain/auth/permissions";
import { USER_ROLES, type UserRole } from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo, maskPhone } from "@/domain/privacy";
import { hashPassword } from "@/server/auth/password";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

export type UserManagementInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  temporaryPassword?: string | null;
  reason?: string | null;
};

export type RoleChangeInput = {
  userId?: string | null;
  role?: string | null;
  reason?: string | null;
  confirmed?: boolean;
};

export type ActivationInput = {
  userId?: string | null;
  reason?: string | null;
  confirmed?: boolean;
};

export type ManagedUserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  maskedPhone: string;
  role: UserRole;
  roleLabel: string;
  roleDescription: string;
  isActive: boolean;
  statusLabel: string;
  passwordConfigured: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  editableRoleOptions: { value: UserRole; label: string }[];
  canChangeRole: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  restrictionText: string;
};

export type UserAuditRow = {
  id: string;
  actorName: string;
  action: string;
  targetId: string;
  targetName: string;
  performedAt: string;
  note: string;
};

export type UserManagementView = {
  users: ManagedUserRow[];
  auditRows: UserAuditRow[];
  roleOptions: { value: UserRole; label: string; description: string }[];
  canCreate: boolean;
  policy: {
    superAdmin: string;
    anchorAdmin: string;
    dangerousAction: string;
    invitation: string;
  };
  summary: {
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    pendingPasswordCount: number;
  };
};

type UserRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  passwordHash: string | null;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const anchorAssignableRoles: readonly UserRole[] = [
  "COUNCIL_OPERATOR",
  "RESIDENT",
  "LINKER",
  "TAXI_PARTNER",
  "VIEWER",
];

export const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "최고 관리자",
  ANCHOR_ADMIN: "운영 책임자",
  COUNCIL_OPERATOR: "협의체 운영자",
  RESIDENT: "주민",
  LINKER: "동행링커",
  TAXI_PARTNER: "택시 파트너",
  VIEWER: "열람 전용",
};

const roleDescriptions: Record<UserRole, string> = {
  SUPER_ADMIN: "전체 설정, 사용자, 정산 잠금 해제까지 관리합니다.",
  ANCHOR_ADMIN: "운영 전반과 제한된 사용자 관리를 담당합니다.",
  COUNCIL_OPERATOR: "주민 신청, 공동예약, 운행 기록을 처리합니다.",
  RESIDENT: "본인 신청, 교육, 공지, 이용 데이터를 확인합니다.",
  LINKER: "배정된 운행 체크와 귀가 확인을 처리합니다.",
  TAXI_PARTNER: "택시 예약 확정과 영수증 첨부를 처리합니다.",
  VIEWER: "개인정보 최소화 조회만 가능합니다.",
};

const userManagementPolicy = {
  superAdmin: "SUPER_ADMIN은 모든 역할을 생성·변경할 수 있으며 마지막 최고 관리자 보호를 적용합니다.",
  anchorAdmin: "ANCHOR_ADMIN은 주민, 협의체 운영자, 동행링커, 택시 파트너, 열람 전용 계정을 관리합니다.",
  dangerousAction: "역할 변경과 비활성화는 사유와 확인 체크가 필요하며 AuditLog에 기록합니다.",
  invitation: "초기 비밀번호를 입력하면 즉시 로그인 가능한 계정으로 생성하고, 비워두면 초대 대기 상태로 둡니다.",
} as const;

function parseRole(value?: string | null): UserRole {
  const role = String(value ?? "").trim() as UserRole;
  if (!USER_ROLES.includes(role)) {
    throw new Error("사용자 역할을 다시 선택해 주세요.");
  }
  return role;
}

function normalizeRequired(value: string | null | undefined, label: string, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  if (!text) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return text;
}

function normalizeOptional(value: string | null | undefined, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  return text || null;
}

function normalizeEmail(value: string | null | undefined) {
  const email = normalizeRequired(value, "이메일", 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("이메일 형식을 다시 확인해 주세요.");
  }
  return email;
}

function normalizeReason(value: string | null | undefined) {
  const reason = normalizeRequired(value, "처리 사유", 300);
  assertNoForbiddenSensitiveInfo({ "처리 사유": reason });
  return reason;
}

function normalizeTemporaryPassword(value: string | null | undefined) {
  const password = String(value ?? "");
  if (!password.trim()) {
    return null;
  }
  if (password.length < 10) {
    throw new Error("초기 비밀번호는 10자 이상이어야 합니다.");
  }
  return password;
}

function assertConfirmed(confirmed: boolean | undefined, message: string) {
  if (!confirmed) {
    throw new Error(message);
  }
}

function assertUserManageActor(actor: AuthUser) {
  assertPermission(actor, "user:manage");
  if (!["SUPER_ADMIN", "ANCHOR_ADMIN"].includes(actor.role)) {
    throw new AuthorizationError("사용자 관리는 운영 책임자 이상만 처리할 수 있습니다.");
  }
}

function assignableRolesFor(actor: AuthUser) {
  if (actor.role === "SUPER_ADMIN") {
    return USER_ROLES;
  }
  return anchorAssignableRoles;
}

function canAssignRole(actor: AuthUser, role: UserRole) {
  return assignableRolesFor(actor).includes(role);
}

function canManageTargetRole(actor: AuthUser, targetRole: UserRole) {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }
  return anchorAssignableRoles.includes(targetRole);
}

function assertAssignableRole(actor: AuthUser, role: UserRole) {
  if (!canAssignRole(actor, role)) {
    throw new AuthorizationError("이 역할을 부여할 권한이 없습니다.");
  }
}

function assertManageTarget(actor: AuthUser, target: Pick<UserRecord, "role">) {
  if (!canManageTargetRole(actor, target.role)) {
    throw new AuthorizationError("이 계정은 SUPER_ADMIN만 관리할 수 있습니다.");
  }
}

function assertNotSelf(actor: AuthUser, targetId: string, message: string) {
  if (actor.id === targetId) {
    throw new Error(message);
  }
}

async function assertNotLastActiveSuperAdmin(target: Pick<UserRecord, "id" | "role" | "isActive">) {
  if (target.role !== "SUPER_ADMIN" || !target.isActive) {
    return;
  }
  const count = await prisma.user.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  if (count <= 1) {
    throw new Error("마지막 활성 최고 관리자는 변경하거나 비활성화할 수 없습니다.");
  }
}

function parseUserId(value?: string | null) {
  const id = String(value ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("대상 사용자를 찾을 수 없습니다.");
  }
  return id;
}

function iso(value: Date | string | null) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function summarizeUser(user: UserRecord) {
  return {
    name: user.name,
    email: user.email,
    phone: maskPhone(user.phone),
    role: user.role,
    isActive: user.isActive,
    passwordConfigured: Boolean(user.passwordHash),
  };
}

function editableRoleOptions(actor: AuthUser | null, target: UserRecord) {
  if (!actor || !canManageTargetRole(actor, target.role) || actor.id === target.id) {
    return [];
  }
  return assignableRolesFor(actor).map((role) => ({
    value: role,
    label: roleLabels[role],
  }));
}

function restrictionText(actor: AuthUser | null, target: UserRecord) {
  if (!actor) {
    return "로그인 후 사용자 관리를 실행할 수 있습니다.";
  }
  if (actor.id === target.id) {
    return "본인 계정은 이 화면에서 역할 변경이나 비활성화를 할 수 없습니다.";
  }
  if (!canManageTargetRole(actor, target.role)) {
    return "이 계정은 최고 관리자만 변경할 수 있습니다.";
  }
  return target.isActive ? "역할 변경과 비활성화 가능" : "비활성 계정은 재활성화할 수 있습니다.";
}

function toManagedUserRow(actor: AuthUser | null, user: UserRecord): ManagedUserRow {
  const options = editableRoleOptions(actor, user);
  const targetManageable = Boolean(actor && canManageTargetRole(actor, user.role) && actor.id !== user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    maskedPhone: maskPhone(user.phone),
    role: user.role,
    roleLabel: roleLabels[user.role],
    roleDescription: roleDescriptions[user.role],
    isActive: user.isActive,
    statusLabel: user.isActive ? "활성" : "비활성",
    passwordConfigured: Boolean(user.passwordHash),
    lastLoginAt: iso(user.lastLoginAt),
    createdAt: iso(user.createdAt) ?? "",
    updatedAt: iso(user.updatedAt) ?? "",
    editableRoleOptions: options,
    canChangeRole: targetManageable && options.length > 0 && user.isActive,
    canDeactivate: targetManageable && user.isActive,
    canReactivate: targetManageable && !user.isActive,
    restrictionText: restrictionText(actor, user),
  };
}

function buildView(
  actor: AuthUser | null,
  users: UserRecord[],
  auditRows: UserAuditRow[] = [],
): UserManagementView {
  return {
    users: users.map((user) => toManagedUserRow(actor, user)),
    auditRows,
    roleOptions: (actor ? assignableRolesFor(actor) : []).map((role) => ({
      value: role,
      label: roleLabels[role],
      description: roleDescriptions[role],
    })),
    canCreate: Boolean(actor && hasUserManagePermission(actor)),
    policy: userManagementPolicy,
    summary: {
      totalCount: users.length,
      activeCount: users.filter((user) => user.isActive).length,
      inactiveCount: users.filter((user) => !user.isActive).length,
      pendingPasswordCount: users.filter((user) => !user.passwordHash).length,
    },
  };
}

function hasUserManagePermission(actor: AuthUser) {
  try {
    assertUserManageActor(actor);
    return true;
  } catch {
    return false;
  }
}

function auditNoteFromValue(value: unknown) {
  if (!value || typeof value !== "object") {
    return "";
  }
  const entry = value as { reason?: unknown; role?: unknown; previousRole?: unknown; isActive?: unknown };
  if (entry.reason) {
    return String(entry.reason);
  }
  if (entry.role && entry.previousRole) {
    return `${entry.previousRole} -> ${entry.role}`;
  }
  if (typeof entry.isActive === "boolean") {
    return entry.isActive ? "계정 활성화" : "계정 비활성화";
  }
  return "";
}

export async function getUserManagementView(actor: AuthUser): Promise<UserManagementView> {
  assertUserManageActor(actor);
  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        passwordHash: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        targetType: "User",
        action: {
          in: ["CREATE", "UPDATE", "STATUS_CHANGE"],
        },
      },
      orderBy: { performedAt: "desc" },
      take: 12,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const userNameById = new Map(users.map((user) => [user.id, user.name]));
  return buildView(
    actor,
    users,
    logs.map((log) => ({
      id: log.id,
      actorName: log.user.name,
      action: log.action,
      targetId: log.targetId,
      targetName: userNameById.get(log.targetId) ?? "삭제되었거나 알 수 없는 사용자",
      performedAt: log.performedAt.toISOString(),
      note: auditNoteFromValue(log.afterValue),
    })),
  );
}

export async function createUser(actor: AuthUser, input: UserManagementInput) {
  assertUserManageActor(actor);
  const name = normalizeRequired(input.name, "이름", 40);
  const email = normalizeEmail(input.email);
  const phone = normalizeOptional(input.phone, 30);
  const role = parseRole(input.role);
  const temporaryPassword = normalizeTemporaryPassword(input.temporaryPassword);
  const reason = normalizeReason(input.reason);
  assertAssignableRole(actor, role);
  assertNoForbiddenSensitiveInfo({ 이름: name, "초대 사유": reason });

  const passwordHash = temporaryPassword ? await hashPassword(temporaryPassword) : null;

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          role,
          passwordHash,
          isActive: true,
        },
      });

      await writeAuditLog(tx, {
        userId: actor.id,
        action: "CREATE",
        targetType: "User",
        targetId: user.id,
        afterValue: {
          ...summarizeUser(user),
          reason,
        },
      });

      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("이미 등록된 이메일입니다.");
    }
    throw error;
  }
}

export async function updateUserRole(actor: AuthUser, input: RoleChangeInput) {
  assertUserManageActor(actor);
  const userId = parseUserId(input.userId);
  const role = parseRole(input.role);
  const reason = normalizeReason(input.reason);
  assertConfirmed(input.confirmed, "역할 변경 확인을 체크해 주세요.");
  assertAssignableRole(actor, role);
  assertNotSelf(actor, userId, "본인 역할은 이 화면에서 변경할 수 없습니다.");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      passwordHash: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!target) {
    throw new Error("대상 사용자를 찾을 수 없습니다.");
  }
  assertManageTarget(actor, target);
  if (target.role === role) {
    throw new Error("현재 역할과 같은 역할입니다.");
  }
  await assertNotLastActiveSuperAdmin(target);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { role },
    });
    await writeAuditLog(tx, {
      userId: actor.id,
      action: "UPDATE",
      targetType: "User",
      targetId: userId,
      beforeValue: {
        role: target.role,
      },
      afterValue: {
        previousRole: target.role,
        role,
        reason,
      },
    });
    return updated;
  });
}

export async function deactivateUser(actor: AuthUser, input: ActivationInput) {
  return updateUserActiveState(actor, input, false);
}

export async function reactivateUser(actor: AuthUser, input: ActivationInput) {
  return updateUserActiveState(actor, input, true);
}

async function updateUserActiveState(
  actor: AuthUser,
  input: ActivationInput,
  isActive: boolean,
) {
  assertUserManageActor(actor);
  const userId = parseUserId(input.userId);
  const reason = normalizeReason(input.reason);
  assertConfirmed(
    input.confirmed,
    isActive ? "재활성화 확인을 체크해 주세요." : "비활성화 확인을 체크해 주세요.",
  );
  assertNotSelf(actor, userId, "본인 계정은 이 화면에서 비활성화할 수 없습니다.");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      passwordHash: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!target) {
    throw new Error("대상 사용자를 찾을 수 없습니다.");
  }
  assertManageTarget(actor, target);
  if (target.isActive === isActive) {
    throw new Error(isActive ? "이미 활성 계정입니다." : "이미 비활성 계정입니다.");
  }
  if (!isActive) {
    await assertNotLastActiveSuperAdmin(target);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { isActive },
    });
    await writeAuditLog(tx, {
      userId: actor.id,
      action: "STATUS_CHANGE",
      targetType: "User",
      targetId: userId,
      beforeValue: {
        isActive: target.isActive,
      },
      afterValue: {
        isActive,
        reason,
      },
    });
    return updated;
  });
}

const previewUsers: UserRecord[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "김운영",
    email: "admin@example.org",
    phone: "010-1234-5678",
    role: "SUPER_ADMIN",
    isActive: true,
    passwordHash: "preview",
    lastLoginAt: "2026-05-30T09:00:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "박책임",
    email: "anchor@example.org",
    phone: "010-2222-3333",
    role: "ANCHOR_ADMIN",
    isActive: true,
    passwordHash: "preview",
    lastLoginAt: "2026-05-29T05:30:00.000Z",
    createdAt: "2026-05-03T08:00:00.000Z",
    updatedAt: "2026-05-29T05:30:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "이협의",
    email: "council@example.org",
    phone: "010-4444-5555",
    role: "COUNCIL_OPERATOR",
    isActive: true,
    passwordHash: null,
    lastLoginAt: null,
    createdAt: "2026-05-20T10:00:00.000Z",
    updatedAt: "2026-05-20T10:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "최열람",
    email: "viewer@example.org",
    phone: null,
    role: "VIEWER",
    isActive: false,
    passwordHash: "preview",
    lastLoginAt: "2026-05-10T03:00:00.000Z",
    createdAt: "2026-05-05T08:00:00.000Z",
    updatedAt: "2026-05-21T10:00:00.000Z",
  },
];

export function createPreviewUserManagementView(actor: AuthUser | null = null): UserManagementView {
  return buildView(actor, previewUsers, [
    {
      id: "preview-audit-user-1",
      actorName: "김운영",
      action: "UPDATE",
      targetId: previewUsers[2].id,
      targetName: previewUsers[2].name,
      performedAt: "2026-05-21T10:10:00.000Z",
      note: "운영 범위 조정",
    },
    {
      id: "preview-audit-user-2",
      actorName: "박책임",
      action: "STATUS_CHANGE",
      targetId: previewUsers[3].id,
      targetName: previewUsers[3].name,
      performedAt: "2026-05-21T10:00:00.000Z",
      note: "퇴사 처리",
    },
  ]);
}
