import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Notice, PageHeader, Section, StatusBadge } from "@/components/ui";
import { BriefView } from "@/components/brief-view";
import { BriefPostRows, BriefProgress } from "@/components/brief-posts";
import { SubmitButton } from "@/components/client-ui";
import type { Brief, Post } from "@/lib/types";
import { approveBrief } from "../../actions";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; aprobada?: string; error?: string }> }) {
  const { id } = await params;
  const { ok, aprobada, error } = await searchParams;
  const { supabase } = await requireClient();
  const { data } = await supabase.from("briefs").select("*").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  const { data: pd } = await supabase.from("posts").select("*").eq("brief_id", id);
  const posts = ((pd ?? []) as Post[]).filter((p) => p.status !== "borrador");
  const inReview = posts.filter((p) => p.status === "en_revision").length;
  return (
    <>
      <PageHeader back={{ href: "/cliente/solicitudes", label: "Solicitudes" }} title={b.title}
        subtitle={<span className="inline-flex mt-1"><StatusBadge status={b.status} /></span>} />
      {ok && <p className="mb-5 rounded-[18px] bg-verde-t text-ink px-4 py-3 text-[14px]">Solicitud enviada. Tu equipo creativo ya fue notificado.</p>}
      {aprobada && <div className="mb-5"><Notice tone="ok">{Number(aprobada) > 0 ? `¡Aprobaste ${aprobada} ${aprobada === "1" ? "pieza" : "piezas"}! Tu equipo ya fue notificado.` : "No había piezas pendientes por aprobar."}</Notice></div>}
      {error && <div className="mb-5"><Notice tone="error">{error}</Notice></div>}

      {posts.length > 0 && (
        <Section title="Tu parrilla" count={posts.length} className="mb-6">
          <div className="card p-5 sm:p-6">
            <BriefProgress posts={posts} />
            <div className="mt-5">
              <BriefPostRows posts={posts} hrefFor={(p) => `/cliente/aprobaciones/${p.id}`} />
            </div>
            {inReview > 0 && (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <form action={approveBrief}>
                  <input type="hidden" name="id" value={b.id} />
                  <SubmitButton className="btn btn-approve" pendingText="Aprobando…">✓ Aprobar toda la parrilla ({inReview})</SubmitButton>
                </form>
                <p className="text-[13px] text-muted">¿Algo por ajustar? Abre la pieza y marca los cambios sobre el arte. <Link href="/cliente/aprobaciones" className="font-semibold text-brand-dark hover:underline">Revisar una por una</Link></p>
              </div>
            )}
          </div>
        </Section>
      )}
      <BriefView brief={b} />
    </>
  );
}
