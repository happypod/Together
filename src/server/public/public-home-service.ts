import { type MobilityStatus, MOBILITY_PURPOSE_LABELS } from "@/domain/definitions";
import { getKoreaTodayRange, getKoreaWeekRange } from "@/domain/korea-date";
import { prisma } from "@/server/db/prisma";

/** 사용자에게 보이는 상태 문구 — 작업지시서 §12 매핑 */
export const PUBLIC_STATUS_LABELS: Record<MobilityStatus, string> = {
  REQUESTED: "신청접수",
  RECRUITING: "함께 이동할 주민 모집 중",
  GROUP_READY: "공동예약 그룹 확정",
  LINKER_RECRUITING: "동행링커 확인 중",
  LINKER_ASSIGNED: "동행링커 배정 완료",
  TAXI_REQUESTED: "택시연합 예약확인 중",
  TAXI_CONFIRMED: "이동 일정 확정",
  IN_PROGRESS: "이동 진행 중",
  RETURN_CONFIRMED: "귀가확인 완료",
  SETTLED: "정산 기록 완료",
  REPORTED: "운영보고 반영 완료",
  CANCELED_BY_RESIDENT: "신청자 취소",
  CANCELED_BY_OPERATOR: "운영자 취소",
  CANCELED_BY_TAXI: "택시연합 사정으로 취소",
  CANCELED_BY_WEATHER: "기상 사정으로 취소",
  CANCELED_BY_OTHER: "기타 사유로 취소",
  INCIDENT_REPORTED: "특이사항 접수",
  COMPLAINT_REPORTED: "민원 접수",
  NO_SHOW: "미탑승 처리",
  PARTIAL_COMPLETED: "부분 완료",
};

/** 상태별 안내 문구 */
export const PUBLIC_STATUS_ADVICE: Partial<Record<MobilityStatus, string>> = {
  REQUESTED: "신청이 접수되었습니다. 운영자가 내용을 확인 중입니다.",
  RECRUITING: "같은 날짜와 방향의 함께 이동할 주민을 모집 중입니다.",
  GROUP_READY: "공동예약 그룹이 확정되었습니다.",
  LINKER_RECRUITING: "동행링커를 확인 중입니다.",
  LINKER_ASSIGNED: "동행링커가 배정되었습니다.",
  TAXI_REQUESTED: "택시연합에 예약확인을 요청했습니다.",
  TAXI_CONFIRMED: "이동 일정이 확정되었습니다. 이동 당일 동행링커와 함께합니다.",
  IN_PROGRESS: "생활이동이 진행 중입니다.",
  RETURN_CONFIRMED: "귀가확인이 완료되었습니다.",
  SETTLED: "정산 기록이 완료되었습니다.",
  REPORTED: "운영보고에 반영되었습니다.",
  CANCELED_BY_RESIDENT: "신청 또는 일정이 취소되었습니다.",
  CANCELED_BY_OPERATOR: "운영자에 의해 취소되었습니다.",
  CANCELED_BY_TAXI: "택시연합 사정으로 취소되었습니다. 운영자에게 문의해 주세요.",
  CANCELED_BY_WEATHER: "기상 사정으로 일정이 조정되었습니다.",
  CANCELED_BY_OTHER: "기타 사유로 취소되었습니다. 운영자에게 문의해 주세요.",
};

/** 오늘의 운영 요약 */
export type PublicOperationSummary = {
  todayGroupCount: number;
  weekRecruitingCount: number;
  confirmedGroupCount: number;
  linkerAssignedCount: number;
  taxiPendingCount: number;
};

/** 공개 모집현황 행 (개인정보 없음) */
export type PublicRecruitmentRow = {
  id: string;
  serviceDate: string;
  timeWindow: string;
  directionLabel: string;
  purposeLabel: string;
  recruitmentStatusLabel: string;
  status: MobilityStatus;
  memberCount: number;
  canApply: boolean;
};

/** 공개 공지 */
export type PublicNoticeItem = {
  id: string;
  title: string;
  content: string;
  noticeType: string;
  isPinned: boolean;
  createdAt: string;
};

/** 공개 이용 소감 */
export type PublicFeedbackItem = {
  id: string;
  villageLabel: string;
  roleLabel: string;
  content: string;
};

// ──────────────── 미리보기 데이터 ────────────────

export const previewOperationSummary: PublicOperationSummary = {
  todayGroupCount: 2,
  weekRecruitingCount: 4,
  confirmedGroupCount: 1,
  linkerAssignedCount: 3,
  taxiPendingCount: 2,
};

