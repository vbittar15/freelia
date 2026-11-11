"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { bogotaLocalToISO } from "@/lib/utils";
import type { LineItem } from "@/lib/types";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return v === null || String(v).trim() === "" ? null : String(v).trim();
};
const n = (f: FormData, k: string) => {
  const v = s(f, k);
  return v === null ? null : Number(v.replace(/[^\d.-]/g, ""));
};

function fail(path: string, msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);
}

function parseFiles(f: FormData) {
  try {
    const arr = JSON.parse(String(f.get("attachments") || "[]")) as { url: string; name: string; type: string }[];
    return arr.filter((x) => typeof x.url === "string" && x.url.startsWith("http")).map(({ url, name, type }) => ({ url, name, type }));
  } catch { return []; }
}

function parseItems(f: FormData): LineItem[] {
  try {
    const raw = JSON.parse(String(f.get("items") || "[]")) as LineItem[];
    return raw
      .filter((i) => i.description && i.description.trim())
      .map((i, idx) => ({
        description: i.description.trim(),
        quantity: Number(i.quantity) || 0,
        unit_price: Number(i.unit_price) || 0,
        position: idx,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------- Clientes
export async function saveClient(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const row = {
    name: s(formData, "name")!,
    company: s(formData, "company"),
    email: s(formData, "email")?.toLowerCase() ?? null,
    phone: s(formData, "phone"),
    document_id: s(formData, "document_id"),
    color: s(formData, "color") ?? "#C9D6FF",
    notes: s(formData, "notes"),
  };
  if (!row.name) fail(id ? `/panel/clientes/${id}/editar` : "/panel/clientes/nuevo", "El nombre es obligatorio");

  if (id) {
    const { error } = await supabase.from("clients").update(row).eq("id", id);
    if (error) fail(`/panel/clientes/${id}/editar`, error.message);
    revalidatePath("/panel", "layout");
    redirect(`/panel/clientes/${id}`);
  }
  const { data, error } = await supabase.from("clients").insert(row).select("id").single();
  if (error || !data) fail("/panel/clientes/nuevo", error?.message ?? "No se pudo crear");
  revalidatePath("/panel", "layout");
  redirect(`/panel/clientes/${data.id}?nuevo=1`);
}

/** Genera un enlace de invitación nuevo (el anterior deja de funcionar) */
export async function resetInvite(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("clients").update({ invite_token: crypto.randomUUID() }).eq("id", id).is("client_user_id", null);
  revalidatePath(`/panel/clientes/${id}`);
  redirect(`/panel/clientes/${id}?enlace=nuevo`);
}

export async function archiveClient(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const archived = formData.get("archived") === "true";
  await supabase.from("clients").update({ archived }).eq("id", id);
  revalidatePath("/panel", "layout");
  redirect(archived ? "/panel/clientes" : `/panel/clientes/${id}`);
}

export async function deleteClient(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("clients").delete().eq("id", s(formData, "id")!);
  revalidatePath("/panel", "layout");
  redirect("/panel/clientes");
}

// ---------------------------------------------------------------- Briefs
export async function saveBrief(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const row = {
    client_id: s(formData, "client_id")!,
    title: s(formData, "title")!,
    objective: s(formData, "objective"),
    audience: s(formData, "audience"),
    key_message: s(formData, "key_message"),
    deliverables: s(formData, "deliverables"),
    refs: s(formData, "refs"),
    deadline: s(formData, "deadline"),
    budget: n(formData, "budget"),
    attachments: parseFiles(formData),
  };
  const back = id ? `/panel/briefs/${id}/editar` : "/panel/briefs/nuevo";
  if (!row.client_id || !row.title) fail(back, "Elige un cliente y escribe un título");

  if (id) {
    const { client_id: _ignored, ...upd } = row;
    void _ignored;
    const { error } = await supabase.from("briefs").update(upd).eq("id", id);
    if (error) fail(back, error.message);
    revalidatePath("/panel/briefs");
    redirect(`/panel/briefs/${id}`);
  }
  const { data, error } = await supabase.from("briefs").insert(row).select("id").single();
  if (error || !data) fail(back, error?.message ?? "No se pudo crear");
  revalidatePath("/panel/briefs");
  redirect(`/panel/briefs/${data.id}`);
}

export async function setBriefStatus(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("briefs").update({ status: s(formData, "status") }).eq("id", id);
  revalidatePath(`/panel/briefs/${id}`);
  revalidatePath("/panel/briefs");
}

export async function deleteBrief(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("briefs").delete().eq("id", s(formData, "id")!);
  revalidatePath("/panel/briefs");
  redirect("/panel/briefs");
}

// ---------------------------------------------------------------- Parrilla
export async function savePost(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const intent = s(formData, "intent"); // "review" = guardar y enviar a aprobación
  const row: Record<string, unknown> = {
    client_id: s(formData, "client_id"),
    title: s(formData, "title"),
    network: s(formData, "network") ?? "instagram",
    format: s(formData, "format") ?? "post",
    scheduled_at: bogotaLocalToISO(s(formData, "scheduled_at")),
    copy: s(formData, "copy"),
    asset_url: s(formData, "asset_url"),
  };
  if (intent === "review") row.status = "en_revision";
  const back = id ? `/panel/parrilla/${id}` : "/panel/parrilla/nueva";
  if (!row.client_id || !row.title) fail(back, "Elige un cliente y escribe un título");

  if (id) {
    delete row.client_id;
    const { error } = await supabase.from("posts").update(row).eq("id", id);
    if (error) fail(back, error.message);
    revalidatePath("/panel/parrilla", "layout");
    redirect(`/panel/parrilla/${id}?ok=1`);
  }
  const { data, error } = await supabase.from("posts").insert(row).select("id").single();
  if (error || !data) fail(back, error?.message ?? "No se pudo crear");
  revalidatePath("/panel/parrilla", "layout");
  redirect(`/panel/parrilla/${data.id}?ok=1`);
}

export async function setPostStatus(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("posts").update({ status: s(formData, "status") }).eq("id", id);
  revalidatePath("/panel/parrilla", "layout");
  revalidatePath("/panel");
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("posts").delete().eq("id", s(formData, "id")!);
  revalidatePath("/panel/parrilla", "layout");
  redirect("/panel/parrilla");
}

// ---------------------------------------------------------------- Cotizaciones
export async function saveQuote(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const send = s(formData, "intent") === "send";
  const items = parseItems(formData);
  const row: Record<string, unknown> = {
    client_id: s(formData, "client_id"),
    title: s(formData, "title"),
    valid_until: s(formData, "valid_until"),
    notes: s(formData, "notes"),
  };
  const back = id ? `/panel/cotizaciones/${id}/editar` : "/panel/cotizaciones/nueva";
  if (!row.client_id || !row.title) fail(back, "Elige un cliente y escribe un título");
  if (items.length === 0) fail(back, "Agrega al menos un ítem");

  let quoteId = id;
  if (id) {
    delete row.client_id;
    const { error } = await supabase.from("quotes").update(row).eq("id", id);
    if (error) fail(back, error.message);
    await supabase.from("quote_items").delete().eq("quote_id", id);
  } else {
    const { data, error } = await supabase.from("quotes").insert(row).select("id").single();
    if (error || !data) fail(back, error?.message ?? "No se pudo crear");
    quoteId = data.id;
  }
  await supabase.from("quote_items").insert(items.map((i) => ({ ...i, quote_id: quoteId })));
  // Se envía después de guardar los ítems para que el cliente los vea completos
  if (send) await supabase.from("quotes").update({ status: "enviada" }).eq("id", quoteId!);
  revalidatePath("/panel/cotizaciones", "layout");
  redirect(`/panel/cotizaciones/${quoteId}`);
}

export async function setQuoteStatus(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("quotes").update({ status: s(formData, "status") }).eq("id", id);
  revalidatePath("/panel/cotizaciones", "layout");
}

export async function deleteQuote(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("quotes").delete().eq("id", s(formData, "id")!);
  revalidatePath("/panel/cotizaciones", "layout");
  redirect("/panel/cotizaciones");
}

/** Convierte una cotización aceptada en cuenta de cobro (borrador) */
export async function quoteToInvoice(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const { data: q } = await supabase.from("quotes").select("*, quote_items(*)").eq("id", id).single();
  if (!q) fail(`/panel/cotizaciones/${id}`, "No se encontró la cotización");
  const { data: inv, error } = await supabase
    .from("invoices")
    .insert({ client_id: q.client_id, concept: q.title, notes: `Según cotización #${q.number}` })
    .select("id").single();
  if (error || !inv) fail(`/panel/cotizaciones/${id}`, error?.message ?? "No se pudo crear");
  const items = (q.quote_items as LineItem[]).map(({ description, quantity, unit_price, position }) =>
    ({ description, quantity, unit_price, position, invoice_id: inv.id }));
  if (items.length) await supabase.from("invoice_items").insert(items);
  revalidatePath("/panel/cobros", "layout");
  redirect(`/panel/cobros/${inv.id}/editar`);
}

// ---------------------------------------------------------------- Cuentas de cobro
export async function saveInvoice(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const send = s(formData, "intent") === "send";
  const items = parseItems(formData);
  const row: Record<string, unknown> = {
    client_id: s(formData, "client_id"),
    concept: s(formData, "concept"),
    issue_date: s(formData, "issue_date") ?? new Date().toISOString().slice(0, 10),
    due_date: s(formData, "due_date"),
    notes: s(formData, "notes"),
  };
  const back = id ? `/panel/cobros/${id}/editar` : "/panel/cobros/nueva";
  if (!row.client_id || !row.concept) fail(back, "Elige un cliente y escribe el concepto");
  if (items.length === 0) fail(back, "Agrega al menos un ítem");

  let invoiceId = id;
  if (id) {
    delete row.client_id;
    const { error } = await supabase.from("invoices").update(row).eq("id", id);
    if (error) fail(back, error.message);
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
  } else {
    const { data, error } = await supabase.from("invoices").insert(row).select("id").single();
    if (error || !data) fail(back, error?.message ?? "No se pudo crear");
    invoiceId = data.id;
  }
  await supabase.from("invoice_items").insert(items.map((i) => ({ ...i, invoice_id: invoiceId })));
  if (send) await supabase.from("invoices").update({ status: "enviada" }).eq("id", invoiceId!);
  revalidatePath("/panel/cobros", "layout");
  redirect(`/panel/cobros/${invoiceId}`);
}

export async function setInvoiceStatus(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const status = s(formData, "status");
  await supabase.from("invoices")
    .update({ status, paid_at: status === "pagada" ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/panel/cobros", "layout");
  revalidatePath("/panel");
}

export async function deleteInvoice(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("invoices").delete().eq("id", s(formData, "id")!);
  revalidatePath("/panel/cobros", "layout");
  redirect("/panel/cobros");
}

// ---------------------------------------------------------------- Perfil
export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireCreative();
  await supabase.from("profiles").update({
    full_name: s(formData, "full_name"),
    business_name: s(formData, "business_name"),
    document_id: s(formData, "document_id"),
    city: s(formData, "city"),
    phone: s(formData, "phone"),
    bank_info: s(formData, "bank_info"),
  }).eq("id", user.id);
  revalidatePath("/panel", "layout");
  redirect("/panel/perfil?ok=1");
}
