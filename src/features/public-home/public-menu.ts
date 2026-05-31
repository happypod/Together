export type PublicMenuId = "apply" | "check" | "schedule" | "education" | "notice" | "contact";

export const publicMenuItems: {
  id: PublicMenuId;
  label: string;
  href: string;
  description: string;
}[] = [
  {
    id: "apply",
    label: "공동예약 신청",
    href: "/public/apply",
    description: "날짜, 시간대, 목적지를 입력합니다.",
  },
  {
    id: "check",
    label: "내 신청 확인",
    href: "/public/check",
    description: "이름, 연락처, 희망일로 확인합니다.",
  },
  {
    id: "schedule",
    label: "모집현황",
    href: "/public/schedule",
    description: "이번 주 공동예약 일정을 봅니다.",
  },
  {
    id: "education",
    label: "교육 신청",
    href: "/public/education",
    description: "집체교육과 동행링커 교육을 신청합니다.",
  },
  {
    id: "notice",
    label: "공지사항",
    href: "/public/notice",
    description: "운영 공지와 안전 안내를 확인합니다.",
  },
  {
    id: "contact",
    label: "문의",
    href: "/public/contact",
    description: "문의 가능 시간과 방법을 확인합니다.",
  },
];

export function isPublicMenuId(value: string): value is PublicMenuId {
  return publicMenuItems.some((item) => item.id === value);
}
