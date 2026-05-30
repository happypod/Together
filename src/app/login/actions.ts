"use server";

import { redirect } from "next/navigation";
import { loginWithPassword } from "@/server/auth/login";
import { clearSessionCookie } from "@/server/auth/session";

export type LoginFormState = {
  message: string;
};

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await loginWithPassword(email, password);
  if (result.ok) {
    redirect("/admin");
  }

  return { message: result.message };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
