import { RoleDashboardPage } from "@/features/role-dashboards/role-dashboard-page";
import { getPublicHomeView } from "@/server/public/public-home-view";

export const dynamic = "force-dynamic";

export default async function ResidentDashboardRoute() {
  const view = await getPublicHomeView();
  return <RoleDashboardPage {...view} role="resident" />;
}
