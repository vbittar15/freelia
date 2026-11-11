import type { SupabaseClient } from "@supabase/supabase-js";

export type Workspace = {
  id: string; // id de la ficha de cliente
  name: string;
  company: string | null;
  owner_id: string;
  creative: { full_name: string | null; business_name: string | null } | null;
};

/** Fichas de cliente vinculadas a este usuario (una por cada creativo que lo invitó) */
export async function getWorkspaces(supabase: SupabaseClient, userId: string): Promise<Workspace[]> {
  const { data } = await supabase
    .from("clients")
    .select("id, name, company, owner_id, creative:profiles!clients_owner_id_fkey(full_name, business_name)")
    .eq("client_user_id", userId);
  return (data ?? []) as unknown as Workspace[];
}

export const creativeName = (w?: Workspace | null) =>
  w?.creative?.business_name || w?.creative?.full_name || "Tu equipo creativo";
