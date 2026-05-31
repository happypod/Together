import {
  type EducationApplicationStatus,
  type NoticeType,
  type Prisma,
} from "@prisma/client";
import {
  assertPermission,
  AuthorizationError,
  hasPermission,
  type AuthUser,
} from "@/domain/auth/permissions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import {
  listEducationSchedulesAdminRows,
  previewEducationScheduleAdminRows,
  type EducationScheduleAdminRow,
} from "@/server/public/education-schedule-service";

export const NOTICE_TYPE_OPTIONS = [
  { value: "GENERAL", label: "일반 공지" },
  { value: "OPERATION", label: "운영 안내" },
  { value: "SAFETY", label: "안전 안내" },
  { value: "PRIVACY", label: "개인정보 안내" },
] as const satisfies readonly { value: NoticeType; label: string }[];

export const EDUCATION_STATUS_OPTIONS = [
  { value: "RECEIVED", label: "접수" },
  { value: "CONFIRMED", label: "확정" },
  { value: "COMPLETED", label: "이수" },
  { value: "CANCELED", label: "취소" },
] as const satisfies readonly { value: EducationApplicationStatus; label: string }[];

const PARTICIPANT_LABELS = {
  RESIDENT: "주민",
  COMPANION: "동행자",
  LINKER: "동행링커 후보자",
} as const;

const COURSE_LABELS = {
  COLLECTIVE: "집체교육",
  LINKER_QUALIFICATION: "민간자격과정",
} as const;

