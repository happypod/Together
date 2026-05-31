"use server";

import { revalidatePath } from "next/cache";
import { type MobileTokenScope } from "@prisma/client";
import { hasPermission } from "@/domain/auth/permissions";
import { requireCurrentUser } from "@/server/auth/guard";
import { createMobileFormToken } from "@/server/mobile-forms/token-service";
import { createIncidentReport } from "@/server/incidents/incident-report-service";
import { DEFAULT_OPERATING_SETTINGS } from "@/server/settings/defaults";
import {
  parseParticipantSurveyForm,
  submitParticipantSurvey,
} from "@/server/surveys/satisfaction-survey-service";
import {
  assignLinkerToGroup,
  confirmReturn,
  confirmTaxiReservation,
  createLinker,
  requestTaxiReservation,
  updateLinkerStatus,
  updateTripStatus,
} from "@/server/trips/trip-operation-service";

export type TripOperationFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

const issueableMobileScopes = [
  "TRIP_CHECK",
  "RETURN_CONFIRM",
  "SURVEY_SUBMIT",
  "TAXI_CONFIRM",
] as const satisfies readonly MobileTokenScope[];

const mobileScopeLabels: Record<(typeof issueableMobileScopes)[number], string> = {
  TRIP_CHECK: "운행 체크",
  RETURN_CONFIRM: "귀가 확인",
  SURVEY_SUBMIT: "만족도 입력",
  TAXI_CONFIRM: "택시 예약 확정",
};

function parseIssueableMobileScope(value: FormDataEntryValue | null) {
  const scope = String(value ?? "") as (typeof issueableMobileScopes)[number];
  if (!issueableMobileScopes.includes(scope)) {
    throw new Error("발급할 모바일 링크 종류를 다시 선택해 주세요.");
  }
  return scope;
}

export async function tripOperationAction(
  _previousState: TripOperationFormState,
  formData: FormData,
): Promise<TripOperationFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");
    let successMessage = "운행 정보를 저장했습니다.";

    if (intent === "issueMobileLink" || intent === "issueSurveyLink") {
      if (!hasPermission(user, "mobile-token:write")) {
        throw new Error("모바일 입력 링크를 발급할 권한이 없습니다.");
      }
      const groupId = String(formData.get("groupId") ?? "");
      if (!groupId) {
        throw new Error("대상 운행을 찾을 수 없습니다.");
      }
      const scope =
        intent === "issueSurveyLink"
          ? "SURVEY_SUBMIT"
          : parseIssueableMobileScope(formData.get("scope"));
      const ttlHours = DEFAULT_OPERATING_SETTINGS.mobileTokenTtlHours;
      const { rawToken } = await createMobileFormToken({
        createdByUserId: user.id,
        scope,
        targetType: "MobilityGroup",
        targetId: groupId,
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
        maxUseCount: scope === "SURVEY_SUBMIT" ? 5 : 1,
      });
      revalidatePath("/admin/trips");
      return {
        ok: true,
        message: `${mobileScopeLabels[scope]} 링크를 만들었습니다: /m/${rawToken} · ${ttlHours}시간 동안 ${
          scope === "SURVEY_SUBMIT" ? "최대 5회" : "1회"
        } 입력 가능합니다.`,
      };
    }

    if (intent === "submitSurvey") {
      await submitParticipantSurvey(user, parseParticipantSurveyForm(formData));
      successMessage = "참여자 만족도를 저장했습니다.";
    } else if (intent === "createLinker") {
      await createLinker(user, {
        name: String(formData.get("name") ?? ""),
        villageName: String(formData.get("villageName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        availableDays: formData.getAll("availableDays").map(String),
        availableTimeWindows: formData.getAll("availableTimeWindows").map(String),
        trainingCompleted: checked(formData, "trainingCompleted"),
        fieldPracticeCompleted: checked(formData, "fieldPracticeCompleted"),
        privacyPledgeSigned: checked(formData, "privacyPledgeSigned"),
        insuranceRegistered: checked(formData, "insuranceRegistered"),
        status: String(formData.get("status") ?? ""),
        incidentComplaintHistory: String(formData.get("incidentComplaintHistory") ?? ""),
        wantsJobConnection: checked(formData, "wantsJobConnection"),
        desiredJobField: String(formData.get("desiredJobField") ?? ""),
      });
    } else if (intent === "updateLinkerStatus") {
      await updateLinkerStatus(user, {
        linkerId: String(formData.get("linkerId") ?? ""),
        status: String(formData.get("status") ?? ""),
      });
    } else if (intent === "assignLinker") {
      await assignLinkerToGroup(user, {
        groupId: String(formData.get("groupId") ?? ""),
        linkerId: String(formData.get("linkerId") ?? ""),
      });
    } else if (intent === "requestTaxi") {
      await requestTaxiReservation(user, {
        groupId: String(formData.get("groupId") ?? ""),
        partnerManagerName: String(formData.get("partnerManagerName") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
    } else if (intent === "confirmTaxi") {
      await confirmTaxiReservation(user, {
        groupId: String(formData.get("groupId") ?? ""),
        reservationConfirmed: true,
        confirmedAt: String(formData.get("confirmedAt") ?? ""),
        partnerManagerName: String(formData.get("partnerManagerName") ?? ""),
        vehicleNumber: String(formData.get("vehicleNumber") ?? ""),
        driverPhone: String(formData.get("driverPhone") ?? ""),
        expectedFare: String(formData.get("expectedFare") ?? ""),
        actualFare: String(formData.get("actualFare") ?? ""),
        receiptAttached: checked(formData, "receiptAttached"),
        receiptUrl: String(formData.get("receiptUrl") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
    } else if (intent === "updateTripStatus") {
      await updateTripStatus(user, {
        groupId: String(formData.get("groupId") ?? ""),
        step: String(formData.get("step") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
    } else if (intent === "confirmReturn") {
      await confirmReturn(user, {
        groupId: String(formData.get("groupId") ?? ""),
        memberId: String(formData.get("memberId") ?? ""),
        confirmAll: checked(formData, "confirmAll"),
        notes: String(formData.get("notes") ?? ""),
      });
    } else if (intent === "createIncidentReport") {
      await createIncidentReport(user, {
        groupId: String(formData.get("groupId") ?? ""),
        incidentType: String(formData.get("incidentType") ?? ""),
        occurredAt: String(formData.get("occurredAt") ?? ""),
        description: String(formData.get("description") ?? ""),
        actionTaken: String(formData.get("actionTaken") ?? ""),
      });
      successMessage = "사고·민원 기록을 저장했습니다.";
    } else {
      throw new Error("처리할 작업을 찾을 수 없습니다.");
    }

    revalidatePath("/admin/trips");
    revalidatePath("/admin/groups");
    return {
      ok: true,
      message: successMessage,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
