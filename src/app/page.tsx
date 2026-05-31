import { PublicHomePage } from "@/features/public-home/public-home-page";
import { getPublicHomeView } from "@/server/public/public-home-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const view = await getPublicHomeView();
  return <PublicHomePage {...view} />;
}
