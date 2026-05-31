import type { FontAwesomeIconName } from "@/lib/fa-icons";

export const navigationItems = [
  { label: "대시보드", href: "/admin", icon: "dashboard", hotkey: "1" },
  { label: "주민", href: "/admin/requests", icon: "resident", hotkey: "2" },
  { label: "공동예약", href: "/admin/groups", icon: "users", hotkey: "3" },
  { label: "캘린더", href: "/admin/calendar", icon: "calendar", hotkey: "4" },
  { label: "동행링커", href: "/admin/trips", icon: "car", hotkey: "5" },
  { label: "정산", href: "/admin/settlements", icon: "receipt", hotkey: "6" },
  { label: "리포트", href: "/admin/reports", icon: "report", hotkey: "7" },
  { label: "공개홈", href: "/admin/public-content", icon: "home", hotkey: "8" },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: FontAwesomeIconName;
  hotkey: string;
}[];

export type NavigationItem = (typeof navigationItems)[number];
