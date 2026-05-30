import { verifyPassword } from "@/server/auth/password";
import { setSessionCookie } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, message: "이메일과 비밀번호를 입력해 주세요." };
  }

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    select: {
      id: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, message: "이메일 또는 비밀번호가 맞지 않습니다." };
  }

  if (!user.isActive) {
    return { ok: false, message: "비활성화된 계정입니다. 관리자에게 문의해 주세요." };
  }

  await setSessionCookie(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { ok: true };
}
