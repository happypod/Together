import {
  type EducationCourseType,
  type EducationScheduleStatus,
  type Prisma,
} from "@prisma/client";
import { AuthorizationError, hasPermission, type AuthUser } from "@/domain/auth/permissions";
import { assertNoForbiddenSensitiveInfo } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";

export type PublicEducationScheduleStatus = "접수 중" | "사전 신청" | "마감" | "완료";

export type PublicEducationScheduleItem = {
  id: string;
  courseType: "collective" | "linker-qualification";
  title: string;
  date: string;
  time: string;
  target: string;
  place: string;
  status: PublicEducationScheduleStatus;
};

export type EducationScheduleAdminRow = {
  id: string;
  courseType: EducationCourseType;
  courseTypeLabel: string;
  title: string;
  scheduleDate: string;
  time: string;
  target: string;
  place: string;
  status: EducationScheduleStatus;
  statusLabel: string;
  publicStatusLabel: PublicEducationScheduleStatus;
  isVisible: boolean;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type EducationScheduleInput = {
  id?: string | null;
  courseType?: string | null;
  title?: string | null;
  scheduleDate?: string | null;
  time?: string | null;
  target?: string | null;
  place?: string | null;
  status?: string | null;
  isVisible?: boolean;
};

export const EDUCATION_COURSE_OPTIONS = [
  { value: "COLLECTIVE", label: "집체교육" },
  { value: "LINKER_QUALIFICATION", label: "민간자격과정" },
] as const satisfies readonly { value: EducationCourseType; label: string }[];

export const EDUCATION_SCHEDULE_STATUS_OPTIONS = [
  { value: "OPEN", label: "접수 중" },
  { value: "PRE_APPLY", label: "사전 신청" },
  { value: "CLOSED", label: "마감" },
  { value: "COMPLETED", label: "완료" },
] as const satisfies readonly { value: EducationScheduleStatus; label: string }[];

const PUBLIC_COURSE_TYPE = {
  COLLECTIVE: "collective",
  LINKER_QUALIFICATION: "linker-qualification",
} as const satisfies Record<EducationCourseType, PublicEducationScheduleItem["courseType"]>;

const COURSE_LABELS = {
  COLLECTIVE: "집체교육",
  LINKER_QUALIFICATION: "민간자격과정",
} as const satisfies Record<EducationCourseType, string>;

const PUBLIC_STATUS_LABELS = {
  OPEN: "접수 중",
  PRE_APPLY: "사전 신청",
  CLOSED: "마감",
  COMPLETED: "완료",
} as const satisfies Record<EducationScheduleStatus, PublicEducationScheduleStatus>;

type EducationScheduleWithCreator = Prisma.EducationScheduleGetPayload<{
  include: {
    createdBy: {
      select: {
        name: true;
      };
    };
  };
}>;

export const previewEducationSchedules: PublicEducationScheduleItem[] = [
  {
    id: "preview-2026-06-01-collective",
    courseType: "collective",
    title: "소원권역 동행이동 OS 집체교육",
    date: "2026-06-01",
    time: "오전 10:00",
    target: "주민, 보호자, 동행자",
    place: "소원권역 커뮤니티센터",
    status: "접수 중",
  },
  {
    id: "preview-2026-06-08-collective",
    courseType: "collective",
    title: "동행서비스 이용자 등록 전 집체교육",
    date: "2026-06-08",
    time: "오전 10:00",
    target: "주민, 동행자 포함",
    place: "소원권역 커뮤니티센터",
    status: "접수 중",
  },
  {
    id: "preview-2026-06-15-collective",
    courseType: "collective",
    title: "소원권역 동행이동 OS 이용 교육",
    date: "2026-06-15",
    time: "오전 10:00",
    target: "주민, 보호자, 동행자",
    place: "주민협의체 교육실",
    status: "접수 중",
  },
  {
    id: "preview-2026-06-22-linker",
    courseType: "linker-qualification",
    title: "동행링커 역량강화 및 민간자격과정",
    date: "2026-06-22",
    time: "오전 10:00 ~ 오후 4:00",
    target: "동행링커 후보자",
    place: "앵커조직 교육장",
    status: "사전 신청",
  },
  {
    id: "preview-2026-06-29-linker",
    courseType: "linker-qualification",
    title: "동행링커 취업연계 역량강화 교육",
    date: "2026-06-29",
    time: "오전 10:00 ~ 오후 4:00",
    target: "동행링커 후보자",
    place: "앵커조직 교육장",
    status: "사전 신청",
  },
];

export const previewEducationScheduleAdminRows: EducationScheduleAdminRow[] =
  previewEducationSchedules.map((schedule) => {
    const courseType =
      schedule.courseType === "linker-qualification" ? "LINKER_QUALIFICATION" : "COLLECTIVE";
    const status =
      schedule.status === "사전 신청"
        ? "PRE_APPLY"
        : schedule.status === "마감"
          ? "CLOSED"
          : schedule.status === "완료"
            ? "COMPLETED"
            : "OPEN";

    return {
      id: schedule.id,
      courseType,
      courseTypeLabel: COURSE_LABELS[courseType],
      title: schedule.title,
      scheduleDate: schedule.date,
      time: schedule.time,
      target: schedule.target,
      place: schedule.place,
      status,
      statusLabel: PUBLIC_STATUS_LABELS[status],
      publicStatusLabel: PUBLIC_STATUS_LABELS[status],
      isVisible: true,
      createdByName: "운영 관리자",
      createdAt: "2026. 6. 1. 오전 9:00:00",
      updatedAt: "2026. 6. 1. 오전 9:00:00",
    };
  });

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

function parseDateOnly(label: string, value: unknown) {
  const text = requireText(label, value, 10);
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

function parseCourseType(value: unknown): EducationCourseType {
  const courseType = requireText("교육 과정", value, 40);
  if (courseType === "collective") {
    return "COLLECTIVE";
  }
  if (courseType === "linker-qualification") {
    return "LINKER_QUALIFICATION";
  }
  if (EDUCATION_COURSE_OPTIONS.some((option) => option.value === courseType)) {
    return courseType as EducationCourseType;
  }
  throw new Error("교육 과정을 다시 선택해 주세요.");
}

function parseScheduleStatus(value: unknown): EducationScheduleStatus {
  const status = requireText("교육 일정 상태", value, 30);
  if (EDUCATION_SCHEDULE_STATUS_OPTIONS.some((option) => option.value === status)) {
    return status as EducationScheduleStatus;
  }
  throw new Error("교육 일정 상태를 다시 선택해 주세요.");
}

function toPublicSchedule(record: {
  id: string;
  courseType: EducationCourseType;
  title: string;
  scheduleDate: Date;
  time: string;
  target: string;
  place: string;
  status: EducationScheduleStatus;
}): PublicEducationScheduleItem {
  return {
    id: record.id,
    courseType: PUBLIC_COURSE_TYPE[record.courseType],
    title: record.title,
    date: formatDateOnly(record.scheduleDate),
    time: record.time,
    target: record.target,
    place: record.place,
    status: PUBLIC_STATUS_LABELS[record.status],
  };
}

function toAdminRow(record: EducationScheduleWithCreator): EducationScheduleAdminRow {
  return {
    id: record.id,
    courseType: record.courseType,
    courseTypeLabel: COURSE_LABELS[record.courseType],
    title: record.title,
    scheduleDate: formatDateOnly(record.scheduleDate),
    time: record.time,
    target: record.target,
    place: record.place,
    status: record.status,
    statusLabel: PUBLIC_STATUS_LABELS[record.status],
    publicStatusLabel: PUBLIC_STATUS_LABELS[record.status],
    isVisible: record.isVisible,
    createdByName: record.createdBy.name,
    createdAt: formatDateTime(record.createdAt),
    updatedAt: formatDateTime(record.updatedAt),
  };
}

function scheduleAuditValue(record: {
  id: string;
  courseType: EducationCourseType;
  title: string;
  scheduleDate: Date;
  time: string;
  target: string;
  place: string;
  status: EducationScheduleStatus;
  isVisible: boolean;
}) {
  return {
    id: record.id,
    courseType: record.courseType,
    title: record.title,
    scheduleDate: formatDateOnly(record.scheduleDate),
    time: record.time,
    target: record.target,
    place: record.place,
    status: record.status,
    isVisible: record.isVisible,
  };
}

export function canManageEducationSchedules(user: AuthUser | null | undefined) {
  return hasPermission(user, "setting:manage") || hasPermission(user, "request:write");
}

function assertCanManageEducationSchedule(user: AuthUser) {
  if (!canManageEducationSchedules(user)) {
    throw new AuthorizationError("교육 일정을 등록하거나 수정할 권한이 없습니다.");
  }
}

export async function listPublicEducationSchedules(): Promise<PublicEducationScheduleItem[]> {
  const schedules = await prisma.educationSchedule.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [{ scheduleDate: "asc" }, { createdAt: "asc" }],
    take: 80,
  });

  return schedules.map(toPublicSchedule);
}

