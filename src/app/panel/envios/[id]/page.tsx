import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { ClientChip, Notice, PageHeader, Section } from "@/components/ui";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { ShareReview } from "@/components/share-review";
import type { Post, ReviewRequest } from "@/lib/types";
import { clientLabel, fmtDateTime } from "@/lib/utils";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("review_requests").select("*, clients(name, company, color, phone, client_user_id)").eq("id", id).single();
  if (!data) notFound();
  const r = data as ReviewRequest;
  const { data: pd } = await supabase.from("posts").select("*").in("id", r.post_ids.length ? r.post_ids : ["00000000-0000-0000-0000-000000000000"]);
  const posts = (pd ?? []) as Post[];
  const fixes = posts.filter((p) => p.status === "cambios");
  const pend = posts.filter((p) => p.status === "en_revision").length;
  const name = clientLabel(r.clients);
  const h = await headers();
  const site = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const link = `${site}/cliente/revisar/${r.id}`;
  const hasAccount = !!r.clients?.client_user_id;

  return (
    <>
      <PageHeader back={{ href: "/panel/envios", label: "Aprobaciones" }} title={`Envío a ${name}`}
        subtitle={<span className="flex flex-wrap items-center gap-3 mt-1">
          <Link href={`/panel/clientes/${r.client_id}`}><ClientChip name={name} color={r.clients?.color} /></Link>
          <span className="text-[13px] text-muted">{fmtDateTime(r.created_at)}</span>
          {r.brief_id && <Link href={`/panel/briefs/${r.brief_id}`} className="text-[13px] font-semibold text-brand-dark hover:underline">Ver pedido →</Link>}
        </span>} />

      {nuevo && <div className="mb-5"><Notice tone="ok">
        {hasAccount ? `¡Enviado! ${name} ya recibió la notificación. Si quieres, avísale también por WhatsApp.`
          : `Listo. ${name} aún no tiene cuenta: mándale el enlace por WhatsApp para que revise.`}
      </Notice></div>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <Section title="Piezas del envío" count={posts.length}>
          <div className="card p-5 sm:p-6">
            <BriefProgress posts={posts} />
            <div className="mt-5"><BriefPostRows posts={posts} hrefFor={(p) => `/panel/parrilla/${p.id}`} /></div>
          </div>
        </Section>

        <aside className="space-y-4 lg:mt-11">
          {fixes.length > 0 && (
            <div className="rounded-[22px] bg-rosa-t p-5">
              <div className="font-semibold">{fixes.length === 1 ? "1 pieza con cambios" : `${fixes.length} piezas con cambios`}</div>
              <p className="text-[13px] text-muted mt-1">Corrígelas y reenvíalas juntas como nueva ronda.</p>
              <Link href={`/panel/enviar?cliente=${r.client_id}&ids=${fixes.map((p) => p.id).join(",")}`} className="btn btn-sm btn-primary mt-3">Reenviar correcciones</Link>
            </div>
          )}
          {r.message && (
            <div className="card p-5">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-1.5">Tu mensaje</div>
              <p className="text-[14px] whitespace-pre-wrap">{r.message}</p>
            </div>
          )}
          {pend > 0 && (
            <div className="rounded-[22px] bg-azul-t p-5 space-y-3">
              <div>
                <div className="font-semibold">{pend === 1 ? "1 pieza sin revisar" : `${pend} piezas sin revisar`}</div>
                <p className="text-[13px] text-muted">Recuérdale a {name.split(" ")[0]} con su enlace directo.</p>
              </div>
              <ShareReview link={link} clientName={name} count={pend} phone={r.clients?.phone} message={r.message} />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
