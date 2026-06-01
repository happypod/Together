import { Prisma } from "@prisma/client";
import { assertPermission, hasPermission, type AuthUser } from "@/domain/auth/permissions";
import {
  LINKER_STATUS_LABELS,
  LINKER_STATUSES,
  MOBILITY_STATUS_LABELS,
  type LinkerStatus,
  type UserRole,
} from "@/domain/definitions";
import { assertNoForbiddenSensitiveInfo, maskPhone } from "@/domain/privacy";
import { writeAuditLog } from "@/server/audit/audit-log";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

export type ParticipantKind = "resident" | "linker";
export type ParticipantManagementTab = "residents" | "linkers";

export type ParticipantManagementFilters = {
  linkerQuery?: string;
  residentQuery?: string;
  tab?: string;
};

export type ParticipantActivityItem = {
  date: string;
  status: string;
  title: string;
};

export type ParticipantNoticeItem = {
  content: string;
  createdAt: string;
  id: string;
  title: string;
};

export type ResidentUserStatusRow = {
  accountEmail: string;
  accountStatusLabel: string;
  activityCount: number;
  emotionalRecoveryAverage: number | null;
  guardianPhone: string;
  id: string;
  memo: string;
  name: string;
  passwordConfigured: boolean;
  phone: string;
  phoneMasked: string;
  recentActivities: ParticipantActivityItem[];
  recentNotices: ParticipantNoticeItem[];
  villageName: string;
};

export type LinkerUserStatusRow = {
  accountEmail: string;
  accountStatusLabel: string;
  activityCount: number;
  availableDays: string[];
  availableTimeWindows: string[];
  desiredJobField: string;
  fieldPracticeCompleted: boolean;
  id: string;
  insuranceRegistered: boolean;
  name: string;
  passwordConfigured: boolean;
  phone: string;
  phoneMasked: string;
  privacyPledgeSigned: boolean;
  recentActivities: ParticipantActivityItem[];
  recentNotices: ParticipantNoticeItem[];
  status: LinkerStatus;
  statusLabel: string;
  trainingCompleted: boolean;
  villageName: string;
  wantsJobConnection: boolean;
};

export type ParticipantManagementView = {
  canManage: boolean;
  canManageLinkers: boolean;
  canManageResidents: boolean;
  filters: {
    linkerQuery: string;
    residentQuery: string;
    tab: ParticipantManagementTab;
  };
  linkerRows: LinkerUserStatusRow[];
  residentRows: ResidentUserStatusRow[];
  summary: {
    linkedAccountCount: number;
    linkerCount: number;
    noticeCount: number;
    residentCount: number;
  };
};

export type ParticipantProfileInput = {
  availableDays?: string[];
  availableTimeWindows?: string[];
  desiredJobField?: string | null;
  fieldPracticeCompleted?: boolean;
  guardianPhone?: string | null;
  id?: string | null;
  insuranceRegistered?: boolean;
  kind?: string | null;
  memo?: string | null;
  name?: string | null;
  phone?: string | null;
  privacyPledgeSigned?: boolean;
  status?: string | null;
  trainingCompleted?: boolean;
  villageName?: string | null;
  wantsJobConnection?: boolean;
};

export type ParticipantPasswordInput = {
  email?: string | null;
  id?: string | null;
  kind?: string | null;
  password?: string | null;
};

export type ParticipantNoticeInput = {
  content?: string | null;
  id?: string | null;
  kind?: string | null;
  title?: string | null;
};

type ResidentRecord = Prisma.ResidentGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        isActive: true;
        passwordHash: true;
      };
    };
    requests: {
      select: {
        desiredDate: true;
        desiredTimeWindow: true;
        destination: true;
        purpose: true;
        status: true;
      };
    };
    groupMembers: {
      select: {
        group: {
          select: {
            destinationSummary: true;
            serviceDate: true;
            status: true;
            timeWindow: true;
          };
        };
      };
    };
    surveys: {
      select: {
        createdAt: true;
        emotionalRecovery: true;
        reuseIntent: true;
        userSatisfaction: true;
      };
    };
  };
}>;

