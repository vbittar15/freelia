import { requireCreative } from "@/lib/auth";
import { Onboarding } from "@/components/onboarding";
import { finishOnboarding } from "@/app/panel/ajustes/actions";

export const metadata = { title: "Bienvenida" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { profile } = await requireCreative();
  return (
    <Onboarding action={finishOnboarding} name={(profile.full_name ?? "").split(" ")[0]} initial={profile.specialties ?? []}
      business={profile.business_name ?? ""} city={profile.city ?? ""} error={error} />
  );
}
