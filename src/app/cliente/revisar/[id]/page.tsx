import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Lia } from "@/components/brand";
import { Notice, PageHeader, Section } from "@/components/ui";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { SubmitButton } from "@/components/client-ui";
import type { Post, ReviewRequest } from "@/lib/types";
import { fmtDateTime } from "@/lib/utils";
import { approveAll } from "../../actions";
import { creativeName, getWorkspaces } from "../../data";
import { Icon } from "@/components/icons";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fin?: string; aprobada?: string; error?: string }> }) {
  const { id } = await params;
  const { fin, aprobada, error } = await searchParams;
  const { supabase, user } = await requireClient();
  const { data } = await supabase.from("review_requests").select("*").eq("id", id).single();
  if (!data) notFound();
  const r = data as ReviewRequest;
  const [{ data: pd }, ws] = await Promise.all([
    supabase.from("posts").select("*").in("id", r.post_ids.length ? r.post_ids : ["00000000-0000-0000-0000-000000000000"])
      .order("scheduled_at", { ascending: true, nullsFirst: false }),
    getWorkspaces(supabase, user.id),
  ]);
  const posts = (pd ?? []) as Post[];
  const pending = posts.filter((p) => p.status === "en_revision");
  const ok = posts.filter((p) => p.status === "aprobado" || p.status === "publicado").length;
  const ch = posts.filter((p) => p.status === "cambios").length;
  const who = creativeName(ws.find((w) => w.id === r.client_id));
  const isFix = posts.some((p) => (p.round ?? 1) > 1);

  return (
    <>
      <PageHeader back={{ href: "/cliente/aprobaciones", label: "Aprobaciones" }}
        title={isFix ? "Correcciones para revisar" : "Piezas para aprobar"}
        subtitle={`${who} · ${fmtDateTime(r.created_at)}`} />

      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}

      {(fin || aprobada) && pending.length === 0 ? (
        <div className="card flex flex-col items-center text-center px-6 py-10 mb-6 anim-page">
          <div className="anim-float"><Lia size={72} mood="happy" color={ch ? "#FF7EB6" : "#2FBF7A"} /></div>
          <h2 className="h1 mt-4 text-[26px]">¡Listo, terminaste!</h2>
          <p className="text-muted mt-1">
            {ok} {ok === 1 ? "aprobada" : "aprobadas"}{ch ? ` · ${ch} con cambios` : ""}. {who} ya recibió tus respuestas.
          </p>
          <Link href="/cliente" className="btn btn-soft mt-5">Volver al inicio</Link>
        </div>
      ) : (
        <>
          {r.message && (
            <div className="mb-5 flex gap-3 items-start">
              <div className="shrink-0 mt-1"><Lia size={36} mood="smile" /></div>
              <div className="rounded-[20px] rounded-tl-[6px] bg-azul-t px-4 py-3 max-w-xl">
                <div className="text-[12px] font-semibold text-brand-dark mb-0.5">{who}</div>
                <p className="text-[15px] whitespace-pre-wrap">{r.message}</p>
              </div>
            </div>
          )}
          {pending.length > 0 && (
            <div className="card p-5 sm:p-6 mb-6">
              <div className="font-semibold text-[17px]">{pending.length === 1 ? "Tienes 1 pieza por revisar" : `Tienes ${pending.length} piezas por revisar`}</div>
              <p className="text-[14px] text-muted mt-1">Te las mostramos una por una: apruébala o marca sobre el arte lo que quieres cambiar.</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link href={`/cliente/aprobaciones/${pending[0].id}?r=${r.id}`} className="btn btn-primary btn-lg">Empezar revisión →</Link>
                {pending.length > 1 && (
                  <form action={approveAll}>
                    <input type="hidden" name="back" value={`/cliente/revisar/${r.id}`} />
                    {pending.map((p) => <input key={p.id} type="hidden" name="post_ids" value={p.id} />)}
                    <SubmitButton className="btn btn-lg bg-verde-t text-ink hover:bg-verde/30 w-full" pendingText="Aprobando…"><Icon name="check" className="size-[18px]" strokeWidth={2.4} /> Aprobar todas ({pending.length})</SubmitButton>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Section title="Piezas del envío" count={posts.length}>
        <div className="card p-5 sm:p-6">
          <BriefProgress posts={posts} />
          <div className="mt-5"><BriefPostRows posts={posts} hrefFor={(p) => `/cliente/aprobaciones/${p.id}?r=${r.id}`} /></div>
        </div>
      </Section>
    </>
  );
}
