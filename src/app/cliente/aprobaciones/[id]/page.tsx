import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { CommentThread } from "@/components/shared";
import type { Post, PostComment } from "@/lib/types";
import { FORMATS, NETWORKS, fmtDateTime } from "@/lib/utils";
import { reviewPost } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const { supabase, user } = await requireClient();
  const [{ data }, { data: comments }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).single(),
    supabase.from("post_comments").select("*, profiles(full_name)").eq("post_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  const p = data as Post;
  const isVideo = p.asset_url && /\.(mp4|mov|webm)$/i.test(p.asset_url);

  return (
    <>
      <PageHeader back={{ href: "/cliente/aprobaciones", label: "Aprobaciones" }} title={p.title}
        subtitle={<span className="flex flex-wrap items-center gap-2 mt-1"><StatusBadge status={p.status} />
          <span className="text-[12px]">{NETWORKS[p.network]} · {FORMATS[p.format]} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</span></span>} />

      {error && <p className="mb-5 rounded-xl bg-rosa text-[#b13a68] px-4 py-3 text-[13px]">{error}</p>}
      {ok === "aprobado" && <p className="mb-5 rounded-xl bg-menta text-[#2c7a57] px-4 py-3 text-[13px]">¡Listo! Aprobaste la pieza y tu equipo ya fue notificado.</p>}
      {ok === "cambios" && <p className="mb-5 rounded-xl bg-cielo px-4 py-3 text-[13px]">Enviamos tus comentarios al equipo creativo.</p>}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="card overflow-hidden">
          {p.asset_url ? (
            isVideo ? <video src={p.asset_url} controls className="w-full max-h-[70vh] bg-surface" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={p.asset_url} alt={p.title} className="w-full max-h-[70vh] object-contain bg-surface min-h-[240px]" />
          ) : <div className="aspect-video bg-lavanda flex items-center justify-center text-muted">Sin arte adjunto</div>}
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
              <h3 className="font-medium">¿Qué te parece?</h3>
              <form action={reviewPost}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="aprobado" />
                <SubmitButton className="btn btn-primary w-full h-11" pendingText="Aprobando…">✓ Aprobar pieza</SubmitButton>
              </form>
              <div className="text-center text-[11px] text-muted">o</div>
              <form action={reviewPost} className="space-y-2">
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="cambios" />
                <textarea name="comment" rows={4} className="input" placeholder="Describe los cambios que necesitas…" required />
                <SubmitButton className="btn btn-soft w-full" pendingText="Enviando…">Pedir cambios</SubmitButton>
              </form>
            </div>
          )}
          <CommentThread comments={(comments ?? []) as PostComment[]} postId={p.id} path={`/cliente/aprobaciones/${p.id}`} userId={user.id} />
        </div>
      </div>
    </>
  );
}
