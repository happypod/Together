"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import { saveJobConsultation } from "@/server/jobs/job-consultation-service";

export type JobConsultationFormState = {
  ok: boolean;
  message: string;
};

function splitTargetKey(value: FormDataEntryValue | null) {
  const [targetType, targetId] = String(value ?? "").split(":");
  return { targetType, targetId };
}

export async function jobConsultationAction(
  _previousState: JobConsultationFormState,
  formData: FormData,
): Promise<JobConsultationFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "saveJobConsultation") {
      const target = splitTargetKey(formData.get("targetKey"));
      await saveJobConsultation(user, {
        id: String(formData.get("jobConsultationId") ?? ""),
        targetType: target.targetType,
        targetId: target.targetId,
        consultedAt: String(formData.get("consultedAt") ?? ""),
        field: String(formData.get("field") ?? ""),
        status: String(formData.get("status") ?? ""),
        organization: String(formData.get("organization") ?? ""),
        supportSummary: String(formData.get("supportSummary") ?? ""),
      });
      revalidatePath("/admin/job-consultations");
      revalidatePath("/admin/reports");
      return {
        ok: true,
        message: "취업연계 상담 기록을 저장했습니다.",
      };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "취업연계 상담 기록을 저장하지 못했습니다.",
    };
  }
}
