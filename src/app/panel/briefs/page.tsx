import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import type { Brief, Post } from "@/lib/types";
import { KINDS, STAGE_LABEL, kindOf, stageOf } from "@/lib/requests";
import { clientLabel, cn, fmtDate, fmtDateTime } from "@/lib/utils";

export const metadata = { title: "Solicitudes" };

const TABS = [{ k: "", l: "Activas" }, { k: "nuevas", l: "Nuevas" }, { k: "entregadas", l: "Entregadas" }, { k: "todas", l: "Todas" }];

export default async function Page({ searchParams }: { searchParams: Promise<{ ver?: string; tipo?: string }> }) {
  const { ver = "", tipo = "" } = await searchParams;
  const { supabase, user } = await requireCreative();
  let q = supabase.from("briefs").select("*, clients(name, company, color)").order("created_at", { ascending: false });
  if (tipo) q = q.eq("kind", tipo);
  const [{ data }, { data: pd }] = await Promise.all([q, supabase.from("posts").select("id, status, brief_id").not("brief_id", "is", null)]);
  const posts = (pd ?? []) as Pick<Post, "id" | "status" | "brief_id">[];
  const all = ((data ?? []) as Brief[]).map((b) => ({ b, stage: stageOf(b, posts.filter((p) => p.brief_id === b.id)) }));
  const done = (s: string) => s === "entregado" || s === "realizada";
  const list = all.filter(({ b, stage }) =>
    ver === "todas" ? true : ver === "nuevas" ? stage === "nuevo" : ver === "entregadas" ? done(stage) || b.status === "completado" : !done(stage) && b.status !== "completado");
  const href = (p: Record<string, string>) => { const u = new URLSearchParams({ ...(ver ? { ver } : {}), ...(tipo ? { tipo } : {}), ...p }); [...u.entries()].forEach(([k, v]) => !v && u.delete(k)); return `/panel/briefs${u.size ? "?" + u : ""}`; };

  return (
    <>
      <PageHeader title="Solicitudes" subtitle="Lo que te piden tus clientes: proyectos, piezas, parrillas, campañas y reuniones."
        actions={<Link href="/panel/briefs/nuevo" className="btn btn-primary">+ Nueva solicitud</Link>} />
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 rounded-full bg-surface p-1 max-w-full overflow-x-auto">
          {TABS.map((t) => (
            <Link key={t.k} href={href({ ver: t.k })} className={cn("btn btn-sm", ver === t.k ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>{t.l}</Link>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {KINDS.map((k) => (
            <Link key={k.key} href={href({ tipo: tipo === k.key ? "" : k.key })}
              className={cn("btn btn-sm whitespace-nowrap", tipo === k.key ? "bg-ink text-white" : "bg-surface text-ink hover:bg-surface-2")}>{k.emoji} {k.label}</Link>
          ))}
        </div>
      </div>
      <RowList empty={<EmptyState title="No hay solicitudes aquí" text="Tus clientes te piden cosas desde su portal. También puedes registrarlas tú." />}>
        {list.map(({ b, stage }) => {
          const k = kindOf(b);
          return (
            <Row key={b.id} href={`/panel/briefs/${b.id}`} status={stage === "nuevo" ? "nuevo" : stage}
              icon={<span className="size-10 rounded-[14px] bg-surface-2 grid place-items-center text-[20px] shrink-0" aria-hidden>{k.emoji}</span>}
              title={b.title}
              sub={`${clientLabel(b.clients)} · ${k.label}${b.created_by !== user.id ? " · pedida por el cliente" : ""}${k.key === "reunion" ? (b.meeting_at ? ` · ${fmtDateTime(b.meeting_at)}` : "") : b.deadline ? ` · para ${fmtDate(b.deadline)}` : ""}`}
              pill={<StatusBadge status={stage} />} />
          );
        })}
      </RowList>
    </>
  );
}
