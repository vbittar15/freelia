import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { BriefForm, ErrorNote } from "../../_forms";

export const metadata = { title: "Nuevo brief" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string }> }) {
  const { error, cliente } = await searchParams;
  const { supabase, user } = await requireCreative();
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  return (
    <>
      <PageHeader title="Nuevo brief" back={{ href: "/panel/briefs", label: "Briefs" }} />
      <ErrorNote error={error} />
      {clients?.length ? <BriefForm clients={clients} clientId={cliente} userId={user.id} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
