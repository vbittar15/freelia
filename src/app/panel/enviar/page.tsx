import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { ClientChip, EmptyState, PageHeader, Row, RowList } from "@/components/ui";
import { SendTray, type TrayPost } from "@/components/send-tray";
import type { Post } from "@/lib/types";
import { clientLabel } from "@/lib/utils";
import { ErrorNote } from "../_forms";
import { sendForReview } from "../actions";

export const metadata = { title: "Enviar a aprobación" };

type SP = { cliente?: string; brief?: string; ids?: string; error?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireCreative();
  const pre = (sp.ids ?? "").split(",").filter(Boolean);

  // Piezas que se pueden enviar: borradores y correcciones
  const { data } = await supabase.from("posts").select("*, clients(name, company, color, client_user_id)")
    .in("status", ["borrador", "cambios"]).order("scheduled_at", { ascending: true, nullsFirst: false });
  const all = (data ?? []) as (Post & { clients: { name: string; company: string | null; color: string | null; client_user_id: string | null } })[];

  let clientId = sp.cliente;
  if (!clientId && pre.length) clientId = all.find((p) => p.id === pre[0])?.client_id;
  if (!clientId && sp.brief) clientId = (await supabase.from("briefs").select("client_id").eq("id", sp.brief).single()).data?.client_id;
  const clientIds = [...new Set(all.map((p) => p.client_id))];
  if (!clientId && clientIds.length === 1) clientId = clientIds[0];

  // Paso 1: elegir cliente
  if (!clientId) {
    return (
      <>
        <PageHeader back={{ href: "/panel/envios", label: "Aprobaciones" }} title="Enviar a aprobación" subtitle="¿A qué cliente le envías piezas?" />
        <RowList empty={<EmptyState title="No hay piezas por enviar" text="Crea piezas en la parrilla; cuando estén listas, las envías juntas desde aquí."
          action={<Link href="/panel/parrilla/nueva" className="btn btn-primary">+ Nueva pieza</Link>} />}>
          {clientIds.map((cid) => {
            const ps = all.filter((p) => p.client_id === cid);
            const fixes = ps.filter((p) => p.status === "cambios").length;
            return (
              <Row key={cid} href={`/panel/enviar?cliente=${cid}`} status={fixes ? "cambios" : "borrador"}
                title={clientLabel(ps[0].clients)}
                sub={[`${ps.length - fixes} ${ps.length - fixes === 1 ? "borrador" : "borradores"}`, fixes && `${fixes} por corregir`].filter(Boolean).join(" · ")}
                pill={<span className="badge bg-azul-t text-brand-dark">Elegir →</span>} />
            );
          })}
        </RowList>
      </>
    );
  }

  const { data: c } = await supabase.from("clients").select("id, name, company, color, client_user_id").eq("id", clientId).single();
  const posts = all.filter((p) => p.client_id === clientId);
  const ids = posts.map((p) => p.id);
  const { data: cm } = ids.length
    ? await supabase.from("post_comments").select("post_id, body, action, x, resolved, created_at").in("post_id", ids).order("created_at", { ascending: false })
    : { data: [] };
  const comments = (cm ?? []) as { post_id: string; body: string | null; action: string; x: number | null; resolved: boolean }[];
  const tray: TrayPost[] = posts.map((p) => ({
    ...p,
    openPins: comments.filter((k) => k.post_id === p.id && k.x != null && !k.resolved).length,
    lastChange: comments.find((k) => k.post_id === p.id && k.action === "cambios")?.body ?? null,
  }));
  const brief = sp.brief ? (await supabase.from("briefs").select("title").eq("id", sp.brief).single()).data : null;

  // Preselección: lo que pidieron explícitamente, o las del pedido, o todas
  const preselected = pre.length ? pre.filter((id) => ids.includes(id))
    : sp.brief ? posts.filter((p) => p.brief_id === sp.brief).map((p) => p.id)
    : ids;

  return (
    <>
      <PageHeader back={{ href: sp.brief ? `/panel/briefs/${sp.brief}` : "/panel/envios", label: sp.brief ? "Pedido" : "Aprobaciones" }}
        title="Enviar a aprobación"
        subtitle={<span className="flex flex-wrap items-center gap-2 mt-1">
          <ClientChip name={clientLabel(c)} color={c?.color} />
          {clientIds.length > 1 && <Link href="/panel/enviar" className="text-[13px] font-semibold text-brand-dark hover:underline">Cambiar cliente</Link>}
        </span>} />
      <ErrorNote error={sp.error} />
      {posts.length === 0 ? (
        <EmptyState title="Nada pendiente por enviar" text="Este cliente no tiene borradores ni correcciones."
          action={<Link href={`/panel/parrilla/nueva?cliente=${clientId}`} className="btn btn-primary">+ Nueva pieza</Link>} />
      ) : (
        <SendTray action={sendForReview} clientId={clientId} clientName={clientLabel(c)} hasAccount={!!c?.client_user_id}
          posts={tray} preselected={preselected} briefTitle={brief?.title} />
      )}
    </>
  );
}
