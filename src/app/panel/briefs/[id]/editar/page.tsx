import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { BriefForm, ErrorNote } from "../../../_forms";
import type { Brief } from "@/lib/types";
import { kindOf } from "@/lib/requests";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase, user } = await requireCreative();
  const [{ data }, { data: clients }] = await Promise.all([
    supabase.from("briefs").select("*").eq("id", id).single(),
    supabase.from("clients").select("id, name, company").order("company"),
  ]);
  if (!data) notFound();
  return (
    <>
      <PageHeader title="Editar solicitud" back={{ href: `/panel/briefs/${id}`, label: (data as Brief).title }} />
      <ErrorNote error={error} />
      <BriefForm brief={data as Brief} clients={clients ?? []} userId={user.id} kind={kindOf(data as Brief)} />
    </>
  );
}
