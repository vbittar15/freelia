import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import type { Client } from "@/lib/types";

export const metadata = { title: "Clientes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ archivados?: string }> }) {
  const { archivados } = await searchParams;
  const showArchived = archivados === "1";
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("clients").select("*").eq("archived", showArchived).order("created_at", { ascending: false });
  const clients = (data ?? []) as Client[];

  return (
    <>
      <PageHeader
        title={showArchived ? "Clientes archivados" : "Clientes"}
        subtitle={showArchived ? undefined : "Las marcas y personas con las que trabajas."}
        actions={<>
          <Link href={showArchived ? "/panel/clientes" : "/panel/clientes?archivados=1"} className="btn btn-ghost">
            {showArchived ? "Ver activos" : "Archivados"}
          </Link>
          {!showArchived && <Link href="/panel/clientes/nuevo" className="btn btn-primary">+ Nuevo cliente</Link>}
        </>}
      />
      {clients.length === 0 ? (
        <EmptyState title={showArchived ? "No hay clientes archivados" : "Aún no tienes clientes"}
          text={showArchived ? undefined : "Crea tu primer cliente para empezar a organizar briefs, parrilla y cobros."}
          action={!showArchived && <Link href="/panel/clientes/nuevo" className="btn btn-primary">Crear cliente</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/panel/clientes/${c.id}`} className="card p-5 hover:border-brand/40 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar name={c.company || c.name} size={40} color={c.color} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.company || c.name}</div>
                  <div className="text-[12px] text-muted truncate">{c.company ? c.name : c.email}</div>
                </div>
              </div>
              <div className="mt-4">
                {c.client_user_id
                  ? <span className="badge bg-menta text-[#2c7a57]"><span className="dot" />Conectado a Freelia</span>
                  : <span className="badge bg-surface text-muted"><span className="dot" />Sin invitar</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
