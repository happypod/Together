"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import { saveMouRecord } from "@/server/mous/mou-record-service";

export type MouRecordFormState = {
  ok: boolean;
  message: string;
};

export async function mouRecordAction(
  _previousState: MouRecordFormState,
  formData: FormData,
): Promise<MouRecordFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "saveMouRecord") {
      await saveMouRecord(user, {
        id: String(formData.get("mouRecordId") ?? ""),
        organizationName: String(formData.get("organizationName") ?? ""),
        partnerType: String(formData.get("partnerType") ?? ""),
        signedAt: String(formData.get("signedAt") ?? ""),
        startAt: String(formData.get("startAt") ?? ""),
        endAt: String(formData.get("endAt") ?? ""),
        status: String(formData.get("status") ?? ""),
        scopeSummary: String(formData.get("scopeSummary") ?? ""),
        documentUrl: String(formData.get("documentUrl") ?? ""),
        documentLabel: String(formData.get("documentLabel") ?? ""),
        attachmentFileName: String(formData.get("attachmentFileName") ?? ""),
        attachmentMimeType: String(formData.get("attachmentMimeType") ?? ""),
        attachmentSizeBytes: String(formData.get("attachmentSizeBytes") ?? ""),
      });
      revalidatePath("/admin/mou-records");
      revalidatePath("/admin/reports");
      return {
        ok: true,
        message: "MOU 기록을 저장했습니다.",
      };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "MOU 기록을 저장하지 못했습니다.",
    };
  }
}
