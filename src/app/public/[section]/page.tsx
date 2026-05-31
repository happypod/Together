import { notFound } from "next/navigation";
import { PublicHomePage } from "@/features/public-home/public-home-page";
import { isPublicMenuId, publicMenuItems } from "@/features/public-home/public-menu";
import { getPublicHomeView } from "@/server/public/public-home-view";

export const dynamic = "force-dynamic";

type PublicSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export function generateStaticParams() {
  return publicMenuItems.map((item) => ({ section: item.id }));
}

export default async function PublicSectionPage({ params }: PublicSectionPageProps) {
  const { section } = await params;
  if (!isPublicMenuId(section)) {
    notFound();
  }

  const view = await getPublicHomeView();
  return <PublicHomePage {...view} activeMenuId={section} />;
}
