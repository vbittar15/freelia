import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { EmptyState, PageHeader, Row, RowList, StatusBadge } from "@/components/ui";
import { KindPicker } from "@/components/request-fields";
import type { Brief, Post } from "@/lib/types";
import { kindOf, stageOf } from "@/lib/requests";
import { fmtDate, fmtDateTime } from "@/lib/utils";

export const metadata = { title: "Solicitudes" };

export default async function Page() {
  const { supabase } = await requireClient();
  const [{ data }, { data: pd }] = await Promise.all([
    supabase.from("briefs").select("*").order("created_at", { ascending: false }),
    supabase.from("posts").select("id, status, brief_id").not("brief_id", "is", null),
  ]);
  const posts = (pd ?? []) as Pick<Post, "id" | "status" | "brief_id">[];
  const briefs = (data ?? []) as Brief[];
  return (
    <>
      <PageHeader title="Solicitudes" subtitle="Pide lo que necesitas y sigue cómo va."
        actions={<Link href="/cliente/solicitudes/nueva" className="btn btn-primary">+ Nueva solicitud</Link>} />
      {briefs.length === 0 ? (
        <>
          <p className="text-muted mb-4">¿Qué necesitas? Elige y tu equipo creativo lo recibe al instante.</p>
          <KindPicker href={(k) => `/cliente/solicitudes/nueva?tipo=${k}`} />
        </>
      ) : (
        <RowList empty={<EmptyState title="Sin solicitudes" />}>
          {briefs.map((b) => {
            const k = kindOf(b);
            const stage = stageOf(b, posts.filter((p) => p.brief_id === b.id && p.status !== "borrador"));
            return (
              <Row key={b.id} href={`/cliente/solicitudes/${b.id}`} title={b.title}
                icon={<span className="size-10 rounded-[14px] bg-surface-2 grid place-items-center text-[20px] shrink-0" aria-hidden>{k.emoji}</span>}
                sub={`${k.label} · ${k.key === "reunion" ? (b.meeting_at ? fmtDateTime(b.meeting_at) : "fecha por confirmar") : `pedida el ${fmtDate(b.created_at)}`}`}
                pill={<StatusBadge status={stage} />} />
            );
          })}
        </RowList>
      )}
    </>
  );
}