export async function listEducationSchedulesAdminRows(): Promise<EducationScheduleAdminRow[]> {
  const schedules = await prisma.educationSchedule.findMany({
    orderBy: [{ scheduleDate: "desc" }, { createdAt: "desc" }],
    take: 120,
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return schedules.map(toAdminRow);
}

export async function saveEducationSchedule(user: AuthUser, input: EducationScheduleInput) {
  assertCanManageEducationSchedule(user);

  const scheduleId = optionalCleanText(input.id, 80);
  const courseType = parseCourseType(input.courseType);
  const title = requireText("교육 제목", input.title, 120);
  const scheduleDate = parseDateOnly("교육일자", input.scheduleDate);
  const time = requireText("교육 시간", input.time, 80);
  const target = requireText("교육 대상", input.target, 120);
  const place = requireText("교육 장소", input.place, 120);
  const status = parseScheduleStatus(input.status ?? "OPEN");
  const isVisible = input.isVisible ?? true;

  assertNoForbiddenSensitiveInfo({
    "교육 제목": title,
    "교육 대상": target,
    "교육 장소": place,
  });

  return prisma.$transaction(async (tx) => {
    const before = scheduleId
      ? await tx.educationSchedule.findUnique({
          where: {
            id: scheduleId,
          },
        })
      : null;

    if (scheduleId && !before) {
      throw new Error("수정할 교육 일정을 찾을 수 없습니다.");
    }

    const data = {
      courseType,
      title,
      scheduleDate,
      time,
      target,
      place,
      status,
      isVisible,
    };

    const saved = before
      ? await tx.educationSchedule.update({
          where: {
            id: before.id,
          },
          data,
        })
      : await tx.educationSchedule.create({
          data: {
            ...data,
            createdByUserId: user.id,
          },
        });

    await writeAuditLog(tx, {
      userId: user.id,
      action: before ? "UPDATE" : "CREATE",
      targetType: "EducationSchedule",
      targetId: saved.id,
      beforeValue: before ? scheduleAuditValue(before) : undefined,
      afterValue: scheduleAuditValue(saved),
      note: `${formatDateOnly(saved.scheduleDate)} ${COURSE_LABELS[saved.courseType]}: ${saved.title}`,
    });

    return saved.id;
  });
}
