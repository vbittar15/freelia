import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
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

  return (
    <>
      <PageHeader title="Aprobaciones" subtitle="Revisa las piezas, apruébalas o pide cambios." />
      <div className="flex gap-1 mb-5">
        <Link href="/cliente/aprobaciones" className={cn("btn btn-sm", !all ? "bg-ink text-white" : "btn-ghost")}>Pendientes</Link>
        <Link href="/cliente/aprobaciones?ver=todas" className={cn("btn btn-sm", all ? "bg-ink text-white" : "btn-ghost")}>Todas</Link>
      </div>
      {posts.length === 0 ? (
        <EmptyState title={all ? "Aún no hay piezas" : "Todo aprobado"} text={all ? undefined : "Cuando tu equipo te envíe piezas, aparecerán aquí."} />
      ) : (
        <div className="card divide-y divide-line">
          {posts.map((p) => (
            <Link key={p.id} href={`/cliente/aprobaciones/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-surface/60">
              {p.asset_url && !/\.(mp4|mov|webm)$/i.test(p.asset_url)
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.asset_url} alt="" className="size-14 rounded-xl object-cover bg-surface shrink-0" />
                : <div className="size-14 rounded-xl bg-lavanda shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.title}</div>
                <div className="text-[12px] text-muted">{NETWORKS[p.network]} · {FORMATS[p.format]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</div>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
