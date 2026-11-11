import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
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
        <div className="card divide-y divide-line">
          {list.map((c) => {
            const m = last.get(c.id);
            return (
              <Link key={c.id} href={`/panel/mensajes/${c.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-surface/60">
                <Avatar name={c.company || c.name} size={40} color={c.color} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{c.company || c.name}</div>
                  <div className="text-[13px] text-muted truncate">
                    {m ? `${m.sender_id === user.id ? "Tú: " : ""}${m.body}` : c.client_user_id ? "Sin mensajes todavía" : "El cliente aún no tiene cuenta"}
                  </div>
                </div>
                {m && <span className="text-[11px] text-muted shrink-0">{timeAgo(m.created_at)}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
