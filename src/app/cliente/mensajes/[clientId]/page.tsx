import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { Avatar, PageHeader } from "@/components/ui";
import { Chat } from "@/components/chat";
import type { Message } from "@/lib/types";
import { creativeName, getWorkspaces } from "../../data";

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { supabase, user } = await requireClient();
  const ws = (await getWorkspaces(supabase, user.id)).find((w) => w.id === clientId);
  if (!ws) notFound();
  const { data: msgs } = await supabase.from("messages").select("*").eq("client_id", clientId).order("created_at").limit(300);
  const name = creativeName(ws);
  return (
    <>
      <PageHeader title={<span className="flex items-center gap-3"><Avatar name={name} size={36} />{name}</span>} />
      <Chat clientId={clientId} userId={user.id} initial={(msgs ?? []) as Message[]} otherName={name} />
    </>
  );
}