type LinkerRecord = Prisma.LinkerGetPayload<{
  include: {
    user: {
      select: {
        email: true;
        isActive: true;
        passwordHash: true;
      };
    };
    groups: {
      select: {
        destinationSummary: true;
        groupName: true;
        serviceDate: true;
        status: true;
        timeWindow: true;
      };
    };
    jobConsultations: {
      select: {
        consultedAt: true;
        field: true;
        status: true;
      };
    };
  };
}>;

const PARTICIPANT_NOTICE_PREFIX = "개인공지:";

function hasPermissionFlag(user: AuthUser, permission: "resident:write" | "linker:write") {
  try {
    assertPermission(user, permission);
    return true;
  } catch {
    return false;
  }
}

function hasResidentManagePermission(user: AuthUser) {
  return hasPermissionFlag(user, "resident:write");
}

function hasLinkerManagePermission(user: AuthUser) {
  return hasPermissionFlag(user, "linker:write");
}

function hasParticipantManagePermission(user: AuthUser) {
  return hasResidentManagePermission(user) || hasLinkerManagePermission(user);
}

function assertCanManageParticipantKind(user: AuthUser, kind: ParticipantKind) {
  if (kind === "resident" && hasResidentManagePermission(user)) {
    return;
  }
  if (kind === "linker" && hasLinkerManagePermission(user)) {
    return;
  }
  throw new Error(`${kind === "resident" ? "주민" : "동행링커"} 사용자현황을 관리할 권한이 없습니다.`);
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeFilters(filters: ParticipantManagementFilters = {}) {
  const tab: ParticipantManagementTab = filters.tab === "linkers" ? "linkers" : "residents";
  return {
    linkerQuery: cleanText(filters.linkerQuery, 80),
    residentQuery: cleanText(filters.residentQuery, 80),
    tab,
  };
}

function buildResidentWhere(query: string): Prisma.ResidentWhereInput {
  const where: Prisma.ResidentWhereInput = { deletedAt: null };
  if (!query) {
    return where;
  }

  where.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { villageName: { contains: query, mode: "insensitive" } },
    { phone: { contains: query, mode: "insensitive" } },
    { guardianPhone: { contains: query, mode: "insensitive" } },
    { memo: { contains: query, mode: "insensitive" } },
    { user: { is: { email: { contains: query, mode: "insensitive" } } } },
  ];
  return where;
}

function buildLinkerWhere(query: string): Prisma.LinkerWhereInput {
  const where: Prisma.LinkerWhereInput = { deletedAt: null };
  if (!query) {
    return where;
  }

  where.OR = [
    { name: { contains: query, mode: "insensitive" } },
    { villageName: { contains: query, mode: "insensitive" } },
    { phone: { contains: query, mode: "insensitive" } },
    { desiredJobField: { contains: query, mode: "insensitive" } },
    { incidentComplaintHistory: { contains: query, mode: "insensitive" } },
    { user: { is: { email: { contains: query, mode: "insensitive" } } } },
  ];
  return where;
}

function matchesSearch(query: string, values: (string | null | undefined)[]) {
  if (!query) {
    return true;
  }
  const normalizedQuery = query.toLowerCase();
  return values.some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}

function optionalText(value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  return text.length > 0 ? text : null;
}

function requireText(label: string, value: unknown, maxLength: number) {
  const text = cleanText(value, maxLength);
  if (!text) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return text;
}

function requirePhone(label: string, value: unknown) {
  const phone = requireText(label, value, 30);
  if (phone.replace(/\D/g, "").length < 8) {
    throw new Error(`${label}는 숫자 8자리 이상으로 입력해 주세요.`);
  }
  return phone;
}

