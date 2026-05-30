import { type Permission, assertPermission } from "@/domain/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";

export class AuthenticationError extends Error {
  constructor(message = "로그인이 필요합니다.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireCurrentUser();
  assertPermission(user, permission);
  return user;
}
