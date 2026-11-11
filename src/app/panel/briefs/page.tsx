import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
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
            className={cn("btn btn-sm", estado === t.k ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2")}>{t.l}</Link>
        ))}
      </div>
      <RowList empty={<EmptyState title="No hay briefs aquí" text="Crea un brief o espera a que tus clientes te envíen solicitudes desde su cuenta." />}>
        {briefs.map((b) => (
          <Row key={b.id} href={`/panel/briefs/${b.id}`} status={b.status} title={b.title}
            sub={`${clientLabel(b.clients)}${b.created_by !== user.id ? " · solicitud del cliente" : ""} · entrega ${fmtDate(b.deadline)}`}
            pill={<StatusBadge status={b.status} />} />
        ))}
      </RowList>
    </>
  );
}
