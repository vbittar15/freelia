import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { supabase, user, profile };
}

export async function requireCreative() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/ingresar");
  if (s.profile.role !== "creative") redirect("/cliente");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}

export async function requireClient() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/ingresar");
  if (s.profile.role !== "client") redirect("/panel");
  return { supabase: s.supabase, user: s.user, profile: s.profile };
}
