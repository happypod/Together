"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import {
  saveNotice,
  updateEducationApplication,
} from "@/server/public/public-content-admin-service";

export type PublicContentAdminFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function revalidatePublicContent() {
  revalidatePath("/");
  revalidatePath("/public/notice");
  revalidatePath("/public/education");
  revalidatePath("/admin/public-content");
}

export async function publicContentAdminAction(
  _previousState: PublicContentAdminFormState,
  formData: FormData,
): Promise<PublicContentAdminFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "saveNotice") {
      await saveNotice(user, {
        id: String(formData.get("noticeId") ?? ""),
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        noticeType: String(formData.get("noticeType") ?? ""),
        isPinned: checked(formData, "isPinned"),
        isVisible: checked(formData, "isVisible"),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
      });
      revalidatePublicContent();
      return {
        ok: true,
        message: "공지사항을 저장했습니다.",
      };
    }

    if (intent === "updateEducationApplication") {
      await updateEducationApplication(user, {
        id: String(formData.get("applicationId") ?? ""),
        status: String(formData.get("status") ?? ""),
        operatorMemo: String(formData.get("operatorMemo") ?? ""),
      });
      revalidatePublicContent();
      return {
        ok: true,
        message: "교육 신청 상태를 저장했습니다.",
      };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "공개 홈 관리 정보를 저장하지 못했습니다.",
    };
  }
}
