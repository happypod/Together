"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import {
  saveParticipantProfile,
  sendParticipantNotice,
  setParticipantPassword,
} from "@/server/participants/participant-management-service";

export type ParticipantManagementFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value));
}

export async function participantManagementAction(
  _previousState: ParticipantManagementFormState,
  formData: FormData,
): Promise<ParticipantManagementFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "saveProfile") {
      await saveParticipantProfile(user, {
        availableDays: values(formData, "availableDays"),
        availableTimeWindows: values(formData, "availableTimeWindows"),
        desiredJobField: String(formData.get("desiredJobField") ?? ""),
        fieldPracticeCompleted: checked(formData, "fieldPracticeCompleted"),
        guardianPhone: String(formData.get("guardianPhone") ?? ""),
        id: String(formData.get("targetId") ?? ""),
        insuranceRegistered: checked(formData, "insuranceRegistered"),
        kind: String(formData.get("kind") ?? ""),
        memo: String(formData.get("memo") ?? ""),
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        privacyPledgeSigned: checked(formData, "privacyPledgeSigned"),
        status: String(formData.get("status") ?? "CANDIDATE"),
        trainingCompleted: checked(formData, "trainingCompleted"),
        villageName: String(formData.get("villageName") ?? ""),
        wantsJobConnection: checked(formData, "wantsJobConnection"),
      });
      revalidatePath("/admin/participants");
      return { ok: true, message: "기본 정보를 저장했습니다." };
    }

    if (intent === "setPassword") {
      await setParticipantPassword(user, {
        email: String(formData.get("email") ?? ""),
        id: String(formData.get("targetId") ?? ""),
        kind: String(formData.get("kind") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      revalidatePath("/admin/participants");
      return { ok: true, message: "로그인 계정과 비밀번호를 저장했습니다." };
    }

    if (intent === "sendNotice") {
      await sendParticipantNotice(user, {
        content: String(formData.get("content") ?? ""),
        id: String(formData.get("targetId") ?? ""),
        kind: String(formData.get("kind") ?? ""),
        title: String(formData.get("title") ?? ""),
      });
      revalidatePath("/admin/participants");
      return { ok: true, message: "개인 공지 발송 기록을 저장했습니다." };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "사용자현황을 저장하지 못했습니다.",
    };
  }
}