export type PublicContentNoticeRow = {
  id: string;
  title: string;
  content: string;
  noticeType: NoticeType;
  noticeTypeLabel: string;
  isPinned: boolean;
  isVisible: boolean;
  startDate: string;
  endDate: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type EducationApplicationRow = {
  id: string;
  receiptCode: string;
  participantName: string;
  phoneMasked: string;
  villageName: string;
  participantTypeLabel: string;
  courseTypeLabel: string;
  preferredDate: string;
  notes: string;
  status: EducationApplicationStatus;
  statusLabel: string;
  operatorMemo: string;
  handledByName: string;
  handledAt: string;
  createdAt: string;
};

export type PublicContentAdminView = {
  canManageNotices: boolean;
  canManageEducation: boolean;
  notices: PublicContentNoticeRow[];
  educationApplications: EducationApplicationRow[];
  summary: {
    noticeCount: number;
    visibleNoticeCount: number;
    pinnedNoticeCount: number;
    educationReceivedCount: number;
    educationConfirmedCount: number;
    educationCompletedCount: number;
  };
};

export type NoticeAdminView = {
  canManageNotices: boolean;
  notices: PublicContentNoticeRow[];
  summary: {
    noticeCount: number;
    visibleNoticeCount: number;
    pinnedNoticeCount: number;
  };
};

export type EducationApplicationsAdminView = {
  canManageEducation: boolean;
  educationSchedules: EducationScheduleAdminRow[];
  educationApplications: EducationApplicationRow[];
  summary: {
    educationScheduleCount: number;
    educationScheduleVisibleCount: number;
    educationReceivedCount: number;
    educationConfirmedCount: number;
    educationCompletedCount: number;
    educationCanceledCount: number;
  };
};

export type NoticeInput = {
  id?: string | null;
  title?: string | null;
  content?: string | null;
  noticeType?: string | null;
  isPinned?: boolean;
  isVisible?: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

export type EducationApplicationUpdateInput = {
  id?: string | null;
  status?: string | null;
  operatorMemo?: string | null;
};

type NoticeWithCreator = Prisma.NoticeGetPayload<{
  include: {
    createdBy: {
      select: {
        name: true;
      };
    };
  };
}>;

type EducationApplicationWithHandler = Prisma.EducationApplicationGetPayload<{
  include: {
    handledBy: {
      select: {
        name: true;
      };
    };
  };
}>;

function canReadPublicContent(user: AuthUser | null | undefined) {
  return hasPermission(user, "setting:manage") || hasPermission(user, "request:read");
}

export function canManagePublicNotices(user: AuthUser | null | undefined) {
  return hasPermission(user, "setting:manage");
}

export function canManageEducationApplications(user: AuthUser | null | undefined) {
  return hasPermission(user, "setting:manage") || hasPermission(user, "request:write");
}

function assertCanRead(user: AuthUser) {
  if (!canReadPublicContent(user)) {
    throw new AuthorizationError("공개 홈 관리 정보를 볼 권한이 없습니다.");
  }
}

function assertCanManageNotice(user: AuthUser) {
  assertPermission(user, "setting:manage");
  if (!["SUPER_ADMIN", "ANCHOR_ADMIN"].includes(user.role)) {
    throw new AuthorizationError("공지사항 관리는 운영 책임자 권한이 필요합니다.");
  }
}

function assertCanManageEducation(user: AuthUser) {
  if (!canManageEducationApplications(user)) {
    throw new AuthorizationError("교육 신청 상태를 변경할 권한이 없습니다.");
  }
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function optionalCleanText(value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  return text.length > 0 ? text : undefined;
}

function requireText(label: string, value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  if (!text) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return text;
}

function parseOptionalDate(label: string, value: unknown) {
  const text = optionalCleanText(value, 10);
  if (!text) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`${label}은 YYYY-MM-DD 형식이어야 합니다.`);
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label}을 다시 확인해 주세요.`);
  }
  return date;
}

function formatDateOnly(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function formatDateTime(value?: Date | null) {
  return value ? value.toLocaleString("ko-KR") : "";
}

function parseNoticeType(value: unknown): NoticeType {
  const noticeType = requireText("공지 유형", value, 30) as NoticeType;
  if (!NOTICE_TYPE_OPTIONS.some((option) => option.value === noticeType)) {
    throw new Error("공지 유형을 다시 선택해 주세요.");
  }
  return noticeType;
}

function parseEducationStatus(value: unknown): EducationApplicationStatus {
  const status = requireText("교육 신청 상태", value, 30) as EducationApplicationStatus;
  if (!EDUCATION_STATUS_OPTIONS.some((option) => option.value === status)) {
    throw new Error("교육 신청 상태를 다시 선택해 주세요.");
  }
  return status;
}

function noticeTypeLabel(value: NoticeType) {
  return NOTICE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function educationStatusLabel(value: EducationApplicationStatus) {
  return EDUCATION_STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "연락처 확인 필요";
  }
  return `***-****-${digits.slice(-4)}`;
}

function toNoticeRow(record: NoticeWithCreator): PublicContentNoticeRow {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    noticeType: record.noticeType,
    noticeTypeLabel: noticeTypeLabel(record.noticeType),
    isPinned: record.isPinned,
    isVisible: record.isVisible,
    startDate: formatDateOnly(record.startDate),
    endDate: formatDateOnly(record.endDate),
    createdByName: record.createdBy.name,
    createdAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt),
  };
}

function toEducationRow(record: EducationApplicationWithHandler): EducationApplicationRow {
  return {
    id: record.id,
    receiptCode: record.receiptCode,
    participantName: record.participantName,
    phoneMasked: maskPhone(record.phone),
    villageName: record.villageName ?? "",
    participantTypeLabel: PARTICIPANT_LABELS[record.participantType],
    courseTypeLabel: COURSE_LABELS[record.courseType],
    preferredDate: formatDateOnly(record.preferredDate),
    notes: record.notes ?? "",
    status: record.status,
    statusLabel: educationStatusLabel(record.status),
    operatorMemo: record.operatorMemo ?? "",
    handledByName: record.handledBy?.name ?? "",
    handledAt: formatDateTime(record.handledAt),
    createdAt: formatDateTime(record.createdAt),
  };
}

function noticeAuditValue(record: {
  id: string;
  title: string;
  content: string;
  noticeType: NoticeType;
  isPinned: boolean;
  isVisible: boolean;
  startDate: Date | null;
  endDate: Date | null;
}) {
  return {
    id: record.id,
    title: record.title,
    contentLength: record.content.length,
    noticeType: record.noticeType,
    isPinned: record.isPinned,
    isVisible: record.isVisible,
    startDate: formatDateOnly(record.startDate),
    endDate: formatDateOnly(record.endDate),
  };
}

export async function listPublicContentAdminView(user: AuthUser): Promise<PublicContentAdminView> {
  assertCanRead(user);

  const [notices, educationApplications] = await Promise.all([
    prisma.notice.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 40,
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.educationApplication.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 80,
      include: {
        handledBy: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const educationRows = educationApplications.map(toEducationRow);
  const noticeRows = notices.map(toNoticeRow);

  return {
    canManageNotices: canManagePublicNotices(user),
    canManageEducation: canManageEducationApplications(user),
    notices: noticeRows,
    educationApplications: educationRows,
    summary: {
      noticeCount: noticeRows.length,
      visibleNoticeCount: noticeRows.filter((notice) => notice.isVisible).length,
      pinnedNoticeCount: noticeRows.filter((notice) => notice.isPinned).length,
      educationReceivedCount: educationRows.filter((item) => item.status === "RECEIVED").length,
      educationConfirmedCount: educationRows.filter((item) => item.status === "CONFIRMED").length,
      educationCompletedCount: educationRows.filter((item) => item.status === "COMPLETED").length,
    },
  };
}

export async function listNoticeAdminView(user: AuthUser): Promise<NoticeAdminView> {
  assertCanRead(user);

  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 80,
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });
  const noticeRows = notices.map(toNoticeRow);

  return {
    canManageNotices: canManagePublicNotices(user),
    notices: noticeRows,
    summary: {
      noticeCount: noticeRows.length,
      visibleNoticeCount: noticeRows.filter((notice) => notice.isVisible).length,
      pinnedNoticeCount: noticeRows.filter((notice) => notice.isPinned).length,
    },
  };
}

export async function listEducationApplicationsAdminView(
  user: AuthUser,
): Promise<EducationApplicationsAdminView> {
  assertCanRead(user);

  const [educationApplications, educationSchedules] = await Promise.all([
    prisma.educationApplication.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 120,
      include: {
        handledBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    listEducationSchedulesAdminRows(),
  ]);
  const educationRows = educationApplications.map(toEducationRow);

  return {
    canManageEducation: canManageEducationApplications(user),
    educationSchedules,
    educationApplications: educationRows,
    summary: {
      educationScheduleCount: educationSchedules.length,
      educationScheduleVisibleCount: educationSchedules.filter((item) => item.isVisible).length,
      educationReceivedCount: educationRows.filter((item) => item.status === "RECEIVED").length,
      educationConfirmedCount: educationRows.filter((item) => item.status === "CONFIRMED").length,
      educationCompletedCount: educationRows.filter((item) => item.status === "COMPLETED").length,
      educationCanceledCount: educationRows.filter((item) => item.status === "CANCELED").length,
    },
  };
}

export async function saveNotice(user: AuthUser, input: NoticeInput) {
  assertCanManageNotice(user);

  const noticeId = optionalCleanText(input.id, 80);
  const title = requireText("공지 제목", input.title, 120);
  const content = requireText("공지 내용", input.content, 1000);
  const noticeType = parseNoticeType(input.noticeType);
  const startDate = parseOptionalDate("노출 시작일", input.startDate);
  const endDate = parseOptionalDate("노출 종료일", input.endDate);

  if (startDate && endDate && startDate > endDate) {
    throw new Error("노출 시작일은 종료일보다 늦을 수 없습니다.");
  }

  assertNoForbiddenSensitiveInfo({
    "공지 제목": title,
    "공지 내용": content,
  });

  return prisma.$transaction(async (tx) => {
    const before = noticeId
      ? await tx.notice.findUnique({
          where: {
            id: noticeId,
          },
        })
      : null;

    if (noticeId && !before) {
      throw new Error("수정할 공지사항을 찾을 수 없습니다.");
    }

    const data = {
      title,
      content,
      noticeType,
      isPinned: Boolean(input.isPinned),
      isVisible: Boolean(input.isVisible),
      startDate,
      endDate,
    };

    const saved = before
      ? await tx.notice.update({
          where: {
            id: before.id,
          },
          data,
        })
      : await tx.notice.create({
          data: {
            ...data,
            createdByUserId: user.id,
          },
        });

    await writeAuditLog(tx, {
      userId: user.id,
      action: before ? "UPDATE" : "CREATE",
      targetType: "Notice",
      targetId: saved.id,
      beforeValue: before ? noticeAuditValue(before) : undefined,
      afterValue: noticeAuditValue(saved),
      note: `${noticeTypeLabel(saved.noticeType)}: ${saved.title}`,
    });

    return saved.id;
  });
}

export async function updateEducationApplication(
  user: AuthUser,
  input: EducationApplicationUpdateInput,
) {
  assertCanManageEducation(user);

  const applicationId = requireText("교육 신청 ID", input.id, 80);
  const status = parseEducationStatus(input.status);
  const operatorMemo = optionalCleanText(input.operatorMemo, 500);

  assertNoForbiddenSensitiveInfo({
    "교육 신청 처리 메모": operatorMemo,
  });

  return prisma.$transaction(async (tx) => {
    const before = await tx.educationApplication.findUnique({
      where: {
        id: applicationId,
      },
    });

    if (!before) {
      throw new Error("교육 신청을 찾을 수 없습니다.");
    }

    const saved = await tx.educationApplication.update({
      where: {
        id: before.id,
      },
      data: {
        status,
        operatorMemo: operatorMemo ?? null,
        handledByUserId: user.id,
        handledAt: new Date(),
      },
    });

    await writeAuditLog(tx, {
      userId: user.id,
      action: "STATUS_CHANGE",
      targetType: "EducationApplication",
      targetId: saved.id,
      beforeValue: {
        status: before.status,
        operatorMemo: before.operatorMemo,
      },
      afterValue: {
        status: saved.status,
        operatorMemo: saved.operatorMemo,
      },
      note: `${saved.receiptCode} ${educationStatusLabel(saved.status)}`,
    });

    return saved.id;
  });
}

export const previewPublicContentAdminView: PublicContentAdminView = {
  canManageNotices: false,
  canManageEducation: false,
  notices: [
    {
      id: "preview-notice-1",
      title: "6월 공동예약 운영 안내",
      content: "6월에는 병원, 장보기, 공공기관 이동을 우선 접수합니다.",
      noticeType: "OPERATION",
      noticeTypeLabel: "운영 안내",
      isPinned: true,
      isVisible: true,
      startDate: "2026-06-01",
      endDate: "",
      createdByName: "운영 관리자",
      createdAt: "2026. 6. 1. 오전 9:00:00",
      updatedAt: "2026. 6. 1. 오전 9:00:00",
    },
  ],
  educationApplications: [
    {
      id: "preview-education-1",
      receiptCode: "EDU-PREVIEW",
      participantName: "김교육",
      phoneMasked: "***-****-1234",
      villageName: "소원권역",
      participantTypeLabel: "주민",
      courseTypeLabel: "집체교육",
      preferredDate: "2026-06-08",
      notes: "오전 교육 희망",
      status: "RECEIVED",
      statusLabel: "접수",
      operatorMemo: "",
      handledByName: "",
      handledAt: "",
      createdAt: "2026. 6. 1. 오전 10:00:00",
    },
  ],
  summary: {
    noticeCount: 1,
    visibleNoticeCount: 1,
    pinnedNoticeCount: 1,
    educationReceivedCount: 1,
    educationConfirmedCount: 0,
    educationCompletedCount: 0,
  },
};

export const previewNoticeAdminView: NoticeAdminView = {
  canManageNotices: false,
  notices: previewPublicContentAdminView.notices,
  summary: {
    noticeCount: previewPublicContentAdminView.summary.noticeCount,
    visibleNoticeCount: previewPublicContentAdminView.summary.visibleNoticeCount,
    pinnedNoticeCount: previewPublicContentAdminView.summary.pinnedNoticeCount,
  },
};

export const previewEducationApplicationsAdminView: EducationApplicationsAdminView = {
  canManageEducation: false,
  educationSchedules: previewEducationScheduleAdminRows,
  educationApplications: previewPublicContentAdminView.educationApplications,
  summary: {
    educationScheduleCount: previewEducationScheduleAdminRows.length,
    educationScheduleVisibleCount: previewEducationScheduleAdminRows.filter((item) => item.isVisible).length,
    educationReceivedCount: previewPublicContentAdminView.summary.educationReceivedCount,
    educationConfirmedCount: previewPublicContentAdminView.summary.educationConfirmedCount,
    educationCompletedCount: previewPublicContentAdminView.summary.educationCompletedCount,
    educationCanceledCount: 0,
  },
};
