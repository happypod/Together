import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { type UserRole } from "@/domain/definitions";
import { prisma } from "@/server/db/prisma";

const sessionCookieName = "together_session";
const sessionTtlSeconds = 60 * 60 * 12;

export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
};

type SessionPayload = {
  userId: string;
  nonce: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret === "replace-with-a-long-random-secret") {
    return "development-session-secret-change-before-production";
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSessionToken(userId: string, now = Date.now()) {
  const payload: SessionPayload = {
    userId,
    nonce: randomBytes(12).toString("base64url"),
    exp: Math.floor(now / 1000) + sessionTtlSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string | null, now = Date.now()) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeCompare(sign(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || payload.exp < Math.floor(now / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionTtlSeconds,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const payload = verifySessionToken(cookieStore.get(sessionCookieName)?.value);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    return null;
  }

  return user;
});
