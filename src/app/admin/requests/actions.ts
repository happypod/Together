"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/guard";
import { createResidentRequest } from "@/server/residents/resident-request-service";

export type ResidentRequestFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  return formData.get(key) === "true" || formData.get(key) === "on";
}

export async function createResidentRequestAction(
  _previousState: ResidentRequestFormState,
  formData: FormData,
): Promise<ResidentRequestFormState> {
  try {
    const user = await requirePermission("request:write");
    await createResidentRequest(user, {
      residentId: String(formData.get("residentId") ?? ""),
      residentName: String(formData.get("residentName") ?? ""),
      villageName: String(formData.get("villageName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      guardianPhone: String(formData.get("guardianPhone") ?? ""),
      memo: String(formData.get("memo") ?? ""),
      desiredDate: String(formData.get("desiredDate") ?? ""),
      desiredTimeWindow: String(formData.get("desiredTimeWindow") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      origin: String(formData.get("origin") ?? ""),
      destination: String(formData.get("destination") ?? ""),
      needsCompanion: checked(formData, "needsCompanion"),
      notes: String(formData.get("notes") ?? ""),
      privacyConsent: checked(formData, "privacyConsent"),
      thirdPartyConsent: checked(formData, "thirdPartyConsent"),
      sensitiveInfoNotCollected: checked(formData, "sensitiveInfoNotCollected"),
    });

    revalidatePath("/admin/requests");
    return {
      ok: true,
      message: "주민과 이동 신청을 저장했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
