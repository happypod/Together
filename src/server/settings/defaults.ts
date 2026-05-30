import { type RoundingPolicy } from "@/domain/definitions";

export const REPORT_DATE_BASES = ["serviceDate", "returnConfirmedAt"] as const;

export type ReportDateBasis = (typeof REPORT_DATE_BASES)[number];

export type OperatingSettings = {
  defaultFare: number;
  defaultResidentCount: number;
  maxGroupResidents: number;
  fareRoundingPolicy: RoundingPolicy;
  mobileTokenTtlHours: number;
  reportDateBasis: ReportDateBasis;
  villages: string[];
  timeWindows: string[];
};

export type OperatingSettingKey = keyof OperatingSettings;

export const DEFAULT_OPERATING_SETTINGS: OperatingSettings = {
  defaultFare: 72_000,
  defaultResidentCount: 3,
  maxGroupResidents: 3,
  fareRoundingPolicy: "FLOOR",
  mobileTokenTtlHours: 72,
  reportDateBasis: "serviceDate",
  villages: ["백천마을"],
  timeWindows: ["오전", "오후"],
};

export const OPERATING_SETTING_KEYS = Object.keys(
  DEFAULT_OPERATING_SETTINGS,
) as OperatingSettingKey[];

export const SETTING_DESCRIPTIONS: Record<OperatingSettingKey, string> = {
  defaultFare: "기본 택시요금",
  defaultResidentCount: "공동예약 기본 주민 수",
  maxGroupResidents: "공동예약 그룹 최대 주민 수",
  fareRoundingPolicy: "정산 원 단위 처리 기본값",
  mobileTokenTtlHours: "모바일 링크형 입력 토큰 만료 시간",
  reportDateBasis: "월간 리포트 기준일",
  villages: "운영 마을 목록",
  timeWindows: "운영 시간대 목록",
};
