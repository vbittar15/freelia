import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { Avatar, PageHeader } from "@/components/ui";
import { Chat } from "@/components/chat";
import type { Client, Message } from "@/lib/types";

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { supabase, user } = await requireCreative();
  const [{ data }, { data: msgs }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase.from("messages").select("*").eq("client_id", clientId).order("created_at").limit(300),
  ]);
  if (!data) notFound();
  const c = data as Client;
  return (
    <>
      <PageHeader back={{ href: "/panel/mensajes", label: "Mensajes" }}
        title={<span className="flex items-center gap-3"><Avatar name={c.company || c.name} size={36} color={c.color} />{c.company || c.name}</span>}
        subtitle={!c.client_user_id ? "Tu cliente verá estos mensajes cuando cree su cuenta en Freelia." : undefined} />
      <Chat clientId={c.id} userId={user.id} initial={(msgs ?? []) as Message[]} otherName={c.name} />
    </>
  );
}
