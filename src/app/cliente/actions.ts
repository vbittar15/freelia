"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireClient } from "@/lib/auth";
import { parseRequest } from "@/lib/requests";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return v === null || String(v).trim() === "" ? null : String(v).trim();
};

export async function reviewPost(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "id")!;
  const action = s(formData, "action");
  const comment = s(formData, "comment");
  const r = s(formData, "r");
  const self = `/cliente/aprobaciones/${id}${r ? `?r=${r}&` : "?"}`;
  if (action === "cambios" && !comment) {
    const { count } = await supabase.from("post_comments").select("id", { count: "exact", head: true })
      .eq("post_id", id).not("x", "is", null).eq("resolved", false);
    if (!count) redirect(`${self}error=${encodeURIComponent("Cuéntale al equipo qué cambios necesitas o márcalos sobre el arte")}`);
  }
  const { error } = await supabase.rpc("review_post", { p_post: id, p_action: action, p_comment: comment ?? (action === "cambios" ? "Marqué los cambios sobre el material" : null) });
  if (error) redirect(`${self}error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  if (r) {
    // Revisión en secuencia: pasar a la siguiente pieza pendiente del envío
    const { data: req } = await supabase.from("review_requests").select("post_ids").eq("id", r).single();
    const { data: next } = await supabase.from("posts").select("id").in("id", req?.post_ids ?? []).eq("status", "en_revision")
      .order("scheduled_at", { ascending: true, nullsFirst: false }).limit(1);
    if (next?.[0]) redirect(`/cliente/aprobaciones/${next[0].id}?r=${r}&prev=${action}`);
    redirect(`/cliente/revisar/${r}?fin=1`);
  }
  redirect(`/cliente/aprobaciones/${id}?ok=${action}`);
}

export async function approveAll(formData: FormData) {
  const { supabase } = await requireClient();
  const ids = formData.getAll("post_ids").map(String).filter(Boolean);
  const back = s(formData, "back") ?? "/cliente";
  const { data, error } = await supabase.rpc("approve_posts", { p_posts: ids });
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`${back}${sep}aprobada=${data ?? 0}`);
}

export async function respondQuote(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "id")!;
  const { error } = await supabase.rpc("respond_quote", { p_quote: id, p_accept: s(formData, "accept") === "true" });
  if (error) redirect(`/cliente/cotizaciones/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/cotizaciones/${id}`);
}

export async function createRequest(formData: FormData) {
  const { supabase, user } = await requireClient();
  const tipo = s(formData, "kind") ?? "proyecto";
  const { row, missing } = parseRequest(formData, tipo);
  const back = `/cliente/solicitudes/nueva?tipo=${tipo}`;
  if (!row.title) redirect(`${back}&error=${encodeURIComponent("Escribe un título para tu solicitud")}`);
  if (missing.length) redirect(`${back}&error=${encodeURIComponent("Falta: " + missing.join(", "))}`);
  const attachments = (() => {
    try {
      const arr = JSON.parse(String(formData.get("attachments") || "[]")) as { url: string; name: string; type: string }[];
      return arr.filter((x) => typeof x.url === "string" && x.url.startsWith("http")).map(({ url, name, type }) => ({ url, name, type }));
    } catch { return []; }
  })();
  const { data, error } = await supabase.from("briefs")
    .insert({ ...row, client_id: s(formData, "client_id"), created_by: user.id, attachments }).select("id").single();
  if (error || !data) redirect(`${back}&error=${encodeURIComponent(error?.message ?? "No se pudo enviar")}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/solicitudes/${data.id}?ok=1`);
}

export async function updateClientProfile(formData: FormData) {
  const { supabase, user } = await requireClient();
  await supabase.from("profiles").update({ full_name: s(formData, "full_name"), phone: s(formData, "phone") }).eq("id", user.id);
  revalidatePath("/cliente", "layout");
  redirect("/cliente/perfil?ok=1");
}


export async function signContract(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "id")!;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  const { error } = await supabase.rpc("sign_contract", {
    p_contract: id, p_name: s(formData, "name"), p_doc: s(formData, "doc"), p_signature: s(formData, "signature"),
    p_hash: s(formData, "hash"), p_ip: ip, p_agent: h.get("user-agent"),
  });
  if (error) redirect(`/cliente/contratos/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/contratos/${id}?ok=1`);
}

export async function reportPayment(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "invoice_id")!;
  const amount = Math.round(Number(s(formData, "amount") ?? 0));
  let proof: string | null = null;
  try { const a = JSON.parse(String(formData.get("proof") || "[]")); proof = Array.isArray(a) && a[0]?.url ? String(a[0].url) : null; } catch { /* sin comprobante */ }
  if (!(amount > 0)) redirect(`/cliente/cobros/${id}?error=${encodeURIComponent("Escribe el valor que pagaste")}`);
  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: id, amount, paid_on: s(formData, "paid_on"), method: s(formData, "method") ?? "transferencia", reference: s(formData, "reference"), proof_url: proof, confirmed: false,
  });
  if (error) redirect(`/cliente/cobros/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/cobros/${id}?ok=1`);
}
