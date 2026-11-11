import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { CommentThread } from "@/components/shared";
import { PinBoard } from "@/components/pin-board";
import type { Post, PostComment } from "@/lib/types";
import { FORMATS, NETWORKS, fmtDateTime } from "@/lib/utils";
import { reviewPost } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string; r?: string; prev?: string }> }) {
  const { id } = await params;
  const { error, ok, r, prev } = await searchParams;
  const { supabase, user } = await requireClient();
  const [{ data }, { data: comments }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("post_comments").select("*, profiles(full_name)").eq("post_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  const p = data as Post;
  const isVideo = p.asset_url && /\.(mp4|mov|webm)$/i.test(p.asset_url);
  const all = (comments ?? []) as PostComment[];

  // Revisión en secuencia dentro de un envío
  let seq: { ids: string[]; idx: number; pending: number } | null = null;
  if (r) {
    const { data: req } = await supabase.from("review_requests").select("post_ids").eq("id", r).single();
    if (req) {
      const { data: rp } = await supabase.from("posts").select("id, status").in("id", req.post_ids)
        .order("scheduled_at", { ascending: true, nullsFirst: false });
      const ids = (rp ?? []).map((x) => x.id);
      seq = { ids, idx: ids.indexOf(p.id), pending: (rp ?? []).filter((x) => x.status === "en_revision").length };
    }
  }
  const round = p.round ?? 1;
  const lastAsk = round > 1 ? [...all].reverse().find((k) => k.action === "cambios") : undefined;
  const fixedPins = round > 1 ? all.filter((k) => k.x != null && k.resolved) : [];
  const q = r ? `?r=${r}` : "";

  return (
    <>
      {seq && seq.idx >= 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Link href={`/cliente/revisar/${r}`} className="text-[13px] font-semibold text-brand-dark hover:underline">← Envío</Link>
          <div className="flex-1 flex gap-1">
            {seq.ids.map((x, i) => <span key={x} className={`h-1.5 flex-1 rounded-full ${i === seq!.idx ? "bg-brand" : i < seq!.idx ? "bg-brand/40" : "bg-surface-2"}`} />)}
          </div>
          <span className="text-[13px] font-semibold tabular-nums">{seq.idx + 1} de {seq.ids.length}</span>
          <span className="flex gap-1">
            {seq.idx > 0 && <Link href={`/cliente/aprobaciones/${seq.ids[seq.idx - 1]}${q}`} aria-label="Anterior" className="btn btn-sm btn-ghost !px-2.5">‹</Link>}
            {seq.idx < seq.ids.length - 1 && <Link href={`/cliente/aprobaciones/${seq.ids[seq.idx + 1]}${q}`} aria-label="Siguiente" className="btn btn-sm btn-ghost !px-2.5">›</Link>}
          </span>
        </div>
      )}
      <PageHeader back={seq && seq.idx >= 0 ? undefined : { href: "/cliente/aprobaciones", label: "Aprobaciones" }} title={p.title}
        subtitle={<span className="flex flex-wrap items-center gap-2 mt-1"><StatusBadge status={p.status} />
          <span className="text-[12px]">{NETWORKS[p.network]} · {FORMATS[p.format]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</span></span>} />

      {error && <p className="mb-5 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{error}</p>}
      {prev && <p className="mb-4 text-[13px] text-muted anim-page">{prev === "aprobado" ? "✓ Aprobaste la anterior." : "📍 Enviamos tus cambios de la anterior."} Sigue con esta.</p>}
      {round > 1 && p.status === "en_revision" && (lastAsk?.body || fixedPins.length > 0) && (
        <div className="mb-5 rounded-[20px] bg-amarillo-t px-4 py-3.5">
          <div className="font-semibold text-[14px]">Corrección · ronda {round}</div>
          <div className="text-[13px] text-muted">Esto fue lo que pediste. Compruébalo en el arte:</div>
          {lastAsk?.body && <p className="mt-1.5 text-[14px]">“{lastAsk.body}”</p>}
          {fixedPins.length > 0 && <ul className="mt-1.5 space-y-0.5 text-[14px]">{fixedPins.map((k) => <li key={k.id}>✓ {k.body}</li>)}</ul>}
        </div>
      )}
      {ok === "aprobado" && <p className="mb-5 rounded-[18px] bg-verde-t text-ink px-4 py-3 text-[14px]">¡Listo! Aprobaste la pieza y tu equipo ya fue notificado.</p>}
      {ok === "cambios" && <p className="mb-5 rounded-[18px] bg-azul-t px-4 py-3 text-[14px]">Enviamos tus comentarios al equipo creativo.</p>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="card overflow-hidden">
          {p.asset_url ? (
            isVideo ? <video src={p.asset_url} controls className="w-full max-h-[70vh] bg-surface" />
              : <div className="p-3 sm:p-4"><PinBoard postId={p.id} imageUrl={p.asset_url} comments={all} userId={user.id} canResolve={false} /></div>
          ) : <div className="aspect-video bg-lila-t flex items-center justify-center text-muted">Sin arte adjunto</div>}
          {p.copy && (
            <div className="p-6 border-t border-line">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Copy</div>
              <p className="whitespace-pre-wrap leading-relaxed">{p.copy}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {p.status === "en_revision" && (
            <div className="card p-5 space-y-3">
              <h3 className="h2">¿Qué te parece?</h3>
              <form action={reviewPost}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="aprobado" />{r && <input type="hidden" name="r" value={r} />}
                <SubmitButton className="btn btn-approve btn-lg w-full" pendingText="Aprobando…">{seq && seq.pending > 1 ? "✓ Aprobar y seguir" : "✓ Aprobar"}</SubmitButton>
              </form>
              <div className="text-center text-[11px] text-muted">o</div>
              <form action={reviewPost} className="space-y-2">
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="cambios" />{r && <input type="hidden" name="r" value={r} />}
                <textarea name="comment" rows={4} className="input" placeholder={isVideo || !p.asset_url ? "Describe los cambios que necesitas…" : "Describe los cambios (o márcalos sobre el arte)…"} />
                <SubmitButton className="btn btn-changes btn-lg w-full" pendingText="Enviando…">{seq && seq.pending > 1 ? "Pedir cambios y seguir" : "Pedir cambios"}</SubmitButton>
              </form>
            </div>
          )}
          <CommentThread comments={(comments ?? []) as PostComment[]} postId={p.id} path={`/cliente/aprobaciones/${p.id}`} userId={user.id} />
        </div>
      </div>
    </>
  );
}
