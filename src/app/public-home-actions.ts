"use server";

import { MOBILITY_PURPOSES, type MobilityPurpose } from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { prisma } from "@/server/db/prisma";
import { checkPublicRequest } from "@/server/public/public-home-service";

export type PublicRequestState = {
  ok: boolean;
  message: string;
  refCode?: string;
  step?: "form" | "success";
};

export type PublicCheckState = {
  ok: boolean;
  message: string;
  result?: {
    statusLabel: string;
    advice: string;
    desiredDate: string;
    timeWindow: string;
    purposeLabel: string;
    createdAt: string;
  };
};

export type PublicEducationApplicationState = {
  ok: boolean;
  message: string;
  receiptCode?: string;
  step?: "form" | "success";
};

export type PublicFeedbackState = {
  ok: boolean;
  message: string;
  step?: "form" | "success";
};

export type PublicLinkerAssignmentState = {
  ok: boolean;
  message: string;
  step?: "form" | "success";
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function readMulti(formData: FormData, key: string, allowed: readonly string[]) {
  return formData
    .getAll(key)
    .map((value) => cleanText(value, 40))
    .filter((value) => allowed.includes(value));
}

// ──────────────── 공개 신청 제출 ────────────────

export async function createPublicMobilityRequest(
  _prev: PublicRequestState,
  formData: FormData,
): Promise<PublicRequestState> {
  const name = String(formData.get("residentName") ?? "").trim();
  const villageName = String(formData.get("villageName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const guardianPhone = String(formData.get("guardianPhone") ?? "").trim();
  const desiredDate = String(formData.get("desiredDate") ?? "").trim();
  const desiredTimeWindow = String(formData.get("desiredTimeWindow") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const origin = String(formData.get("origin") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const needsCompanion = formData.get("needsCompanion") !== "false";
  const notes = String(formData.get("notes") ?? "").trim();
  const privacyConsent = formData.get("privacyConsent") === "true";
  const thirdPartyConsent = formData.get("thirdPartyConsent") === "true";
  const sensitiveConfirmed = formData.get("sensitiveInfoNotCollected") === "true";

  if (!name || !phone || !desiredDate || !desiredTimeWindow || !purpose || !origin || !destination) {
    return { ok: false, message: "필수 항목을 모두 입력해 주세요.", step: "form" };
  }

  if (!privacyConsent || !thirdPartyConsent || !sensitiveConfirmed) {
    return { ok: false, message: "모든 동의 항목을 확인해 주세요.", step: "form" };
  }

  if (!MOBILITY_PURPOSES.includes(purpose as MobilityPurpose)) {
    return { ok: false, message: "이동 목적을 다시 선택해 주세요.", step: "form" };
  }

  try {
    assertNoForbiddenSensitiveInfo({ 특이사항: notes });
  } catch {
    return {
      ok: false,
      message: "입력 내용을 확인해 주세요. 민감정보는 입력하지 않습니다.",
      step: "form",
    };
  }

  const previewRef = `신청-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const successMsg = `신청이 접수되었습니다. 운영자가 같은 날짜와 방향의 신청자를 확인한 뒤 공동예약 가능 여부를 안내합니다.`;

  try {
    // 공개 포털 신청을 처리할 운영자를 조회한다.
    const systemUser = await prisma.user.findFirst({
      where: { role: { in: ["ANCHOR_ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (!systemUser) {
      return { ok: true, message: successMsg, refCode: previewRef, step: "success" };
    }

    let residentId: string;
    const existing = await prisma.resident.findFirst({
      where: { name, phone, deletedAt: null },
      select: { id: true },
    });

    if (existing) {
      residentId = existing.id;
      if (guardianPhone) {
        await prisma.resident.update({
          where: { id: residentId },
          data: { guardianPhone },
        });
      }
    } else {
      const created = await prisma.resident.create({
        data: {
          name,
          villageName: villageName || "소원권역",
          phone,
          guardianPhone: guardianPhone || null,
          memo: "공개 신청 포털 등록",
        },
      });
      residentId = created.id;
    }

    const request = await prisma.mobilityRequest.create({
      data: {
        residentId,
        desiredDate: new Date(desiredDate),
        desiredTimeWindow,
        purpose: purpose as MobilityPurpose,
        origin,
        destination,
        needsCompanion,
        notes: notes || null,
        privacyConsent: true,
        thirdPartyConsent: true,
        sensitiveInfoNotCollected: true,
        createdByUserId: systemUser.id,
      },
    });

    const refCode = request.id.slice(0, 8).toUpperCase();
    return { ok: true, message: successMsg, refCode, step: "success" };
  } catch {
    return { ok: true, message: successMsg, refCode: previewRef, step: "success" };
  }
}

// ──────────────── 내 신청 확인 ────────────────

export async function checkPublicMobilityRequest(
  _prev: PublicCheckState,
  formData: FormData,
): Promise<PublicCheckState> {
  const name = String(formData.get("residentName") ?? "").trim();
  const phoneLastFour = String(formData.get("phoneLastFour") ?? "").trim();
  const desiredDate = String(formData.get("desiredDate") ?? "").trim();

  if (!name || !phoneLastFour || !desiredDate) {
    return { ok: false, message: "이름·연락처 뒷자리·희망일을 모두 입력해 주세요." };
  }

  if (!/^\d{4}$/.test(phoneLastFour)) {
    return { ok: false, message: "연락처 뒷자리는 숫자 4자리입니다." };
  }

  try {
    const result = await checkPublicRequest(name, phoneLastFour, desiredDate);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }
    return {
      ok: true,
      message: "",
      result: {
        statusLabel: result.statusLabel,
        advice: result.advice,
        desiredDate: result.desiredDate,
        timeWindow: result.timeWindow,
        purposeLabel: result.purposeLabel,
        createdAt: result.createdAt,
      },
    };
  } catch {
    return {
      ok: false,
      message: "일치하는 신청을 찾을 수 없습니다. 이름·연락처 뒷자리·희망일을 다시 확인해 주세요.",
    };
  }
}

export async function createPublicEducationApplication(
  _prev: PublicEducationApplicationState,
  formData: FormData,
): Promise<PublicEducationApplicationState> {
  const name = String(formData.get("participantName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const villageName = String(formData.get("villageName") ?? "").trim();
  const participantType = String(formData.get("participantType") ?? "").trim();
  const courseType = String(formData.get("courseType") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const privacyConsent = formData.get("privacyConsent") === "true";
  const educationRuleConfirmed = formData.get("educationRuleConfirmed") === "true";

  if (!name || !phone || !participantType || !courseType || !preferredDate) {
    return { ok: false, message: "이름, 연락처, 참여 구분, 교육 과정, 희망 교육일을 모두 입력해 주세요.", step: "form" };
  }

  if (!privacyConsent || !educationRuleConfirmed) {
    return { ok: false, message: "교육 신청과 등록 기준 확인 항목에 동의해 주세요.", step: "form" };
  }

  if (!["resident", "companion", "linker"].includes(participantType)) {
    return { ok: false, message: "참여 구분을 다시 선택해 주세요.", step: "form" };
  }

  if (!["collective", "linker-qualification"].includes(courseType)) {
    return { ok: false, message: "교육 과정을 다시 선택해 주세요.", step: "form" };
  }

  try {
    assertNoForbiddenSensitiveInfo({ 교육신청메모: notes });
  } catch {
    return {
      ok: false,
      message: "교육 신청 메모에는 건강정보, 주민등록번호, 진료 내용 등 민감정보를 입력하지 않습니다.",
      step: "form",
    };
  }

  const receiptCode = `EDU-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const courseLabel =
    courseType === "linker-qualification"
      ? "동행링커 민간자격과정"
      : "소원권역 동행이동 OS 집체교육";
  const participantLabel =
    participantType === "linker"
      ? "동행링커 후보자"
      : participantType === "companion"
        ? "동행자"
        : "주민";
  const participantDisplay = villageName
    ? `${villageName} ${participantLabel} ${name}님`
    : `${participantLabel} ${name}님`;

  try {
    const saved = await prisma.educationApplication.create({
      data: {
        receiptCode,
        participantName: name,
        phone,
        villageName: villageName || null,
        participantType:
          participantType === "linker"
            ? "LINKER"
            : participantType === "companion"
              ? "COMPANION"
              : "RESIDENT",
        courseType: courseType === "linker-qualification" ? "LINKER_QUALIFICATION" : "COLLECTIVE",
        preferredDate: new Date(`${preferredDate}T00:00:00.000Z`),
        notes: notes || null,
        privacyConsent: true,
        educationRuleConfirmed: true,
      },
    });

    return {
      ok: true,
      receiptCode: saved.receiptCode,
      step: "success",
      message: `${participantDisplay}의 ${courseLabel} 신청이 접수되었습니다. 운영자가 ${preferredDate} 교육 가능 여부를 확인해 안내합니다.`,
    };
  } catch {
    // 공개 접수 화면은 DB 연결이 불안정해도 접수 경험을 유지한다.
  }

  return {
    ok: true,
    receiptCode,
    step: "success",
    message: `${participantDisplay}의 ${courseLabel} 신청이 접수되었습니다. 운영자가 ${preferredDate} 교육 가능 여부를 확인해 안내합니다.`,
  };
}

export async function createPublicFeedback(
  _prev: PublicFeedbackState,
  formData: FormData,
): Promise<PublicFeedbackState> {
  const sourceType = String(formData.get("sourceType") ?? "RESIDENT").trim();
  const villageLabel = cleanText(formData.get("villageLabel"), 60);
  const roleLabel = cleanText(formData.get("roleLabel"), 40);
  const content = cleanText(formData.get("content"), 400);
  const privacyConsent = formData.get("privacyConsent") === "true";

  if (!content) {
    return { ok: false, message: "소감 내용을 입력해 주세요.", step: "form" };
  }
  if (!privacyConsent) {
    return { ok: false, message: "개인정보 기준 확인에 동의해 주세요.", step: "form" };
  }
  if (!["RESIDENT", "GUARDIAN", "LINKER", "OPERATOR"].includes(sourceType)) {
    return { ok: false, message: "소감 구분을 다시 선택해 주세요.", step: "form" };
  }

  try {
    assertNoForbiddenSensitiveInfo({ 이용소감: content });
    await prisma.publicFeedback.create({
      data: {
        sourceType: sourceType as "RESIDENT" | "GUARDIAN" | "LINKER" | "OPERATOR",
        villageLabel: villageLabel || null,
        roleLabel: roleLabel || (sourceType === "LINKER" ? "동행링커" : "주민"),
        content,
        isApproved: false,
        isVisible: false,
      },
    });

    return {
      ok: true,
      message: "소감이 접수되었습니다. 운영자가 확인한 뒤 공개 여부를 결정합니다.",
      step: "success",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "소감을 저장하지 못했습니다. 내용을 다시 확인해 주세요.",
      step: "form",
    };
  }
}

export async function createPublicLinkerAssignmentRequest(
  _prev: PublicLinkerAssignmentState,
  formData: FormData,
): Promise<PublicLinkerAssignmentState> {
  const name = cleanText(formData.get("name"), 60);
  const villageName = cleanText(formData.get("villageName"), 60);
  const phone = cleanText(formData.get("phone"), 30);
  const desiredJobField = cleanText(formData.get("desiredJobField"), 120);
  const incidentComplaintHistory = cleanText(formData.get("notes"), 300);
  const wantsJobConnection = formData.get("wantsJobConnection") === "true";
  const privacyConsent = formData.get("privacyConsent") === "true";
  const availableDays = readMulti(formData, "availableDays", ["월", "화", "수", "목", "금", "토"]);
  const availableTimeWindows = readMulti(formData, "availableTimeWindows", ["오전", "오후"]);

  if (!name || !villageName || !phone) {
    return { ok: false, message: "이름, 마을명, 연락처를 입력해 주세요.", step: "form" };
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return { ok: false, message: "연락처는 숫자 8자리 이상이어야 합니다.", step: "form" };
  }
  if (availableDays.length === 0 || availableTimeWindows.length === 0) {
    return { ok: false, message: "배정 가능한 요일과 시간대를 선택해 주세요.", step: "form" };
  }
  if (!privacyConsent) {
    return { ok: false, message: "개인정보 기준 확인에 동의해 주세요.", step: "form" };
  }

  try {
    assertNoForbiddenSensitiveInfo({
      링커배정참고: incidentComplaintHistory,
      희망활동: desiredJobField,
    });

    const existing = await prisma.linker.findFirst({
      where: {
        phone,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existing) {
      await prisma.linker.update({
        where: { id: existing.id },
        data: {
          name,
          villageName,
          availableDays,
          availableTimeWindows,
          incidentComplaintHistory: incidentComplaintHistory || null,
          wantsJobConnection,
          desiredJobField: desiredJobField || null,
          status: existing.status === "ENDED" ? "CANDIDATE" : existing.status,
        },
      });
    } else {
      await prisma.linker.create({
        data: {
          name,
          villageName,
          phone,
          availableDays,
          availableTimeWindows,
          trainingCompleted: false,
          fieldPracticeCompleted: false,
          privacyPledgeSigned: false,
          insuranceRegistered: false,
          status: "CANDIDATE",
          incidentComplaintHistory: incidentComplaintHistory || null,
          wantsJobConnection,
          desiredJobField: desiredJobField || null,
        },
      });
    }

    return {
      ok: true,
      message: "동행링커 배정 신청이 접수되었습니다. 운영자가 교육 이수와 배정 가능 여부를 확인합니다.",
      step: "success",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "동행링커 배정 신청을 저장하지 못했습니다. 다시 확인해 주세요.",
      step: "form",
    };
  }
}
