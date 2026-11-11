import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, PageHeader, StatusBadge } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { CommentThread } from "@/components/shared";
import { AssetViewer } from "@/components/asset-viewer";
import { FilePicker } from "@/components/file-picker";
import type { Post, PostComment, PostVersion } from "@/lib/types";
import { clientLabel } from "@/lib/utils";
import { ErrorNote, PostForm } from "../../_forms";
import { FORMATS } from "@/lib/utils";
import { pieceWord, rankedFormats, usesSocial, withDefaults, workLabel } from "@/lib/rubros";
import { deletePost, deliverPost, setPostStatus } from "../../actions";
import { Icon } from "@/components/icons";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const { supabase, user, profile } = await requireCreative();
  const sp = profile.specialties ?? [];
  const nets = withDefaults(profile.settings).networks;
  const [{ data }, { data: comments }, { data: clients }] = await Promise.all([
    supabase.from("posts").select("*, clients(name, company, color, client_user_id)").eq("id", id).single(),
    supabase.from("post_comments").select("*, profiles(full_name)").eq("post_id", id).order("created_at"),
    supabase.from("clients").select("id, name, company"),
  ]);
  const { data: vers } = await supabase.from("post_versions").select("*").eq("post_id", id).order("round");
  const { data: briefs } = await supabase.from("briefs").select("id, title, client_id").order("created_at", { ascending: false });
  if (!data) notFound();
  const p = data as Post & { clients: { client_user_id: string | null } };

  return (
    <>
      <PageHeader
        back={{ href: "/panel/parrilla", label: workLabel(sp) }}
        title={p.title}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${p.client_id}`}><ClientChip name={clientLabel(p.clients)} color={p.clients?.color} /></Link>
          <StatusBadge status={p.status} />
          {p.brief_id && <Link href={`/panel/briefs/${p.brief_id}`} className="text-[13px] font-semibold text-brand-dark hover:underline">Ver solicitud →</Link>}
        </span>}
        actions={<>
          {p.status === "aprobado" && p.social !== false && (
            <form action={setPostStatus}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="publicado" />
              <SubmitButton className="btn btn-soft">Marcar como publicado</SubmitButton>
            </form>
          )}
          {p.status === "en_revision" && (
            <form action={setPostStatus}>
              <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="borrador" />
              <SubmitButton className="btn btn-ghost">Retirar de revisión</SubmitButton>
            </form>
          )}
        </>}
      />
      <ErrorNote error={error} />
      {ok && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-[18px] bg-verde-t px-4 py-3 text-[14px]">
          <span className="flex-1">{p.status === "cambios" ? "Corrección guardada. Cuando tengas listas las demás, reenvíalas juntas." : p.status === "borrador" ? "Pieza guardada en borrador." : "Cambios guardados."}</span>
          {(p.status === "borrador" || p.status === "cambios") && (
            <Link href={`/panel/enviar?cliente=${p.client_id}&ids=${p.id}`} className="btn btn-sm btn-primary shrink-0">Enviar a revisión →</Link>
          )}
        </div>
      )}

      {p.status === "cambios" && (() => {
        const all = (comments ?? []) as PostComment[];
        const last = [...all].reverse().find((k) => k.action === "cambios");
        const pins = all.filter((k) => k.x != null && !k.resolved);
        return (
          <section className="mb-6 rounded-[22px] bg-rosa-t p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="h2">Lo que pidió el cliente</h2>
              <span className="badge bg-white text-ink">Ronda {p.round ?? 1}</span>
            </div>
            {last?.body && <p className="mt-2 text-[15px] whitespace-pre-wrap">“{last.body}”</p>}
            {pins.length > 0 && (
              <ol className="mt-3 space-y-1.5">
                {pins.map((k) => (
                  <li key={k.id} className="flex gap-2 text-[14px]">
                    <span className="size-6 shrink-0 rounded-full bg-rosa text-white grid place-items-center"><Icon name="pin" className="size-3.5" /></span>
                    <span>{k.body}</span>
                  </li>
                ))}
              </ol>
            )}
            {!last?.body && pins.length === 0 && <p className="mt-2 text-[14px] text-muted">No dejó detalles; revisa los comentarios abajo.</p>}
            <p className="mt-3 text-[13px] text-muted">Corrige la pieza, guarda y luego reenvíala. Al reenviar, las marcas se dan por resueltas.</p>
          </section>
        );
      })()}
      {p.status === "en_revision" && p.review_request_id && (
        <p className="mb-5 text-[14px] text-muted">Enviada al cliente{(p.round ?? 1) > 1 ? ` · ronda ${p.round}` : ""}. <Link href={`/panel/envios/${p.review_request_id}`} className="font-semibold text-brand-dark hover:underline">Ver el envío →</Link></p>
      )}

      <PostForm post={p} clients={clients ?? []} userId={user.id} briefs={briefs ?? []} word={pieceWord(sp)}
        formats={rankedFormats(sp, FORMATS)} networks={nets.length ? nets : usesSocial(sp) ? undefined : ["entrega"]} />

      {(p.status === "aprobado" || p.status === "publicado" || p.status === "entregado") && (
        <section className="mt-8 rounded-[22px] bg-verde-t p-5 sm:p-6 max-w-3xl">
          <h2 className="h2"><span className="inline-flex items-center gap-2"><Icon name="box" className="size-5" />{p.status === "entregado" ? "Entregada al cliente" : "Entrega final"}</span></h2>
          <p className="text-[14px] text-muted mt-1 mb-4">
            {p.status === "entregado" ? "Tu cliente puede descargar estos archivos. Puedes actualizarlos." : "Sube los archivos finales (en alta, editables, por formato…). Si no subes nada, se entrega el material aprobado."}
          </p>
          <form action={deliverPost} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <FilePicker userId={user.id} name="final_files" initial={p.final_files ?? []} />
            <SubmitButton className="btn btn-primary" pendingText="Entregando…">{p.status === "entregado" ? "Actualizar entrega" : "Entregar al cliente"}</SubmitButton>
          </form>
        </section>
      )}

      {(p.assets?.length || p.asset_url || p.link_url) && (
        <section className="mt-8 card p-4 sm:p-5 max-w-3xl">
          <h2 className="h2 mb-3 px-1">Vista del cliente {(p.round ?? 0) > 1 && <span className="text-muted font-medium text-[14px]">· versión {p.round}</span>}</h2>
          <AssetViewer postId={p.id} userId={user.id} link={p.link_url}
            assets={p.assets?.length ? p.assets : p.asset_url ? [{ url: p.asset_url, name: "arte", type: /\.(mp4|mov|webm)$/i.test(p.asset_url) ? "video/mp4" : "image/*" }] : []}
            comments={(comments ?? []) as PostComment[]} versions={(vers ?? []) as PostVersion[]} currentRound={Math.max(1, p.round ?? 1)} canPin canResolve />
        </section>
      )}

      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
        <CommentThread comments={(comments ?? []) as PostComment[]} postId={p.id} path={`/panel/parrilla/${p.id}`} userId={user.id} />
        <form action={deletePost}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmSubmit message="¿Eliminar esta pieza y sus comentarios?">Eliminar pieza</ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
