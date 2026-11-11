import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import type { Brief } from "@/lib/types";
import { clientLabel, cn, fmtDate } from "@/lib/utils";

export const metadata = { title: "Briefs" };

const TABS = [
  { k: "", l: "Todos" }, { k: "nuevo", l: "Nuevos" }, { k: "en_proceso", l: "En proceso" }, { k: "completado", l: "Completados" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado = "" } = await searchParams;
  const { supabase, user } = await requireCreative();
  let q = supabase.from("briefs").select("*, clients(name, company, color)").order("created_at", { ascending: false });
  if (estado) q = q.eq("status", estado);
  const { data } = await q;
  const briefs = (data ?? []) as Brief[];

  return (
    <>
      <PageHeader title="Briefs y solicitudes" subtitle="Lo que tus clientes necesitan, bien aterrizado."
        actions={<Link href="/panel/briefs/nuevo" className="btn btn-primary">+ Nuevo brief</Link>} />
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.k} href={t.k ? `/panel/briefs?estado=${t.k}` : "/panel/briefs"}
            className={cn("btn btn-sm", estado === t.k ? "bg-ink text-white" : "btn-ghost")}>{t.l}</Link>
        ))}
      </div>
      {briefs.length === 0 ? (
        <EmptyState title="No hay briefs aquí" text="Crea un brief o espera a que tus clientes te envíen solicitudes desde su cuenta." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Proyecto</th><th>Cliente</th><th>Entrega</th><th>Estado</th></tr></thead>
            <tbody>
              {briefs.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/panel/briefs/${b.id}`} className="font-medium hover:text-brand">{b.title}</Link>
                    {b.created_by !== user.id && <span className="ml-2 badge bg-lavanda text-[#5b49c9]">Solicitud del cliente</span>}</td>
                  <td><ClientChip name={clientLabel(b.clients)} color={b.clients?.color} /></td>
                  <td className="text-muted">{fmtDate(b.deadline)}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
