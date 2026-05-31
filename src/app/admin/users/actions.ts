"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import {
  createUser,
  deactivateUser,
  reactivateUser,
  updateUserRole,
} from "@/server/users/user-management-service";

export type UserManagementFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

export async function userManagementAction(
  _previousState: UserManagementFormState,
  formData: FormData,
): Promise<UserManagementFormState> {
  try {
    const actor = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "createUser") {
      await createUser(actor, {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        role: String(formData.get("role") ?? ""),
        temporaryPassword: String(formData.get("temporaryPassword") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      });
      revalidatePath("/admin/users");
      return {
        ok: true,
        message: "사용자를 생성했습니다.",
      };
    }

    if (intent === "updateUserRole") {
      await updateUserRole(actor, {
        userId: String(formData.get("userId") ?? ""),
        role: String(formData.get("role") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        confirmed: checked(formData, "confirmed"),
      });
      revalidatePath("/admin/users");
      return {
        ok: true,
        message: "사용자 역할을 변경했습니다.",
      };
    }

    if (intent === "deactivateUser") {
      await deactivateUser(actor, {
        userId: String(formData.get("userId") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        confirmed: checked(formData, "confirmed"),
      });
      revalidatePath("/admin/users");
      return {
        ok: true,
        message: "사용자를 비활성화했습니다.",
      };
    }

    if (intent === "reactivateUser") {
      await reactivateUser(actor, {
        userId: String(formData.get("userId") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        confirmed: checked(formData, "confirmed"),
      });
      revalidatePath("/admin/users");
      return {
        ok: true,
        message: "사용자를 다시 활성화했습니다.",
      };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "사용자 정보를 저장하지 못했습니다.",
    };
  }
}
