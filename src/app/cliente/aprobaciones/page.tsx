import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Post } from "@/lib/types";
import { FORMATS, NETWORKS, cn, fmtDateTime } from "@/lib/utils";

export const metadata = { title: "Aprobaciones" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const all = ver === "todas";
  const { supabase } = await requireClient();
  let q = supabase.from("posts").select("*, clients(name, company, color)");
  if (!all) q = q.eq("status", "en_revision");
  const { data } = await q.order("scheduled_at", { ascending: !all, nullsFirst: false });
  const posts = (data ?? []) as Post[];
  const reqIds = [...new Set(posts.filter((p) => p.status === "en_revision" && p.review_request_id).map((p) => p.review_request_id!))];

  return (
    <>
      <PageHeader title="Por aprobar" subtitle="Revisa las piezas, apruébalas o pide cambios." />
      {!all && reqIds.length > 0 && (
        <div className="mb-5 rounded-[22px] bg-azul-t p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold">Revísalas una por una</div>
            <div className="text-[13px] text-muted">Pasas de una pieza a la siguiente sin volver a la lista.</div>
          </div>
          <Link href={`/cliente/revisar/${reqIds[0]}`} className="btn btn-primary btn-sm shrink-0">Empezar revisión →</Link>
        </div>
      )}
      <div className="flex gap-1 mb-5">
        <Link href="/cliente/aprobaciones" className={cn("btn btn-sm", !all ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2")}>Pendientes</Link>
        <Link href="/cliente/aprobaciones?ver=todas" className={cn("btn btn-sm", all ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2")}>Todas</Link>
      </div>
      <RowList empty={<EmptyState title={all ? "Aún no hay piezas" : "Todo aprobado"} text={all ? undefined : "Cuando tu equipo te envíe piezas, aparecerán aquí."} />}>
        {posts.map((p) => (
          <Row key={p.id} href={`/cliente/aprobaciones/${p.id}${p.review_request_id && p.status === "en_revision" ? `?r=${p.review_request_id}` : ""}`} status={p.status} title={p.title}
            icon={p.asset_url && !/\.(mp4|mov|webm)$/i.test(p.asset_url)
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={p.asset_url} alt="" className="size-12 rounded-[14px] object-cover bg-lila-t shrink-0" /> : undefined}
            sub={`${NETWORKS[p.network]} · ${FORMATS[p.format]} · ${p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}`}
            pill={<StatusBadge status={p.status} />} />
        ))}
      </RowList>
    </>
  );
}
