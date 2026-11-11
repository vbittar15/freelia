import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { ErrorNote, QuoteForm } from "../../../_forms";
import type { Quote } from "@/lib/types";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireCreative();
  const [{ data }, { data: clients }] = await Promise.all([
    supabase.from("quotes").select("*, quote_items(*)").eq("id", id).single(),
    supabase.from("clients").select("id, name, company"),
  ]);
  if (!data) notFound();
  const q = data as Quote;
  q.quote_items?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return (
    <>
      <PageHeader title={`Editar cotización #${q.number}`} back={{ href: `/panel/cotizaciones/${id}`, label: q.title }} />
      <ErrorNote error={error} />
      <QuoteForm quote={q} clients={clients ?? []} catalog={await loadCatalog(supabase)} />
    </>
  );
}
