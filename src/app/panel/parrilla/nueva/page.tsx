import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { ErrorNote, PostForm } from "../../_forms";
import { FORMATS } from "@/lib/utils";
import { pieceWord, rankedFormats, usesSocial, withDefaults, workLabel } from "@/lib/rubros";

export const metadata = { title: "Nueva pieza" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string; fecha?: string; brief?: string }> }) {
  const { error, cliente, fecha, brief } = await searchParams;
  const { supabase, user, profile } = await requireCreative();
  const sp = profile.specialties ?? [];
  const word = pieceWord(sp);
  const nets = withDefaults(profile.settings).networks;
  const [{ data: clients }, { data: briefs }] = await Promise.all([
    supabase.from("clients").select("id, name, company").eq("archived", false).order("company"),
    supabase.from("briefs").select("id, title, client_id").neq("status", "completado").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageHeader title={`Nueva ${word}`} back={{ href: "/panel/parrilla", label: workLabel(sp) }} />
      <ErrorNote error={error} />
      {clients?.length ? <PostForm clients={clients} userId={user.id} clientId={cliente} date={fecha} briefs={briefs ?? []} briefId={brief} word={word}
        formats={rankedFormats(sp, FORMATS)} networks={nets.length ? nets : usesSocial(sp) ? undefined : ["entrega"]} />
        : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
