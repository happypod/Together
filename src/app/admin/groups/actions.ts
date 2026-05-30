"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/guard";
import {
  addMemberToGroup,
  createMobilityGroup,
  removeMemberFromGroup,
  transitionGroupStatus,
  updatePickupOrder,
} from "@/server/groups/mobility-group-service";

export type GroupOperationFormState = {
  ok: boolean;
  message: string;
};

export async function groupOperationAction(
  _previousState: GroupOperationFormState,
  formData: FormData,
): Promise<GroupOperationFormState> {
  try {
    const user = await requirePermission("group:write");
    const intent = String(formData.get("intent") ?? "");

    if (intent === "createGroup") {
      await createMobilityGroup(user, {
        requestIds: formData.getAll("requestIds").map(String),
        destinationSummary: String(formData.get("destinationSummary") ?? ""),
        returnEta: String(formData.get("returnEta") ?? ""),
        notes: String(formData.get("notes") ?? ""),
      });
    } else if (intent === "addMember") {
      await addMemberToGroup(user, {
        groupId: String(formData.get("groupId") ?? ""),
        requestId: String(formData.get("requestId") ?? ""),
        pickupPlace: String(formData.get("pickupPlace") ?? ""),
        pickupEta: String(formData.get("pickupEta") ?? ""),
      });
    } else if (intent === "removeMember") {
      await removeMemberFromGroup(
        user,
        String(formData.get("groupId") ?? ""),
        String(formData.get("memberId") ?? ""),
      );
    } else if (intent === "updatePickup") {
      await updatePickupOrder(user, {
        groupId: String(formData.get("groupId") ?? ""),
        memberId: String(formData.get("memberId") ?? ""),
        pickupOrder: Number(formData.get("pickupOrder") ?? 0),
        pickupPlace: String(formData.get("pickupPlace") ?? ""),
        pickupEta: String(formData.get("pickupEta") ?? ""),
      });
    } else if (intent === "transitionStatus") {
      await transitionGroupStatus(user, {
        groupId: String(formData.get("groupId") ?? ""),
        nextStatus: String(formData.get("nextStatus") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      });
    } else {
      throw new Error("처리할 작업을 찾을 수 없습니다.");
    }

    revalidatePath("/admin/groups");
    return {
      ok: true,
      message: "공동예약 정보를 저장했습니다.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
