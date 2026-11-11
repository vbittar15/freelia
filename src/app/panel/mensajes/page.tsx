import { requireCreative } from "@/lib/auth";
import { Avatar, EmptyState, PageHeader, Row, RowList } from "@/components/ui";
import type { Client, Message } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Mensajes" };

export default async function Page() {
  const { supabase, user } = await requireCreative();
  const [{ data: clients }, { data: msgs }] = await Promise.all([
    supabase.from("clients").select("*").eq("archived", false),
    supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  const last = new Map<string, Message>();
  ((msgs ?? []) as Message[]).forEach((m) => { if (!last.has(m.client_id)) last.set(m.client_id, m); });
  const list = ((clients ?? []) as Client[]).sort((a, b) =>
    (last.get(b.id)?.created_at ?? "").localeCompare(last.get(a.id)?.created_at ?? ""));

  return (
    <>
      <PageHeader title="Mensajes" subtitle="Una conversación por cliente, sin perder nada en WhatsApp." />
      {list.length === 0 ? <EmptyState title="Aún no tienes clientes" /> : (
        <RowList>
          {list.map((c) => {
            const m = last.get(c.id);
            return (
              <Row key={c.id} href={`/panel/mensajes/${c.id}`} icon={<Avatar name={c.company || c.name} size={40} color={c.color} />}
                title={c.company || c.name}
                sub={m ? `${m.sender_id === user.id ? "Tú: " : ""}${m.body || "📎 " + (m.attachment_name ?? "Archivo")}` : c.client_user_id ? "Sin mensajes todavía" : "El cliente aún no tiene cuenta"}
                right={m ? <span className="text-[12px] font-medium text-muted">{timeAgo(m.created_at)}</span> : undefined} />
            );
          })}
        </RowList>
      )}
    </>
  );
}
