import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, Notice, PageHeader, Section, StatusBadge } from "@/components/ui";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { BriefView } from "@/components/brief-view";
import type { Brief, Post } from "@/lib/types";
import { NETWORKS, clientLabel, fmtDateTime } from "@/lib/utils";
import { deleteBrief, linkPosts, sendBriefForReview, setBriefStatus, unlinkPost } from "../../actions";

const NEXT: Record<string, { status: string; label: string } | null> = {
  nuevo: { status: "en_proceso", label: "Empezar a trabajar" },
  en_proceso: { status: "completado", label: "Marcar como completado" },
  completado: null,
};

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ enviada?: string }> }) {
  const { id } = await params;
  const { enviada } = await searchParams;
  const { supabase, user } = await requireCreative();
  const { data } = await supabase.from("briefs").select("*, clients(name, company, color)").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  const next = NEXT[b.status];
  const [{ data: linked }, { data: loose }] = await Promise.all([
    supabase.from("posts").select("*").eq("brief_id", id),
    supabase.from("posts").select("*").eq("client_id", b.client_id).is("brief_id", null).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(60),
  ]);
  const posts = (linked ?? []) as Post[];
  const free = (loose ?? []) as Post[];
  const pending = posts.filter((p) => p.status === "borrador" || p.status === "cambios").length;
  const inReview = posts.filter((p) => p.status === "en_revision").length;
  const newPiece = `/panel/parrilla/nueva?cliente=${b.client_id}&brief=${b.id}`;

  return (
    <>
      <PageHeader
        back={{ href: "/panel/briefs", label: "Briefs" }}
        title={b.title}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${b.client_id}`}><ClientChip name={clientLabel(b.clients)} color={b.clients?.color} /></Link>
          <StatusBadge status={b.status} />
          {b.created_by !== user.id && <span className="badge bg-lila-t text-ink">Solicitud del cliente</span>}
        </span>}
        actions={<>
          {next && (
            <form action={setBriefStatus}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="status" value={next.status} />
              <SubmitButton>{next.label}</SubmitButton>
            </form>
          )}
          <Link href={newPiece} className="btn btn-soft">Crear pieza</Link>
          <Link href={`/panel/cotizaciones/nueva?cliente=${b.client_id}`} className="btn btn-soft">Cotizar</Link>
          <Link href={`/panel/briefs/${b.id}/editar`} className="btn btn-ghost">Editar</Link>
        </>}
      />
      {enviada && <div className="mb-5"><Notice tone="ok">{Number(enviada) > 0 ? `Listo: enviaste ${enviada} ${enviada === "1" ? "pieza" : "piezas"} a aprobación. Tu cliente recibió una sola notificación con toda la parrilla.` : "No había piezas en borrador o con cambios para enviar."}</Notice></div>}

      <Section title="Parrilla del pedido" count={posts.length} className="mb-6"
        action={<Link href={newPiece} className="btn btn-soft btn-sm">+ Pieza</Link>}>
        <div className={posts.length ? "card p-5 sm:p-6" : ""}>
          {posts.length === 0 ? (
            <EmptyState title="Aún no hay piezas en este pedido"
              text="Crea las piezas aquí o vincula las que ya tienes en la parrilla. Cuando estén listas, las envías juntas a aprobación."
              action={<Link href={newPiece} className="btn btn-primary">Crear primera pieza</Link>} />
          ) : (
            <>
              <BriefProgress posts={posts} />
              <div className="mt-5">
                <BriefPostRows posts={posts} hrefFor={(p) => `/panel/parrilla/${p.id}`} actions={(p) => (
                  <form action={unlinkPost}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="post_id" value={p.id} />
                    <button className="btn btn-ghost btn-sm !px-2.5" title="Quitar del pedido" aria-label={`Quitar ${p.title} del pedido`}>✕</button>
                  </form>
                )} />
              </div>
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                {pending > 0 ? (
                  <form action={sendBriefForReview}>
                    <input type="hidden" name="id" value={b.id} />
                    <SubmitButton className="btn btn-approve" pendingText="Enviando…">Enviar parrilla a aprobación ({pending})</SubmitButton>
                  </form>
                ) : null}
                <p className="text-[13px] text-muted">
                  {pending > 0 ? "Se envían todas las piezas en borrador o con cambios, con una sola notificación al cliente."
                    : inReview > 0 ? `${inReview} ${inReview === 1 ? "pieza espera" : "piezas esperan"} la aprobación del cliente.`
                    : "Todo al día en este pedido ✨"}
                </p>
              </div>
            </>
          )}
          {free.length > 0 && (
            <details className="mt-5 group rounded-[18px] bg-surface p-4">
              <summary className="cursor-pointer font-semibold text-[14px] list-none flex items-center justify-between">
                Vincular piezas que ya existen ({free.length})
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
                <SubmitButton className="btn btn-soft mt-3">Vincular seleccionadas</SubmitButton>
              </form>
            </details>
          )}
        </div>
      </Section>

      <BriefView brief={b} />
      <form action={deleteBrief} className="mt-6">
        <input type="hidden" name="id" value={b.id} />
        <ConfirmSubmit message="¿Eliminar este brief?">Eliminar brief</ConfirmSubmit>
      </form>
    </>
  );
}