function parseKind(value: unknown): ParticipantKind {
  const kind = cleanText(value, 20);
  if (kind !== "resident" && kind !== "linker") {
    throw new Error("대상 구분을 다시 선택해 주세요.");
  }
  return kind;
}

function parseId(value: unknown) {
  const id = cleanText(value, 80);
  if (!id) {
    return "";
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("대상을 찾을 수 없습니다.");
  }
  return id;
}

function parseLinkerStatus(value: unknown): LinkerStatus {
  const status = requireText("링커 상태", value, 40) as LinkerStatus;
  if (!LINKER_STATUSES.includes(status)) {
    throw new Error("링커 상태를 다시 선택해 주세요.");
  }
  return status;
}

function normalizeEmail(value: unknown) {
  const email = requireText("로그인 이메일", value, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("이메일 형식을 다시 확인해 주세요.");
  }
  return email;
}

function normalizePassword(value: unknown) {
  const password = String(value ?? "");
  if (password.length < 10) {
    throw new Error("비밀번호는 10자 이상으로 입력해 주세요.");
  }
  return password;
}

function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }
  return value instanceof Date ? value.toISOString().slice(0, 10) : new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleString("ko-KR");
}

function accountStatusLabel(user?: { isActive: boolean; passwordHash: string | null } | null) {
  if (!user) {
    return "계정 없음";
  }
  if (!user.isActive) {
    return "비활성";
  }
  return user.passwordHash ? "로그인 가능" : "비밀번호 필요";
}

function average(values: (number | null)[]) {
  const scores = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (scores.length === 0) {
    return null;
  }
  return Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1));
}

function noticeTitle(summary: string) {
  if (!summary.startsWith(PARTICIPANT_NOTICE_PREFIX)) {
    return "개인 공지";
  }
  return summary.slice(PARTICIPANT_NOTICE_PREFIX.length).split("\n")[0]?.trim() || "개인 공지";
}

function noticeContent(summary: string) {
  if (!summary.startsWith(PARTICIPANT_NOTICE_PREFIX)) {
    return summary;
  }
  return summary.slice(PARTICIPANT_NOTICE_PREFIX.length).split("\n").slice(1).join("\n").trim();
}

function noticeRowsByTarget(logs: {
  createdAt: Date;
  id: string;
  summary: string;
  targetId: string;
}[]) {
  const map = new Map<string, ParticipantNoticeItem[]>();
  for (const log of logs) {
    const rows = map.get(log.targetId) ?? [];
    rows.push({
      id: log.id,
      title: noticeTitle(log.summary),
      content: noticeContent(log.summary),
      createdAt: formatDateTime(log.createdAt),
    });
    map.set(log.targetId, rows);
  }
  return map;
}

function toResidentRow(
  resident: ResidentRecord,
  notices: ParticipantNoticeItem[],
): ResidentUserStatusRow {
  const requestActivities: ParticipantActivityItem[] = resident.requests.map((request) => ({
    date: formatDateOnly(request.desiredDate),
    status: MOBILITY_STATUS_LABELS[request.status],
    title: `${request.desiredTimeWindow} ${request.destination}`,
  }));
  const groupActivities: ParticipantActivityItem[] = resident.groupMembers.map((member) => ({
    date: formatDateOnly(member.group.serviceDate),
    status: MOBILITY_STATUS_LABELS[member.group.status],
    title: `${member.group.timeWindow} ${member.group.destinationSummary}`,
  }));

  return {
    id: resident.id,
    name: resident.name,
    villageName: resident.villageName,
    phone: resident.phone,
    phoneMasked: maskPhone(resident.phone),
    guardianPhone: resident.guardianPhone ?? "",
    memo: resident.memo ?? "",
    accountEmail: resident.user?.email ?? "",
    accountStatusLabel: accountStatusLabel(resident.user),
    passwordConfigured: Boolean(resident.user?.passwordHash),
    activityCount: resident.requests.length + resident.groupMembers.length,
    emotionalRecoveryAverage: average(resident.surveys.map((survey) => survey.emotionalRecovery)),
    recentActivities: [...requestActivities, ...groupActivities]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 4),
    recentNotices: notices,
  };
}

