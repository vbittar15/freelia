"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return v === null || String(v).trim() === "" ? null : String(v).trim();
};

export async function reviewPost(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "id")!;
  const action = s(formData, "action");
  const comment = s(formData, "comment");
  if (action === "cambios" && !comment) {
    const { count } = await supabase.from("post_comments").select("id", { count: "exact", head: true })
      .eq("post_id", id).not("x", "is", null).eq("resolved", false);
    if (!count) redirect(`/cliente/aprobaciones/${id}?error=${encodeURIComponent("Cuéntale al equipo qué cambios necesitas o márcalos sobre el arte")}`);
  }
  const { error } = await supabase.rpc("review_post", { p_post: id, p_action: action, p_comment: comment ?? (action === "cambios" ? "Marqué los cambios sobre el arte 📍" : null) });
  if (error) redirect(`/cliente/aprobaciones/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/aprobaciones/${id}?ok=${action}`);
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
  const row = {
    client_id: s(formData, "client_id"),
    created_by: user.id,
    title: s(formData, "title"),
    objective: s(formData, "objective"),
    audience: s(formData, "audience"),
    key_message: s(formData, "key_message"),
    deliverables: s(formData, "deliverables"),
    refs: s(formData, "refs"),
    deadline: s(formData, "deadline"),
    attachments: (() => {
      try {
        const arr = JSON.parse(String(formData.get("attachments") || "[]")) as { url: string; name: string; type: string }[];
        return arr.filter((x) => typeof x.url === "string" && x.url.startsWith("http")).map(({ url, name, type }) => ({ url, name, type }));
      } catch { return []; }
    })(),
  };
  if (!row.client_id || !row.title) redirect(`/cliente/solicitudes/nueva?error=${encodeURIComponent("Escribe un título para tu solicitud")}`);
  const { data, error } = await supabase.from("briefs").insert(row).select("id").single();
  if (error || !data) redirect(`/cliente/solicitudes/nueva?error=${encodeURIComponent(error?.message ?? "No se pudo enviar")}`);
  revalidatePath("/cliente/solicitudes");
  redirect(`/cliente/solicitudes/${data.id}?ok=1`);
}

export async function updateClientProfile(formData: FormData) {
  const { supabase, user } = await requireClient();
  await supabase.from("profiles").update({ full_name: s(formData, "full_name"), phone: s(formData, "phone") }).eq("id", user.id);
  revalidatePath("/cliente", "layout");
  redirect("/cliente/perfil?ok=1");
}

export async function approveBrief(formData: FormData) {
  const { supabase } = await requireClient();
  const id = s(formData, "id")!;
  const { data, error } = await supabase.rpc("approve_brief_posts", { p_brief: id });
  if (error) redirect(`/cliente/solicitudes/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/cliente", "layout");
  redirect(`/cliente/solicitudes/${id}?aprobada=${data ?? 0}`);
}
