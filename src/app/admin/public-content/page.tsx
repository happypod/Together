import { redirect } from "next/navigation";

export default function PublicContentAdminRedirectPage() {
  redirect("/admin/notices");
}