function toLinkerRow(linker: LinkerRecord, notices: ParticipantNoticeItem[]): LinkerUserStatusRow {
  const tripActivities: ParticipantActivityItem[] = linker.groups.map((group) => ({
    date: formatDateOnly(group.serviceDate),
    status: MOBILITY_STATUS_LABELS[group.status],
    title: `${group.timeWindow} ${group.destinationSummary}`,
  }));
  const jobActivities: ParticipantActivityItem[] = linker.jobConsultations.map((job) => ({
    date: formatDateOnly(job.consultedAt),
    status: job.status,
    title: `취업연계 ${job.field}`,
  }));

  return {
    id: linker.id,
    name: linker.name,
    villageName: linker.villageName,
    phone: linker.phone,
    phoneMasked: maskPhone(linker.phone),
    accountEmail: linker.user?.email ?? "",
    accountStatusLabel: accountStatusLabel(linker.user),
    passwordConfigured: Boolean(linker.user?.passwordHash),
    availableDays: linker.availableDays,
    availableTimeWindows: linker.availableTimeWindows,
    trainingCompleted: linker.trainingCompleted,
    fieldPracticeCompleted: linker.fieldPracticeCompleted,
    privacyPledgeSigned: linker.privacyPledgeSigned,
    insuranceRegistered: linker.insuranceRegistered,
    status: linker.status,
    statusLabel: LINKER_STATUS_LABELS[linker.status],
    activityCount: linker.activityCount,
    wantsJobConnection: linker.wantsJobConnection,
    desiredJobField: linker.desiredJobField ?? "",
    recentActivities: [...tripActivities, ...jobActivities]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 4),
    recentNotices: notices,
  };
}

