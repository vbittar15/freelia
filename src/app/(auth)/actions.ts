"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/ingresar?error=${encodeURIComponent("Correo o contraseña incorrectos")}&email=${encodeURIComponent(email)}`);
  if (next.startsWith("/")) redirect(next);
  const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  redirect(p?.role === "client" ? "/cliente" : "/panel");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const full_name = String(formData.get("full_name") || "").trim();
  const invite = String(formData.get("invite") || "").trim();
  const role = invite || formData.get("role") === "client" ? "client" : "creative";
  const back = invite ? `/invitacion/${invite}?email=${encodeURIComponent(email)}` : `/registro?email=${encodeURIComponent(email)}`;

  if (password.length < 8) redirect(`${back}&error=${encodeURIComponent("La contraseña debe tener al menos 8 caracteres")}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role, ...(invite ? { invite } : {}) }, emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });
  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? "Ese correo ya tiene cuenta. Ingresa con él para conectarla."
      : error.message;
    redirect(`${back}&error=${encodeURIComponent(msg)}`);
  }
  if (!data.session) redirect(`/ingresar?aviso=${encodeURIComponent("Te enviamos un correo para confirmar tu cuenta.")}&email=${encodeURIComponent(email)}`);
  redirect(role === "client" ? "/cliente" : "/panel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") || "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) redirect(`/invitacion/${token}?error=${encodeURIComponent(error.message)}`);
  redirect("/cliente");
}
