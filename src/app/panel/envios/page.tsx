import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, Section } from "@/components/ui";
import type { Post, ReviewRequest } from "@/lib/types";
import { clientLabel, timeAgo } from "@/lib/utils";

export const metadata = { title: "Aprobaciones" };

export default async function Page() {
  const { supabase } = await requireCreative();
  const [{ data: rq }, { data: ready }] = await Promise.all([
    supabase.from("review_requests").select("*, clients(name, company, color)").order("created_at", { ascending: false }).limit(40),
    supabase.from("posts").select("id, status, client_id").in("status", ["borrador", "cambios"]),
  ]);
  const reqs = (rq ?? []) as ReviewRequest[];
  const allIds = reqs.flatMap((r) => r.post_ids);
  const { data: pd } = allIds.length ? await supabase.from("posts").select("id, status").in("id", allIds) : { data: [] };
  const st = new Map(((pd ?? []) as Pick<Post, "id" | "status">[]).map((p) => [p.id, p.status]));
  const fixes = (ready ?? []).filter((p) => p.status === "cambios").length;
  const drafts = (ready ?? []).length - fixes;

  const summary = (r: ReviewRequest) => {
    const s = r.post_ids.map((id) => st.get(id));
    const ok = s.filter((x) => x === "aprobado" || x === "publicado").length;
    const ch = s.filter((x) => x === "cambios").length;
    const pend = s.filter((x) => x === "en_revision").length;
    return { ok, ch, pend, total: r.post_ids.length };
  };
  const open = reqs.filter((r) => summary(r).pend > 0);
  const done = reqs.filter((r) => summary(r).pend === 0);

  const row = (r: ReviewRequest) => {
    const m = summary(r);
    return (
      <Row key={r.id} href={`/panel/envios/${r.id}`} status={m.pend ? "en_revision" : m.ch ? "cambios" : "aprobado"}
        title={clientLabel(r.clients)}
        sub={`${m.total} ${m.total === 1 ? "pieza" : "piezas"} · ${m.ok} ${m.ok === 1 ? "aprobada" : "aprobadas"}${m.ch ? ` · ${m.ch} con cambios` : ""}${m.pend ? ` · ${m.pend} sin revisar` : ""} · ${timeAgo(r.created_at)}`} />
    );
  };

  return (
    <>
      <PageHeader title="Aprobaciones" subtitle="Envía piezas a tus clientes y sigue sus respuestas."
        actions={<Link href="/panel/enviar" className="btn btn-primary">Enviar a aprobación</Link>} />
      {(drafts > 0 || fixes > 0) && (
        <Link href="/panel/enviar" className="mb-7 flex items-center gap-4 rounded-[22px] bg-azul-t p-4 sm:p-5 hover:ring-2 hover:ring-brand/30 transition">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Listas para enviar</div>
            <div className="text-[13px] text-muted">{[drafts && `${drafts} ${drafts === 1 ? "borrador" : "borradores"}`, fixes && `${fixes} ${fixes === 1 ? "corrección" : "correcciones"}`].filter(Boolean).join(" · ")}</div>
          </div>
          <span className="btn btn-primary btn-sm">Armar envío →</span>
        </Link>
      )}
      <div className="space-y-8">
        <Section title="Esperando respuesta" count={open.length}>
          <RowList empty={<EmptyState title="Nada esperando respuesta" text="Cuando envíes piezas a un cliente, aquí verás cómo va su revisión." />}>
            {open.map(row)}
          </RowList>
        </Section>
        {done.length > 0 && (
          <Section title="Revisados" count={done.length}>
            <RowList>{done.map(row)}</RowList>
          </Section>
        )}
      </div>
    </>
  );
}