export async function getParticipantManagementView(
  user: AuthUser,
  filters: ParticipantManagementFilters = {},
): Promise<ParticipantManagementView> {
  const normalizedFilters = normalizeFilters(filters);
  const canReadResidents = hasPermission(user, "resident:read") || hasPermission(user, "user:manage");
  const canReadLinkers = hasPermission(user, "linker:read") || hasPermission(user, "user:manage");
  if (!canReadResidents && !canReadLinkers) {
    assertPermission(user, "resident:read");
  }

  const [residents, linkers] = await Promise.all([
    canReadResidents ? prisma.resident.findMany({
      where: buildResidentWhere(normalizedFilters.residentQuery),
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: normalizedFilters.residentQuery ? 80 : 40,
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            passwordHash: true,
          },
        },
        requests: {
          orderBy: [{ desiredDate: "desc" }],
          take: 4,
          select: {
            desiredDate: true,
            desiredTimeWindow: true,
            destination: true,
            purpose: true,
            status: true,
          },
        },
        groupMembers: {
          orderBy: [{ group: { serviceDate: "desc" } }],
          take: 4,
          select: {
            group: {
              select: {
                destinationSummary: true,
                serviceDate: true,
                status: true,
                timeWindow: true,
              },
            },
          },
        },
        surveys: {
          orderBy: [{ createdAt: "desc" }],
          take: 6,
          select: {
            createdAt: true,
            emotionalRecovery: true,
            reuseIntent: true,
            userSatisfaction: true,
          },
        },
      },
    }) : Promise.resolve([]),
    canReadLinkers ? prisma.linker.findMany({
      where: buildLinkerWhere(normalizedFilters.linkerQuery),
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: normalizedFilters.linkerQuery ? 80 : 40,
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            passwordHash: true,
          },
        },
        groups: {
          orderBy: [{ serviceDate: "desc" }],
          take: 4,
          select: {
            destinationSummary: true,
            groupName: true,
            serviceDate: true,
            status: true,
            timeWindow: true,
          },
        },
        jobConsultations: {
          orderBy: [{ consultedAt: "desc" }],
          take: 4,
          select: {
            consultedAt: true,
            field: true,
            status: true,
          },
        },
      },
    }) : Promise.resolve([]),
  ]);

  const residentIds = residents.map((resident) => resident.id);
  const linkerIds = linkers.map((linker) => linker.id);
  const logs = await prisma.contactLog.findMany({
    where: {
      contactType: "SMS_MANUAL",
      OR: [
        { targetType: "Resident", targetId: { in: residentIds } },
        { targetType: "Linker", targetId: { in: linkerIds } },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    take: 80,
    select: {
      createdAt: true,
      id: true,
      summary: true,
      targetId: true,
    },
  });
  const noticesByTarget = noticeRowsByTarget(logs);

  const residentRows = residents.map((resident) =>
    toResidentRow(resident, noticesByTarget.get(resident.id) ?? []),
  );
  const linkerRows = linkers.map((linker) => toLinkerRow(linker, noticesByTarget.get(linker.id) ?? []));

  return {
    canManage: hasParticipantManagePermission(user),
    canManageLinkers: hasLinkerManagePermission(user),
    canManageResidents: hasResidentManagePermission(user),
    filters: normalizedFilters,
    residentRows,
    linkerRows,
    summary: {
      residentCount: residentRows.length,
      linkerCount: linkerRows.length,
      linkedAccountCount:
        residentRows.filter((row) => row.accountEmail).length +
        linkerRows.filter((row) => row.accountEmail).length,
      noticeCount: logs.length,
    },
  };
}

export function createPreviewParticipantManagementView(
  user: AuthUser | null = null,
  filters: ParticipantManagementFilters = {},
): ParticipantManagementView {
  const normalizedFilters = normalizeFilters(filters);
  const residentRows: ResidentUserStatusRow[] = [
    {
      id: "00000000-0000-4000-8000-000000010001",
      name: "홍길순",
      villageName: "소원권역",
      phone: "010-1234-5678",
      phoneMasked: "010-****-5678",
      guardianPhone: "010-2222-3333",
      memo: "오전 이동 선호",
      accountEmail: "resident@example.org",
      accountStatusLabel: "로그인 가능",
      passwordConfigured: true,
      activityCount: 3,
      emotionalRecoveryAverage: 4.5,
      recentActivities: [
        { date: "2026-06-03", status: "택시확정", title: "오전 백천종합병원" },
        { date: "2026-05-21", status: "귀가확인", title: "오후 백천시장" },
      ],
      recentNotices: [
        {
          id: "preview-resident-notice",
          title: "6월 교육 안내",
          content: "집체교육 일정을 확인해 주세요.",
          createdAt: "2026. 6. 1. 오전 9:00:00",
        },
      ],
    },
  ];
  const linkerRows: LinkerUserStatusRow[] = [
    {
      id: "00000000-0000-4000-8000-000000020001",
      name: "김동행",
      villageName: "소원권역",
      phone: "010-3333-4444",
      phoneMasked: "010-****-4444",
      accountEmail: "linker@example.org",
      accountStatusLabel: "로그인 가능",
      passwordConfigured: true,
      availableDays: ["월", "수", "금"],
      availableTimeWindows: ["오전", "오후"],
      trainingCompleted: true,
      fieldPracticeCompleted: true,
      privacyPledgeSigned: true,
      insuranceRegistered: true,
      status: "AVAILABLE",
      statusLabel: "활동가능",
      activityCount: 12,
      wantsJobConnection: true,
      desiredJobField: "생활돌봄",
      recentActivities: [
        { date: "2026-06-03", status: "귀가확인", title: "오전 백천종합병원" },
        { date: "2026-05-29", status: "CONNECTED", title: "취업연계 생활돌봄" },
      ],
      recentNotices: [],
    },
  ];
  const filteredResidentRows = residentRows.filter((row) =>
    matchesSearch(normalizedFilters.residentQuery, [
      row.name,
      row.villageName,
      row.phone,
      row.phoneMasked,
      row.guardianPhone,
      row.accountEmail,
      row.memo,
    ]),
  );
  const filteredLinkerRows = linkerRows.filter((row) =>
    matchesSearch(normalizedFilters.linkerQuery, [
      row.name,
      row.villageName,
      row.phone,
      row.phoneMasked,
      row.accountEmail,
      row.desiredJobField,
      row.statusLabel,
    ]),
  );

  return {
    canManage: Boolean(user && hasParticipantManagePermission(user)),
    canManageLinkers: Boolean(user && hasLinkerManagePermission(user)),
    canManageResidents: Boolean(user && hasResidentManagePermission(user)),
    filters: normalizedFilters,
    residentRows: filteredResidentRows,
    linkerRows: filteredLinkerRows,
    summary: {
      residentCount: filteredResidentRows.length,
      linkerCount: filteredLinkerRows.length,
      linkedAccountCount:
        filteredResidentRows.filter((row) => row.accountEmail).length +
        filteredLinkerRows.filter((row) => row.accountEmail).length,
      noticeCount:
        filteredResidentRows.reduce((sum, row) => sum + row.recentNotices.length, 0) +
        filteredLinkerRows.reduce((sum, row) => sum + row.recentNotices.length, 0),
    },
  };
}

export async function saveParticipantProfile(user: AuthUser, input: ParticipantProfileInput) {
  const kind = parseKind(input.kind);
  assertCanManageParticipantKind(user, kind);
  const id = parseId(input.id);
  const name = requireText("이름", input.name, 80);
  const villageName = requireText("마을명", input.villageName, 80);
  const phone = requirePhone("연락처", input.phone);

  if (kind === "resident") {
    const data = {
      name,
      villageName,
      phone,
      guardianPhone: optionalText(input.guardianPhone, 30),
      memo: optionalText(input.memo, 300),
    };
    assertNoForbiddenSensitiveInfo({ 주민메모: data.memo });

    if (!id) {
      return prisma.$transaction(async (tx) => {
        const created = await tx.resident.create({ data });
        await writeAuditLog(tx, {
          userId: user.id,
          action: "CREATE",
          targetType: "Resident",
          targetId: created.id,
          afterValue: data,
        });
        return created.id;
      });
    }

    const previous = await prisma.resident.findFirst({ where: { id, deletedAt: null } });
    if (!previous) {
      throw new Error("주민을 찾을 수 없습니다.");
    }
    const updated = await prisma.resident.update({ where: { id }, data });
    await writeAuditLog(prisma, {
      userId: user.id,
      action: "UPDATE",
      targetType: "Resident",
      targetId: id,
      beforeValue: previous,
      afterValue: data,
    });
    return updated.id;
  }

  const linkerData = {
    name,
    villageName,
    phone,
    availableDays: input.availableDays ?? [],
    availableTimeWindows: input.availableTimeWindows ?? [],
    trainingCompleted: Boolean(input.trainingCompleted),
    fieldPracticeCompleted: Boolean(input.fieldPracticeCompleted),
    privacyPledgeSigned: Boolean(input.privacyPledgeSigned),
    insuranceRegistered: Boolean(input.insuranceRegistered),
    status: parseLinkerStatus(input.status),
    wantsJobConnection: Boolean(input.wantsJobConnection),
    desiredJobField: optionalText(input.desiredJobField, 80),
  };

  if (!id) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.linker.create({ data: linkerData });
      await writeAuditLog(tx, {
        userId: user.id,
        action: "CREATE",
        targetType: "Linker",
        targetId: created.id,
        afterValue: linkerData,
      });
      return created.id;
    });
  }

  const previous = await prisma.linker.findFirst({ where: { id, deletedAt: null } });
  if (!previous) {
    throw new Error("동행링커를 찾을 수 없습니다.");
  }
  const updated = await prisma.linker.update({ where: { id }, data: linkerData });
  await writeAuditLog(prisma, {
    userId: user.id,
    action: "UPDATE",
    targetType: "Linker",
    targetId: id,
    beforeValue: previous,
    afterValue: linkerData,
  });
  return updated.id;
}

