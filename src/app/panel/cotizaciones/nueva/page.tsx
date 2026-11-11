import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, QuoteForm } from "../../_forms";

export const metadata = { title: "Nueva cotización" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string }> }) {
  const { error, cliente } = await searchParams;
  const { supabase } = await requireCreative();
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  return (
    <>
      <PageHeader title="Nueva cotización" back={{ href: "/panel/cotizaciones", label: "Cotizaciones" }} />
      <ErrorNote error={error} />
      {clients?.length ? <QuoteForm clients={clients} clientId={cliente} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
