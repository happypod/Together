"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import { saveNotice } from "@/server/public/public-content-admin-service";

export type NoticeAdminFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

export async function noticeAdminAction(
  _previousState: NoticeAdminFormState,
  formData: FormData,
): Promise<NoticeAdminFormState> {
  try {
    const user = await requireCurrentUser();

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

    revalidatePath("/");
    revalidatePath("/public/notice");
    revalidatePath("/admin/notices");

    return {
      ok: true,
      message: "공지사항을 저장했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "공지사항을 저장하지 못했습니다.",
    };
  }
}
