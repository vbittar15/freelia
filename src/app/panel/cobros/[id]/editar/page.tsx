import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { loadCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";
import { ErrorNote, InvoiceForm } from "../../../_forms";
import type { Invoice } from "@/lib/types";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireCreative();
  const [{ data }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single(),
    supabase.from("clients").select("id, name, company"),
  ]);
  if (!data) notFound();
  const inv = data as Invoice;
  inv.invoice_items?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return (
    <>
      <PageHeader title={`Editar cuenta de cobro N.º ${inv.number}`} back={{ href: `/panel/cobros/${id}`, label: inv.concept }} />
      <ErrorNote error={error} />
      <InvoiceForm invoice={inv} clients={clients ?? []} catalog={await loadCatalog(supabase)} />
    </>
  );
}