export async function setParticipantPassword(user: AuthUser, input: ParticipantPasswordInput) {
  const kind = parseKind(input.kind);
  assertCanManageParticipantKind(user, kind);
  const id = parseId(input.id);
  if (!id) {
    throw new Error("비밀번호를 설정할 대상을 선택해 주세요.");
  }
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(normalizePassword(input.password));
  const role: UserRole = kind === "resident" ? "RESIDENT" : "LINKER";

  try {
    return await prisma.$transaction(async (tx) => {
      const target =
        kind === "resident"
          ? await tx.resident.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, phone: true, userId: true } })
          : await tx.linker.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, phone: true, userId: true } });
      if (!target) {
        throw new Error("대상을 찾을 수 없습니다.");
      }

      const account = target.userId
        ? await tx.user.update({
            where: { id: target.userId },
            data: {
              email,
              isActive: true,
              name: target.name,
              passwordHash,
              phone: target.phone,
              role,
            },
          })
        : await tx.user.create({
            data: {
              email,
              isActive: true,
              name: target.name,
              passwordHash,
              phone: target.phone,
              role,
            },
          });

      if (!target.userId) {
        if (kind === "resident") {
          await tx.resident.update({ where: { id }, data: { userId: account.id } });
        } else {
          await tx.linker.update({ where: { id }, data: { userId: account.id } });
        }
      }

      await writeAuditLog(tx, {
        userId: user.id,
        action: target.userId ? "UPDATE" : "CREATE",
        targetType: "User",
        targetId: account.id,
        afterValue: {
          email,
          linkedTargetId: id,
          linkedTargetType: kind === "resident" ? "Resident" : "Linker",
          passwordReset: true,
          role,
        },
        note: `${kind === "resident" ? "주민" : "동행링커"} 계정 비밀번호 설정`,
      });

      return account.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("이미 사용 중인 이메일입니다.");
    }
    throw error;
  }
}