export const previewRecruitmentRows: PublicRecruitmentRow[] = [
  {
    id: "prev-1",
    serviceDate: "2026-06-03",
    timeWindow: "오전",
    directionLabel: "소원권역 → 태안읍",
    purposeLabel: "병원·약국",
    recruitmentStatusLabel: "1명 신청 중",
    status: "RECRUITING",
    memberCount: 1,
    canApply: true,
  },
  {
    id: "prev-2",
    serviceDate: "2026-06-05",
    timeWindow: "오후",
    directionLabel: "소원권역 → 태안읍",
    purposeLabel: "장보기",
    recruitmentStatusLabel: "2명 신청 중",
    status: "RECRUITING",
    memberCount: 2,
    canApply: true,
  },
  {
    id: "prev-3",
    serviceDate: "2026-06-07",
    timeWindow: "오전",
    directionLabel: "소원권역 → 태안읍",
    purposeLabel: "공공기관",
    recruitmentStatusLabel: "접수 가능",
    status: "RECRUITING",
    memberCount: 0,
    canApply: true,
  },
];

export const previewNotices: PublicNoticeItem[] = [
  {
    id: "notice-1",
    title: "6월 병원·약국 이동 신청을 접수 중입니다",
    content: "이번 주 태안읍 방면 생활이동 신청을 받고 있습니다. 운영자에게 문의해 주세요.",
    noticeType: "OPERATION",
    isPinned: true,
    createdAt: "2026-06-01",
  },
  {
    id: "notice-2",
    title: "장날에는 신청이 조기 마감될 수 있습니다",
    content: "장날(매월 3·8일) 에는 신청이 일찍 마감될 수 있으니 미리 신청해 주세요.",
    noticeType: "GENERAL",
    isPinned: false,
    createdAt: "2026-05-28",
  },
  {
    id: "notice-3",
    title: "우천·기상악화 시 일정이 조정될 수 있습니다",
    content: "기상 사정에 따라 이동 일정이 변경되거나 취소될 수 있습니다. 운영자에게 확인해 주세요.",
    noticeType: "SAFETY",
    isPinned: false,
    createdAt: "2026-05-25",
  },
  {
    id: "notice-4",
    title: "개인정보 수집·이용 안내",
    content: "병명, 진료 내용, 주민등록번호는 수집하지 않습니다. 보호자 연락처 입력을 권장합니다.",
    noticeType: "PRIVACY",
    isPinned: false,
    createdAt: "2026-05-20",
  },
];

export const previewFeedbacks: PublicFeedbackItem[] = [
  {
    id: "fb-1",
    villageLabel: "의항1리",
    roleLabel: "주민",
    content: "혼자 이동하기 어려웠는데 동행링커가 함께해줘서 안심이 됐습니다.",
  },
  {
    id: "fb-2",
    villageLabel: "모항3리",
    roleLabel: "보호자",
    content: "이동 후 귀가확인까지 안내받을 수 있어 좋았습니다.",
  },
  {
    id: "fb-3",
    villageLabel: "소원권역",
    roleLabel: "동행링커 참여자",
    content: "주민 이동을 돕는 과정에서 지역 내 필요한 서비스를 더 잘 알게 되었습니다.",
  },
];

// ──────────────── DB 조회 함수 ────────────────

function weekRange() {
  return getKoreaWeekRange();
}

function todayRange() {
  return getKoreaTodayRange();
}

export async function getPublicOperationSummary(): Promise<PublicOperationSummary> {
  const today = todayRange();
  const week = weekRange();

  const [todayGroups, weekGroups] = await Promise.all([
    prisma.mobilityGroup.count({
      where: { serviceDate: { gte: today.from, lte: today.to }, deletedAt: null },
    }),
    prisma.mobilityGroup.findMany({
      where: { serviceDate: { gte: week.from, lte: week.to }, deletedAt: null },
      select: { status: true },
    }),
  ]);

  return {
    todayGroupCount: todayGroups,
    weekRecruitingCount: weekGroups.filter((g) => g.status === "RECRUITING").length,
    confirmedGroupCount: weekGroups.filter((g) =>
      ["GROUP_READY", "LINKER_ASSIGNED", "LINKER_RECRUITING"].includes(g.status),
    ).length,
    linkerAssignedCount: weekGroups.filter((g) => g.status === "LINKER_ASSIGNED").length,
    taxiPendingCount: weekGroups.filter((g) =>
      ["TAXI_REQUESTED", "TAXI_CONFIRMED"].includes(g.status),
    ).length,
  };
}

