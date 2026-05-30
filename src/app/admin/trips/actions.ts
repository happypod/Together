"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
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

export async function tripOperationAction(
  _previousState: TripOperationFormState,
  formData: FormData,
): Promise<TripOperationFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "createLinker") {
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
    } else {
      throw new Error("처리할 작업을 찾을 수 없습니다.");
    }

    revalidatePath("/admin/trips");
    revalidatePath("/admin/groups");
    return {
      ok: true,
      message: "운행 정보를 저장했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