export async function sendParticipantNotice(user: AuthUser, input: ParticipantNoticeInput) {
  const kind = parseKind(input.kind);
  assertCanManageParticipantKind(user, kind);
  const id = parseId(input.id);
  if (!id) {
    throw new Error("공지 발송 대상을 선택해 주세요.");
  }
  const title = requireText("공지 제목", input.title, 120);
  const content = requireText("공지 내용", input.content, 600);
  assertNoForbiddenSensitiveInfo({ "개인 공지 제목": title, "개인 공지 내용": content });

  return prisma.$transaction(async (tx) => {
    const exists =
      kind === "resident"
        ? await tx.resident.findFirst({ where: { id, deletedAt: null }, select: { id: true } })
        : await tx.linker.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!exists) {
      throw new Error("공지 발송 대상을 찾을 수 없습니다.");
    }

    const log = await tx.contactLog.create({
      data: {
        contactedAt: new Date(),
        contactType: "SMS_MANUAL",
        createdByUserId: user.id,
        summary: `${PARTICIPANT_NOTICE_PREFIX}${title}\n${content}`,
        targetId: id,
        targetType: kind === "resident" ? "Resident" : "Linker",
      },
    });

    await writeAuditLog(tx, {
      userId: user.id,
      action: "CREATE",
      targetType: "ContactLog",
      targetId: log.id,
      afterValue: {
        noticeTitle: title,
        targetId: id,
        targetType: kind,
      },
      note: "개인 공지 발송 기록",
    });

    return log.id;
  });
}
