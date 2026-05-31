"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import { updateEducationApplication } from "@/server/public/public-content-admin-service";
import { saveEducationSchedule } from "@/server/public/education-schedule-service";

export type EducationApplicationsAdminFormState = {
  ok: boolean;
  message: string;
};

export async function educationApplicationsAdminAction(
  _previousState: EducationApplicationsAdminFormState,
  formData: FormData,
): Promise<EducationApplicationsAdminFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "updateApplication");

    if (intent === "saveSchedule") {
      await saveEducationSchedule(user, {
        id: String(formData.get("scheduleId") ?? ""),
        courseType: String(formData.get("courseType") ?? ""),
        title: String(formData.get("title") ?? ""),
        scheduleDate: String(formData.get("scheduleDate") ?? ""),
        time: String(formData.get("time") ?? ""),
        target: String(formData.get("target") ?? ""),
        place: String(formData.get("place") ?? ""),
        status: String(formData.get("status") ?? ""),
        isVisible: formData.get("isVisible") === "on",
      });

      revalidatePath("/");
      revalidatePath("/public/education");
      revalidatePath("/admin/education-applications");

      return {
        ok: true,
        message: "교육 일정을 저장했습니다.",
      };
    }

    await updateEducationApplication(user, {
      id: String(formData.get("applicationId") ?? ""),
      status: String(formData.get("status") ?? ""),
      operatorMemo: String(formData.get("operatorMemo") ?? ""),
    });

    revalidatePath("/public/education");
    revalidatePath("/admin/education-applications");

    return {
      ok: true,
      message: "교육 신청 상태를 저장했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "교육 신청 상태를 저장하지 못했습니다.",
    };
  }
}
