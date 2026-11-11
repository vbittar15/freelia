import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { KindPicker } from "@/components/request-fields";
import { kindMap } from "@/lib/requests";
import { BriefForm, ErrorNote } from "../../_forms";

export const metadata = { title: "Nueva solicitud" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; cliente?: string; tipo?: string }> }) {
  const { error, cliente, tipo } = await searchParams;
  const { supabase, user } = await requireCreative();
  const { data: clients } = await supabase.from("clients").select("id, name, company").eq("archived", false).order("company");
  const kind = kindMap[tipo ?? ""] ?? kindMap.proyecto;
  const q = (k: string) => `/panel/briefs/nuevo?tipo=${k}${cliente ? `&cliente=${cliente}` : ""}`;
  return (
    <>
      <PageHeader title="Nueva solicitud" subtitle="Regístrala tú si el cliente te la pidió por otro medio." back={{ href: "/panel/briefs", label: "Solicitudes" }} />
      <ErrorNote error={error} />
      {clients?.length ? (
        <>
          <KindPicker current={kind.key} href={q} />
          <div className="mt-6"><BriefForm key={kind.key} clients={clients} clientId={cliente} userId={user.id} kind={kind} /></div>
        </>
      ) : <EmptyState title="Primero crea un cliente" action={<Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />}
    </>
  );
}
