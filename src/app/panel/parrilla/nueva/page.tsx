import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, PostForm } from "../../_forms";

export const metadata = { title: "Nueva pieza" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string; fecha?: string }> }) {
  const { error, cliente, fecha } = await searchParams;
  const { supabase, user } = await requireCreative();
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  return (
    <>
      <PageHeader title="Nueva pieza" back={{ href: "/panel/parrilla", label: "Parrilla" }} />
      <ErrorNote error={error} />
      {clients?.length ? <PostForm clients={clients} userId={user.id} clientId={cliente} date={fecha} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
