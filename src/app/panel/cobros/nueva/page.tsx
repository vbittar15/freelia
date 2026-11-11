import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, InvoiceForm } from "../../_forms";
import { loadCatalog } from "@/lib/catalog";
import { withDefaults } from "@/lib/rubros";

const plusDays = (d: number) => new Date(Date.now() - 5 * 3600000 + d * 86400000).toISOString().slice(0, 10);


export const metadata = { title: "Nueva cuenta de cobro" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string }> }) {
  const { error, cliente } = await searchParams;
  const { supabase, profile } = await requireCreative();
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  const missing = !profile.document_id || !profile.bank_info;
  const st = withDefaults(profile.settings);
  const catalog = await loadCatalog(supabase);
  return (
    <>
      <PageHeader title="Nueva cuenta de cobro" back={{ href: "/panel/cobros", label: "Cobros" }} />
      <ErrorNote error={error} />
      {missing && (
        <p className="mb-5 rounded-[18px] bg-amarillo-t px-4 py-3 text-[14px]">
          Completa tu cédula/NIT y datos bancarios en <Link href="/panel/perfil" className="text-brand font-medium">tu perfil</Link> para que aparezcan en la cuenta de cobro.
        </p>
      )}
      {clients?.length ? <InvoiceForm clients={clients} clientId={cliente} catalog={catalog} defaults={{ due_date: plusDays(st.invoice_due_days), notes: st.invoice_notes }} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
