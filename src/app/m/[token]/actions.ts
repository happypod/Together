"use server";

import { revalidatePath } from "next/cache";
import { submitOperationalMobileForm } from "@/server/trips/trip-operation-service";

export type MobileSubmitState = {
  ok: boolean;
  message: string;
};

export async function submitMobileFormAction(
  _previousState: MobileSubmitState,
  formData: FormData,
): Promise<MobileSubmitState> {
  const rawToken = String(formData.get("token") ?? "");

  try {
    await submitOperationalMobileForm(rawToken, formData);
    revalidatePath(`/m/${rawToken}`);
    return {
      ok: true,
      message: "저장되었습니다. 운영자가 내용을 확인합니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
