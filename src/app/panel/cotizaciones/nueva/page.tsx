import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, QuoteForm } from "../../_forms";
import { loadCatalog } from "@/lib/catalog";
import { withDefaults } from "@/lib/rubros";

const plusDays = (d: number) => new Date(Date.now() - 5 * 3600000 + d * 86400000).toISOString().slice(0, 10);


export const metadata = { title: "Nueva cotización" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string }> }) {
  const { error, cliente } = await searchParams;
  const { supabase, profile } = await requireCreative();
  const st = withDefaults(profile.settings);
  const catalog = await loadCatalog(supabase);
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  return (
    <>
      <PageHeader title="Nueva cotización" back={{ href: "/panel/cotizaciones", label: "Cotizaciones" }} />
      <ErrorNote error={error} />
      {clients?.length ? <QuoteForm clients={clients} clientId={cliente} catalog={catalog} defaults={{ valid_until: plusDays(st.quote_valid_days), notes: st.quote_notes }} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
