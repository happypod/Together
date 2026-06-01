import type { FontAwesomeIconName } from "@/lib/fa-icons";

export const navigationItems = [
  { label: "대시보드", href: "/admin", icon: "dashboard", hotkey: "1" },
  { label: "사용자현황", href: "/admin/participants", icon: "users", hotkey: "2" },
  { label: "공동예약", href: "/admin/groups", icon: "users", hotkey: "3" },
  { label: "동행링커", href: "/admin/trips", icon: "car", hotkey: "4" },
  { label: "정산", href: "/admin/settlements", icon: "receipt", hotkey: "5" },
  { label: "리포트", href: "/admin/reports", icon: "report", hotkey: "6" },
  { label: "공지", href: "/admin/notices", icon: "clipboardList", hotkey: "7" },
  { label: "교육신청", href: "/admin/education-applications", icon: "checklist", hotkey: "8" },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: FontAwesomeIconName;
  hotkey: string;
}[];

export type NavigationItem = (typeof navigationItems)[number];
