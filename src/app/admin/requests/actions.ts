"use server";

import { revalidatePath } from "next/cache";
import { hasPermission } from "@/domain/auth/permissions";
import { requireCurrentUser, requirePermission } from "@/server/auth/guard";
import { createMobileFormToken } from "@/server/mobile-forms/token-service";
import { createResidentRequest } from "@/server/residents/resident-request-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";

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

export async function issueRequestIntakeLinkAction(
  previousState: ResidentRequestFormState,
  formData: FormData,
): Promise<ResidentRequestFormState> {
  void previousState;
  void formData;

  try {
    const user = await requireCurrentUser();
    if (!hasPermission(user, "mobile-token:write")) {
      throw new Error("모바일 신청 링크를 발급할 권한이 없습니다.");
    }

    const ttlHours = DEFAULT_OPERATING_SETTINGS.mobileTokenTtlHours;
    const { rawToken } = await createMobileFormToken({
      createdByUserId: user.id,
      scope: "REQUEST_INTAKE",
      targetType: "User",
      targetId: user.id,
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      maxUseCount: 1,
    });

    revalidatePath("/admin/requests");
    return {
      ok: true,
      message: `모바일 신청 입력 링크를 만들었습니다: /m/${rawToken} · ${ttlHours}시간 동안 1회 저장 가능합니다.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "모바일 신청 링크를 만들지 못했습니다.",
    };
  }
}
