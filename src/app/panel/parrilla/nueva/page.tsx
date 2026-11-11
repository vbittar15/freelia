import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, PostForm } from "../../_forms";

export const metadata = { title: "Nueva pieza" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string; fecha?: string; brief?: string }> }) {
  const { error, cliente, fecha, brief } = await searchParams;
  const { supabase, user } = await requireCreative();
  const [{ data: clients }, { data: briefs }] = await Promise.all([
    supabase.from("clients").select("id, name, company").eq("archived", false).order("company"),
    supabase.from("briefs").select("id, title, client_id").neq("status", "completado").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageHeader title="Nueva pieza" back={{ href: "/panel/parrilla", label: "Parrilla" }} />
      <ErrorNote error={error} />
      {clients?.length ? <PostForm clients={clients} userId={user.id} clientId={cliente} date={fecha} briefs={briefs ?? []} briefId={brief} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
