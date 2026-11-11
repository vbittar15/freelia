import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, Notice, PageHeader, Section, StatusBadge } from "@/components/ui";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { BriefView } from "@/components/brief-view";
import { StageTrack } from "@/components/request-fields";
import type { Brief, Post } from "@/lib/types";
import { kindOf, stageOf, stagesFor } from "@/lib/requests";
import { NETWORKS, clientLabel, fmtDateTime, isoToBogotaLocal } from "@/lib/utils";
import { ErrorNote } from "../../_forms";
import { confirmMeeting, deleteBrief, deliverBrief, linkPosts, setBriefStatus, unlinkPost } from "../../actions";
import { Icon, IconTile } from "@/components/icons";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; n?: string; error?: string }> }) {
  const { id } = await params;
  const { ok, n, error } = await searchParams;
  const { supabase, user } = await requireCreative();
  const { data } = await supabase.from("briefs").select("*, clients(name, company, color)").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  const kind = kindOf(b);
  const [{ data: linked }, { data: loose }] = await Promise.all([
    supabase.from("posts").select("*").eq("brief_id", id),
    kind.material
      ? supabase.from("posts").select("*").eq("client_id", b.client_id).is("brief_id", null).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(60)
      : Promise.resolve({ data: [] }),
  ]);
  const posts = (linked ?? []) as Post[];
  const free = (loose ?? []) as Post[];
  const stage = stageOf(b, posts);
  const toSend = posts.filter((p) => p.status === "borrador" || p.status === "cambios").length;
  const inReview = posts.filter((p) => p.status === "en_revision").length;
  const approved = posts.filter((p) => p.status === "aprobado" || p.status === "publicado").length;
  const delivered = posts.filter((p) => p.status === "entregado").length;
  const newPiece = `/panel/parrilla/nueva?cliente=${b.client_id}&brief=${b.id}`;

  // Siguiente paso sugerido
  const next =
    kind.key === "reunion" ? (b.meeting_at ? null : "Confirma la fecha y el enlace de la reunión.")
    : !posts.length ? "Crea el material de esta solicitud."
    : toSend ? `Tienes ${toSend} ${toSend === 1 ? "pieza lista" : "piezas listas"} para enviar a revisión.`
    : inReview ? `Esperando que el cliente revise ${inReview} ${inReview === 1 ? "pieza" : "piezas"}.`
    : approved ? "Todo aprobado: entrega los archivos finales."
    : b.delivered_at ? "Solicitud entregada." : null;

  return (
    <>
      <PageHeader
        back={{ href: "/panel/briefs", label: "Solicitudes" }}
        title={b.title}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${b.client_id}`}><ClientChip name={clientLabel(b.clients)} color={b.clients?.color} /></Link>
          <span className="badge bg-surface text-ink inline-flex items-center gap-1.5"><Icon name={kind.icon} className="size-4" /> {kind.label}</span>
          {b.created_by !== user.id && <span className="badge bg-lila-t text-ink">Pedida por el cliente</span>}
        </span>}
        actions={<>
          {kind.material && <Link href={newPiece} className="btn btn-primary">+ Material</Link>}
          <Link href={`/panel/cotizaciones/nueva?cliente=${b.client_id}`} className="btn btn-soft">Cotizar</Link>
          <Link href={`/panel/briefs/${b.id}/editar`} className="btn btn-ghost">Editar</Link>
        </>}
      />
      <ErrorNote error={error} />
      {ok === "reunion" && <div className="mb-5"><Notice tone="ok">Reunión confirmada. Tu cliente ya recibió la fecha y el enlace.</Notice></div>}
      {ok === "entrega" && <div className="mb-5"><Notice tone="ok">¡Entregado! {n} {n === "1" ? "pieza quedó lista" : "piezas quedaron listas"} para que tu cliente las descargue.</Notice></div>}

      <div className="card p-5 sm:p-6 mb-6">
        <StageTrack stages={stagesFor(kind)} current={stage} />
        {next && <p className="mt-4 text-[14px]"><b>Siguiente paso:</b> {next}</p>}
      </div>

      {kind.key === "reunion" && (
        <section className="mb-6 rounded-[22px] bg-azul-t p-5 sm:p-6">
          <h2 className="h2">{b.meeting_at ? "Reunión confirmada" : "Confirmar reunión"}</h2>
          <form action={confirmMeeting} className="mt-4 grid sm:grid-cols-[220px_minmax(0,1fr)_auto] gap-3 items-end">
            <input type="hidden" name="id" value={b.id} />
            <label className="block"><span className="label">Fecha y hora</span>
              <input name="meeting_at" type="datetime-local" required className="input" defaultValue={b.meeting_at ? isoToBogotaLocal(b.meeting_at) : ""} /></label>
            <label className="block"><span className="label">Enlace o lugar</span>
              <input name="meeting_link" className="input" defaultValue={b.meeting_link ?? ""} placeholder="https://meet.google.com/… o dirección" /></label>
            <SubmitButton>{b.meeting_at ? "Actualizar" : "Confirmar"}</SubmitButton>
          </form>
          {b.meeting_at && <p className="mt-3 text-[13px] text-muted">Programada para {fmtDateTime(b.meeting_at)}. Si la cambias, le avisamos al cliente.</p>}
        </section>
      )}

      {kind.material && (
        <Section title="Material" count={posts.length} className="mb-6"
          action={<Link href={newPiece} className="btn btn-soft btn-sm">+ Material</Link>}>
          <div className={posts.length ? "card p-5 sm:p-6" : ""}>
            {posts.length === 0 ? (
              <EmptyState title="Aún no hay material"
                text="Sube aquí los diseños, videos, documentos o enlaces de esta solicitud. Cuando estén listos, los envías juntos a revisión."
                action={<Link href={newPiece} className="btn btn-primary">Subir el primer material</Link>} />
            ) : (
              <>
                <BriefProgress posts={posts} />
                <div className="mt-5">
                  <BriefPostRows posts={posts} hrefFor={(p) => `/panel/parrilla/${p.id}`} actions={(p) => (
                    <form action={unlinkPost}>
                      <input type="hidden" name="id" value={b.id} />
                      <input type="hidden" name="post_id" value={p.id} />
                      <button className="btn btn-ghost btn-sm !px-2.5" title="Quitar de la solicitud" aria-label={`Quitar ${p.title} de la solicitud`}><Icon name="x" className="size-4" strokeWidth={2.2} /></button>
                    </form>
                  )} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {toSend > 0 && <Link href={`/panel/enviar?brief=${b.id}`} className="btn btn-primary">Enviar a revisión ({toSend})</Link>}
                  {approved > 0 && (
                    <form action={deliverBrief}>
                      <input type="hidden" name="id" value={b.id} />
                      <SubmitButton className="btn btn-approve" pendingText="Entregando…"><Icon name="box" className="size-[18px]" /> Entregar {approved + delivered === posts.length ? "todo" : `${approved} aprobadas`}</SubmitButton>
                    </form>
                  )}
                  {approved > 0 && <span className="text-[13px] text-muted">Para subir archivos finales distintos, ábrelos uno por uno antes de entregar.</span>}
                </div>
              </>
            )}
            {free.length > 0 && (
              <details className="mt-5 group rounded-[18px] bg-surface p-4">
                <summary className="cursor-pointer font-semibold text-[14px] list-none flex items-center justify-between">
                  Agregar material que ya existe ({free.length})
                  <span className="text-muted transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <form action={linkPosts} className="mt-3">
                  <input type="hidden" name="id" value={b.id} />
                  <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                    {free.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 rounded-[14px] bg-white px-3 py-2.5 cursor-pointer hover:ring-2 hover:ring-brand/20">
                        <input type="checkbox" name="post_ids" value={p.id} className="size-4 accent-[#3d5bf5]" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-[14px] truncate">{p.title}</span>
                          <span className="block text-[12px] text-muted">{NETWORKS[p.network] ?? p.network} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</span>
                        </span>
                        <StatusBadge status={p.status} />
                      </label>
                    ))}
                  </div>
                  <SubmitButton className="btn btn-soft mt-3">Agregar seleccionado</SubmitButton>
                </form>
              </details>
            )}
          </div>
        </Section>
      )}

      <Section title="Lo que pidió" className="mb-6"><BriefView brief={b} /></Section>

      <div className="flex flex-wrap gap-2">
        {b.status !== "completado" && (
          <form action={setBriefStatus}>
            <input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="completado" />
            <SubmitButton className="btn btn-ghost btn-sm">Marcar como completada</SubmitButton>
          </form>
        )}
        <form action={deleteBrief}>
          <input type="hidden" name="id" value={b.id} />
          <ConfirmSubmit message="¿Eliminar esta solicitud? El material no se borra.">Eliminar solicitud</ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