export async function getPublicRecruitmentSchedules(
  limit = 8,
): Promise<PublicRecruitmentRow[]> {
  const week = weekRange();

  const groups = await prisma.mobilityGroup.findMany({
    where: {
      serviceDate: { gte: week.from, lte: week.to },
      deletedAt: null,
      status: { in: ["RECRUITING", "GROUP_READY", "LINKER_RECRUITING", "LINKER_ASSIGNED"] },
    },
    include: {
      members: { select: { memberStatus: true, request: { select: { purpose: true } } } },
    },
    orderBy: [{ serviceDate: "asc" }, { timeWindow: "asc" }],
    take: limit,
  });

  return groups.map((g) => {
    const activeMembers = g.members.filter((m) => m.memberStatus === "ACTIVE");
    const purposes = activeMembers.map((m) => m.request.purpose);
    const purposeLabel =
      purposes.length > 0
        ? [...new Set(purposes)].map((p) => MOBILITY_PURPOSE_LABELS[p]).join("·")
        : "생활이동";

    let recruitmentStatusLabel = "접수 가능";
    if (activeMembers.length >= 3) {
      recruitmentStatusLabel = "공동예약 그룹 확정";
    } else if (activeMembers.length > 0) {
      recruitmentStatusLabel = `${activeMembers.length}명 신청 중`;
    }

    const dateObj = new Date(g.serviceDate);
    const month = dateObj.getMonth() + 1;
    const date = dateObj.getDate();

    return {
      id: g.id,
      serviceDate: `${month}월 ${date}일`,
      timeWindow: g.timeWindow,
      directionLabel: `소원권역 → ${g.destinationSummary}`,
      purposeLabel,
      recruitmentStatusLabel,
      status: g.status,
      memberCount: activeMembers.length,
      canApply: activeMembers.length < 3 && g.status === "RECRUITING",
    };
  });
}

export async function getPublicNotices(): Promise<PublicNoticeItem[]> {
  const now = new Date();
  const notices = await prisma.notice.findMany({
    where: {
      isVisible: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      title: true,
      content: true,
      noticeType: true,
      isPinned: true,
      createdAt: true,
    },
  });

  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    noticeType: n.noticeType,
    isPinned: n.isPinned,
    createdAt: n.createdAt.toISOString().slice(0, 10),
  }));
}

export async function getPublicFeedbacks(): Promise<PublicFeedbackItem[]> {
  const feedbacks = await prisma.publicFeedback.findMany({
    where: { isApproved: true, isVisible: true },
    orderBy: { approvedAt: "desc" },
    take: 4,
    select: { id: true, villageLabel: true, roleLabel: true, content: true },
  });

  return feedbacks.map((f) => ({
    id: f.id,
    villageLabel: f.villageLabel ?? "소원권역",
    roleLabel: f.roleLabel ?? "주민",
    content: f.content,
  }));
}

export type PublicRequestCheckResult =
  | { ok: false; message: string }
  | {
      ok: true;
      statusLabel: string;
      advice: string;
      desiredDate: string;
      timeWindow: string;
      purposeLabel: string;
      createdAt: string;
    };

export async function checkPublicRequest(
  residentName: string,
  phoneLastFour: string,
  desiredDate: string,
): Promise<PublicRequestCheckResult> {
  if (!residentName || phoneLastFour.length !== 4 || !desiredDate) {
    return { ok: false, message: "이름, 연락처 뒷자리 4자리, 희망일을 모두 입력해 주세요." };
  }

  const request = await prisma.mobilityRequest.findFirst({
    where: {
      deletedAt: null,
      desiredDate: new Date(desiredDate),
      resident: {
        name: residentName,
        phone: { endsWith: phoneLastFour },
        deletedAt: null,
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      desiredDate: true,
      desiredTimeWindow: true,
      purpose: true,
      createdAt: true,
    },
  });

  if (!request) {
    return {
      ok: false,
      message: "일치하는 신청을 찾을 수 없습니다. 이름·연락처 뒷자리·희망일을 다시 확인해 주세요.",
    };
  }

  const status = request.status;
  const dateObj = new Date(request.desiredDate);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

  return {
    ok: true,
    statusLabel: PUBLIC_STATUS_LABELS[status] ?? status,
    advice:
      PUBLIC_STATUS_ADVICE[status] ?? "운영자에게 문의해 주세요.",
    desiredDate: dateLabel,
    timeWindow: request.desiredTimeWindow,
    purposeLabel: MOBILITY_PURPOSE_LABELS[request.purpose],
    createdAt: request.createdAt.toISOString().slice(0, 10),
  };
}
