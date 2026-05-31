"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/server/auth/guard";
import { saveCommunityFundRecord } from "@/server/funds/community-fund-service";
import {
  recordSettlementCsvPreparation,
  saveSettlement,
} from "@/server/settlements/settlement-service";

export type SettlementFormState = {
  ok: boolean;
  message: string;
};

function checked(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

export async function settlementAction(
  _previousState: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  try {
    const user = await requireCurrentUser();
    const intent = String(formData.get("intent") ?? "");

    if (intent === "saveSettlement") {
      await saveSettlement(user, {
        groupId: String(formData.get("groupId") ?? ""),
        settlementMode: String(formData.get("settlementMode") ?? ""),
        roundingPolicy: String(formData.get("roundingPolicy") ?? ""),
        totalFare: String(formData.get("totalFare") ?? ""),
        residentCount: String(formData.get("residentCount") ?? ""),
        communityFundSupportAmount: String(formData.get("communityFundSupportAmount") ?? ""),
        customResidentTotalShare: String(formData.get("customResidentTotalShare") ?? ""),
        linkerActivityFee: String(formData.get("linkerActivityFee") ?? ""),
        receiptUrl: String(formData.get("receiptUrl") ?? ""),
        isSettled: checked(formData, "isSettled"),
        updatedReason: String(formData.get("updatedReason") ?? ""),
      });
      revalidatePath("/admin/settlements");
      revalidatePath("/");
      revalidatePath("/admin");
      return {
        ok: true,
        message: "정산 정보를 저장했습니다.",
      };
    }

    if (intent === "saveCommunityFund") {
      await saveCommunityFundRecord(user, {
        id: String(formData.get("communityFundId") ?? ""),
        month: String(formData.get("month") ?? ""),
        fundType: String(formData.get("fundType") ?? ""),
        groupId: String(formData.get("groupId") ?? ""),
        amount: String(formData.get("amount") ?? ""),
        source: String(formData.get("source") ?? ""),
        note: String(formData.get("note") ?? ""),
      });
      revalidatePath("/admin/settlements");
      revalidatePath("/admin/reports");
      return {
        ok: true,
        message: "상생기금 기록을 저장했습니다.",
      };
    }

    if (intent === "prepareCsv") {
      await recordSettlementCsvPreparation(user, {
        month: String(formData.get("month") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      });
      return {
        ok: true,
        message: "CSV 준비 기준과 사유를 AuditLog에 기록했습니다.",
      };
    }

    throw new Error("처리할 작업을 찾을 수 없습니다.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "저장하지 못했습니다. 다시 확인해 주세요.",
    };
  }
}
