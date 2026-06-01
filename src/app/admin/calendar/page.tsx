import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MobilityCalendarPage({ searchParams }: CalendarPageProps) {
  const params = (await searchParams) ?? {};
  const nextParams = new URLSearchParams({ tab: "calendar" });

  for (const key of ["view", "date", "status"]) {
    const value = firstValue(params[key]);
    if (value) {
      nextParams.set(key, value);
    }
  }

  redirect(`/admin?${nextParams.toString()}`);
}
