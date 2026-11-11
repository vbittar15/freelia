import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Notice, PageHeader, Section } from "@/components/ui";
import { BriefView } from "@/components/brief-view";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { StageTrack } from "@/components/request-fields";
import { DownloadAll } from "@/components/download-all";
import { FileGrid } from "@/components/files";
import { Lia } from "@/components/brand";
import type { Brief, FileRef, Post } from "@/lib/types";
import { STAGE_LABEL, kindOf, stageOf, stagesFor } from "@/lib/requests";
import { fmtDateTime } from "@/lib/utils";
import { creativeName, getWorkspaces } from "../../data";
import { Icon, IconTile } from "@/components/icons";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; aprobada?: string; error?: string }> }) {
  const { id } = await params;
  const { ok, aprobada, error } = await searchParams;
  const { supabase, user } = await requireClient();
  const { data } = await supabase.from("briefs").select("*").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  const kind = kindOf(b);
  const [{ data: pd }, ws] = await Promise.all([supabase.from("posts").select("*").eq("brief_id", id), getWorkspaces(supabase, user.id)]);
  const posts = ((pd ?? []) as Post[]).filter((p) => p.status !== "borrador");
  const who = creativeName(ws.find((w) => w.id === b.client_id));
  const stage = stageOf(b, posts);
  const pending = posts.filter((p) => p.status === "en_revision");
  const delivered = posts.filter((p) => p.status === "entregado");
  const reqId = pending.find((p) => p.review_request_id)?.review_request_id;
  const finalFiles = delivered.flatMap((p) => ((p.final_files?.length ? p.final_files : p.assets ?? []) as FileRef[]).map((f) => ({ ...f, folder: p.title })));

  return (
    <>
      <PageHeader back={{ href: "/cliente/solicitudes", label: "Solicitudes" }} title={b.title}
        subtitle={<span className="flex flex-wrap items-center gap-2 mt-1"><span className="badge bg-surface text-ink inline-flex items-center gap-1.5"><Icon name={kind.icon} className="size-4" /> {kind.label}</span><span className="text-[13px]">{STAGE_LABEL[stage]}</span></span>} />
      {ok && <div className="mb-5"><Notice tone="ok">{kind.key === "reunion" ? `Listo, ${who} te confirmará la fecha y el enlace.` : `Solicitud enviada. ${who} ya fue notificado.`}</Notice></div>}
      {aprobada && <div className="mb-5"><Notice tone="ok">{Number(aprobada) > 0 ? `¡Aprobaste ${aprobada} ${aprobada === "1" ? "pieza" : "piezas"}! Tu equipo ya fue notificado.` : "No había piezas pendientes por aprobar."}</Notice></div>}
      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}

      <div className="card p-5 sm:p-6 mb-6">
        <StageTrack stages={stagesFor(kind)} current={stage} />
      </div>

      {kind.key === "reunion" && (
        <section className="mb-6 rounded-[22px] bg-azul-t p-5 sm:p-6 flex gap-4 items-start">
          <Lia size={44} mood={b.meeting_at ? "happy" : "base"} />
          <div className="min-w-0">
            {b.meeting_at ? (
              <>
                <div className="font-semibold text-[17px]">{fmtDateTime(b.meeting_at)}</div>
                {b.meeting_link && (/^https?:\/\//.test(b.meeting_link)
                  ? <a href={b.meeting_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm mt-3">Unirme a la reunión</a>
                  : <p className="text-[14px] mt-1">{b.meeting_link}</p>)}
              </>
            ) : <p className="text-[15px]">{who} revisará tu disponibilidad y te confirmará la fecha y el enlace aquí.</p>}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="mb-6 rounded-[22px] bg-brand text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="font-semibold text-[17px]">{pending.length === 1 ? "Tienes 1 pieza para revisar" : `Tienes ${pending.length} piezas para revisar`}</div>
            <div className="text-[14px] text-white/80">Apruébalas o marca sobre ellas lo que quieres cambiar.</div>
          </div>
          <Link href={reqId ? `/cliente/revisar/${reqId}` : `/cliente/aprobaciones/${pending[0].id}`} className="btn bg-white text-brand-dark hover:bg-azul-t">Revisar ahora →</Link>
        </section>
      )}

      {delivered.length > 0 && (
        <section className="mb-6 rounded-[22px] bg-verde-t p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="font-semibold text-[17px] flex items-center gap-2"><Icon name="box" className="size-5" /> Tu material está listo</div>
              <div className="text-[14px] text-muted">{finalFiles.length} {finalFiles.length === 1 ? "archivo" : "archivos"} para descargar.</div>
            </div>
            <DownloadAll files={finalFiles} zipName={b.title} />
          </div>
          <FileGrid files={finalFiles} />
        </section>
      )}

      {posts.length > 0 && (
        <Section title="Material" count={posts.length} className="mb-6">
          <div className="card p-5 sm:p-6">
            <BriefProgress posts={posts} />
            <div className="mt-5"><BriefPostRows posts={posts} hrefFor={(p) => `/cliente/aprobaciones/${p.id}${p.status === "en_revision" && p.review_request_id ? `?r=${p.review_request_id}` : ""}`} /></div>
          </div>
        </Section>
      )}

      <Section title="Lo que pediste"><BriefView brief={b} /></Section>
    </>
  );
}
