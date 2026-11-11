import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, Section, StatusBadge } from "@/components/ui";
import { Lia } from "@/components/brand";
import type { Post } from "@/lib/types";
import { FORMATS, NETWORKS, cn, fmtDate, fmtDateTime } from "@/lib/utils";

export const metadata = { title: "Por revisar" };

const thumb = (p: Post) => {
  const u = p.asset_url ?? p.assets?.find((a) => /^image/.test(a.type))?.url;
  return u && !/\.(mp4|mov|webm)$/i.test(u)
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={u} alt="" className="size-12 rounded-[14px] object-cover bg-lila-t shrink-0" /> : undefined;
};
const sub = (p: Post) => [p.social !== false ? NETWORKS[p.network] : null, FORMATS[p.format], p.scheduled_at ? fmtDateTime(p.scheduled_at) : null].filter(Boolean).join(" · ");

export default async function Page({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const hist = ver === "historial";
  const { supabase } = await requireClient();
  const { data } = await supabase.from("posts").select("*").neq("status", "borrador").order("updated_at", { ascending: false }).limit(200);
  const posts = (data ?? []) as Post[];
  const pending = posts.filter((p) => p.status === "en_revision");
  const reqIds = [...new Set(pending.map((p) => p.review_request_id).filter(Boolean))] as string[];
  const { data: rd } = reqIds.length
    ? await supabase.from("review_requests").select("id, message, created_at").in("id", reqIds).order("created_at", { ascending: false })
    : { data: [] as { id: string; message: string | null; created_at: string }[] };
  const loose = pending.filter((p) => !p.review_request_id);
  const ready = posts.filter((p) => p.status === "entregado");

  return (
    <>
      <PageHeader title="Por revisar" subtitle="Aprueba el material o marca lo que quieres cambiar." />
      <div className="flex gap-1 mb-6 rounded-full bg-surface p-1 w-fit">
        <Link href="/cliente/aprobaciones" className={cn("btn btn-sm", !hist ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Pendiente{pending.length ? ` · ${pending.length}` : ""}</Link>
        <Link href="/cliente/aprobaciones?ver=historial" className={cn("btn btn-sm", hist ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>Historial</Link>
      </div>

      {hist ? (
        <RowList empty={<EmptyState title="Aún no hay material" />}>
          {posts.map((p) => <Row key={p.id} href={`/cliente/aprobaciones/${p.id}`} status={p.status} title={p.title} icon={thumb(p)} sub={sub(p)} pill={<StatusBadge status={p.status} />} />)}
        </RowList>
      ) : pending.length === 0 ? (
        <div className="card flex flex-col items-center text-center px-6 py-12">
          <Lia size={64} mood="happy" color="#2FBF7A" />
          <div className="font-semibold text-[18px] mt-3">Estás al día</div>
          <p className="text-muted text-[14px] mt-1">Cuando tu equipo te envíe material, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(rd ?? []).map((r) => {
            const ps = pending.filter((p) => p.review_request_id === r.id);
            const fix = ps.some((p) => (p.round ?? 1) > 1);
            return (
              <section key={r.id} className="card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[17px]">{fix ? "Correcciones" : "Material nuevo"} · {ps.length} {ps.length === 1 ? "pieza" : "piezas"}</div>
                    <div className="text-[13px] text-muted truncate">{r.message || `Enviado el ${fmtDate(r.created_at)}`}</div>
                  </div>
                  <Link href={`/cliente/revisar/${r.id}`} className="btn btn-primary shrink-0">Empezar revisión →</Link>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {ps.map((p) => (
                    <Link key={p.id} href={`/cliente/aprobaciones/${p.id}?r=${r.id}`} className="shrink-0 w-28">
                      {thumb(p) ? <span className="block [&>img]:size-28 [&>img]:rounded-[16px]">{thumb(p)}</span>
                        : <span className="size-28 rounded-[16px] bg-azul-t grid place-items-center"><Lia size={36} mood="right" /></span>}
                      <span className="block mt-1.5 text-[12px] font-semibold truncate">{p.title}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          {loose.length > 0 && (
            <Section title="Otras piezas" count={loose.length}>
              <RowList>{loose.map((p) => <Row key={p.id} href={`/cliente/aprobaciones/${p.id}`} status={p.status} title={p.title} icon={thumb(p)} sub={sub(p)} pill={<StatusBadge status={p.status} />} />)}</RowList>
            </Section>
          )}
        </div>
      )}
      {!hist && ready.length > 0 && (
        <Section title="Listo para descargar" count={ready.length} className="mt-8">
          <RowList>{ready.slice(0, 6).map((p) => <Row key={p.id} href={`/cliente/aprobaciones/${p.id}`} status="entregado" title={p.title} icon={thumb(p)} sub="Archivos finales disponibles" pill={<StatusBadge status="entregado" />} />)}</RowList>
        </Section>
      )}
    </>
  );
}
