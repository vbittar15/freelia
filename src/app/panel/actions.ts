"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { bogotaLocalToISO } from "@/lib/utils";
import type { LineItem } from "@/lib/types";
import { parseRequest } from "@/lib/requests";
import { buildContract, defaultTerms } from "@/lib/contract";
import { MODULES } from "@/lib/modules";
const MODULE_KEYS = MODULES.map((m) => m.key);

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

function post_networks(f: FormData) { return f.getAll("networks").map(String); }

function parseFiles(f: FormData, name = "attachments") {
  try {
    const arr = JSON.parse(String(f.get(name) || "[]")) as { url: string; name: string; type: string }[];
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
  const { supabase, profile } = await requireCreative();
  const id = s(formData, "id");
  const row = {
    name: s(formData, "name")!,
    company: s(formData, "company"),
    email: s(formData, "email")?.toLowerCase() ?? null,
    phone: s(formData, "phone"),
    document_id: s(formData, "document_id"),
    color: s(formData, "color") ?? "#C9D6FF",
    notes: s(formData, "notes"),
    ...(formData.has("brand") ? {
      logo_url: s(formData, "logo_url"),
      brandbook_url: s(formData, "brandbook_url"),
      brand: (() => { try { const b = JSON.parse(String(formData.get("brand") || "{}")); const hex = (v: unknown) => (typeof v === "string" && /^#[\da-f]{6}$/i.test(v) ? v : undefined);
        return { primary: hex(b.primary), secondary: hex(b.secondary), accent: hex(b.accent), font: typeof b.font === "string" ? b.font.slice(0, 60) : undefined, tone: typeof b.tone === "string" ? b.tone.slice(0, 400) : undefined }; } catch { return {}; } })(),
      modules: Object.fromEntries(MODULE_KEYS.map((k) => [k, formData.get(`mod_${k}`) === "on"])),
    } : {}),
  };
  const back = id ? `/panel/clientes/${id}/editar` : "/panel/clientes/nuevo";
  if (!row.name) fail(back, "El nombre es obligatorio");

  // Servicios que se le prestan
  let lines: { service_id: string | null; package_id: string | null; name: string; includes: string | null; qty: number; price: number; period: string }[] = [];
  try {
    lines = (JSON.parse(String(formData.get("services") || "[]")) as typeof lines)
      .filter((l) => l.name && String(l.name).trim())
      .map((l) => ({ service_id: l.service_id || null, package_id: l.package_id || null, name: String(l.name).trim().slice(0, 160),
        includes: l.includes ? String(l.includes).trim().slice(0, 500) : null, qty: Math.max(0, Number(l.qty) || 1),
        price: Math.max(0, Math.round(Number(l.price) || 0)), period: l.period === "unico" ? "unico" : "mensual" }));
  } catch { /* sin servicios */ }

  let clientId = id;
  if (id) {
    const { error } = await supabase.from("clients").update(row).eq("id", id);
    if (error) fail(back, error.message);
  } else {
    const { data, error } = await supabase.from("clients").insert(row).select("id").single();
    if (error || !data) fail(back, error?.message ?? "No se pudo crear");
    clientId = data.id;
  }
  if (formData.has("services")) {
    await supabase.from("client_services").delete().eq("client_id", clientId!);
    if (lines.length) await supabase.from("client_services").insert(lines.map((l, i) => ({ ...l, client_id: clientId, position: i })));
  }

  // Contrato
  let contractId: string | null = null;
  if (formData.get("contract") === "on") {
    const { data: draft } = await supabase.from("contracts").select("id, terms").eq("client_id", clientId!).eq("status", "borrador")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const terms = { ...defaultTerms(profile), ...((draft?.terms as object) ?? {}) };
    const built = buildContract({ creative: profile, client: row, services: lines as never, terms });
    const payload = { ...built, services: lines.map(({ name, includes, qty, price, period }) => ({ name, includes, qty, price, period })), terms,
      creative_name: profile.full_name, creative_doc: profile.document_id };
    if (draft) { await supabase.from("contracts").update(payload).eq("id", draft.id); contractId = draft.id; }
    else {
      const { data: k } = await supabase.from("contracts").insert({ ...payload, client_id: clientId }).select("id").single();
      contractId = k?.id ?? null;
    }
  }
  revalidatePath("/panel", "layout");
  if (contractId) redirect(`/panel/contratos/${contractId}?nuevo=1`);
  redirect(id ? `/panel/clientes/${id}` : `/panel/clientes/${clientId}?nuevo=1`);
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
  const tipo = s(formData, "kind") ?? "proyecto";
  const { row, missing } = parseRequest(formData, tipo);
  const back = id ? `/panel/briefs/${id}/editar` : `/panel/briefs/nuevo?tipo=${tipo}`;
  const clientId = s(formData, "client_id");
  if ((!id && !clientId) || !row.title) fail(back, "Elige un cliente y escribe un título");
  if (missing.length) fail(back, "Falta: " + missing.join(", "));
  const full = { ...row, attachments: parseFiles(formData) };

  if (id) {
    const { error } = await supabase.from("briefs").update(full).eq("id", id);
    if (error) fail(back, error.message);
    revalidatePath("/panel/briefs");
    redirect(`/panel/briefs/${id}`);
  }
  const { data, error } = await supabase.from("briefs").insert({ ...full, client_id: clientId }).select("id").single();
  if (error || !data) fail(back, error?.message ?? "No se pudo crear");
  revalidatePath("/panel/briefs");
  redirect(`/panel/briefs/${data.id}`);
}

export async function confirmMeeting(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const at = bogotaLocalToISO(s(formData, "meeting_at"));
  if (!at) fail(`/panel/briefs/${id}`, "Elige fecha y hora");
  await supabase.from("briefs").update({ meeting_at: at, meeting_link: s(formData, "meeting_link"), status: "en_proceso" }).eq("id", id);
  revalidatePath("/panel", "layout");
  redirect(`/panel/briefs/${id}?ok=reunion`);
}

export async function deliverBrief(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const { data, error } = await supabase.rpc("deliver_brief", { p_brief: id });
  if (error) fail(`/panel/briefs/${id}`, error.message);
  revalidatePath("/panel", "layout");
  redirect(`/panel/briefs/${id}?ok=entrega&n=${data ?? 0}`);
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
    topic: s(formData, "topic"),
    idea: s(formData, "idea"),
    art_text: s(formData, "art_text"),
    brief_id: s(formData, "brief_id"),
    link_url: s(formData, "link_url"),
    social: formData.get("social") === "on",
  };
  if (formData.has("assets")) {
    const assets = parseFiles(formData, "assets");
    row.assets = assets;
    // Portada: la primera imagen o video (para calendario y listas)
    row.asset_url = assets.find((a) => /^(image|video)\//.test(a.type) || /\.(png|jpe?g|gif|webp|mp4|mov|webm)$/i.test(a.url))?.url ?? null;
  }
  if (!row.social) { row.network = "entrega"; row.networks = []; }
  else if (row.network && typeof row.network === "string") row.networks = [row.network, ...((post_networks(formData)).filter((k) => k !== row.network))];
  const back = id ? `/panel/parrilla/${id}` : "/panel/parrilla/nueva";
  if (!row.client_id || !row.title) fail(back, "Elige un cliente y escribe un título");

  // El pedido debe ser del mismo cliente
  if (row.brief_id) {
    const cid = row.client_id ?? (await supabase.from("posts").select("client_id").eq("id", id!).single()).data?.client_id;
    const { data: br } = await supabase.from("briefs").select("client_id").eq("id", row.brief_id as string).single();
    if (!br || br.client_id !== cid) row.brief_id = null;
  }

  if (id) {
    delete row.client_id;
    const { error } = await supabase.from("posts").update(row).eq("id", id);
    if (error) fail(back, error.message);
    revalidatePath("/panel/parrilla", "layout");
    redirect(intent === "review" ? `/panel/enviar?ids=${id}` : `/panel/parrilla/${id}?ok=1`);
  }
  const { data, error } = await supabase.from("posts").insert(row).select("id").single();
  if (error || !data) fail(back, error?.message ?? "No se pudo crear");
  revalidatePath("/panel/parrilla", "layout");
  redirect(intent === "review" ? `/panel/enviar?ids=${data.id}` : `/panel/parrilla/${data.id}?ok=1`);
}

export async function setPostStatus(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("posts").update({ status: s(formData, "status") }).eq("id", id);
  revalidatePath("/panel/parrilla", "layout");
  revalidatePath("/panel");
}

export async function deliverPost(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const { error } = await supabase.from("posts")
    .update({ final_files: parseFiles(formData, "final_files"), status: "entregado", delivered_at: new Date().toISOString() }).eq("id", id);
  if (error) fail(`/panel/parrilla/${id}`, error.message);
  revalidatePath("/panel", "layout");
  redirect(`/panel/parrilla/${id}?ok=1`);
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
    discount: Math.max(0, Number(s(formData, "discount") ?? 0) || 0),
    tax_rate: Math.min(30, Math.max(0, Number(s(formData, "tax_rate") ?? 0) || 0)),
    withholding_rate: Math.min(20, Math.max(0, Number(s(formData, "withholding_rate") ?? 0) || 0)),
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

// ---------------------------------------------------------------- Parrilla de un pedido
export async function sendForReview(formData: FormData) {
  const { supabase } = await requireCreative();
  const ids = formData.getAll("post_ids").map(String).filter(Boolean);
  const back = `/panel/enviar?${new URLSearchParams({ cliente: s(formData, "client_id") ?? "", ids: ids.join(",") })}`;
  if (!ids.length) fail(back, "Elige al menos una pieza para enviar");
  const { data, error } = await supabase.rpc("send_posts_for_review", {
    p_posts: ids, p_message: s(formData, "message"), p_resolve: formData.get("resolve") === "on",
  });
  if (error || !data) fail(back, error?.message ?? "No se pudo enviar");
  revalidatePath("/panel", "layout");
  redirect(`/panel/envios/${data}?nuevo=1`);
}

export async function linkPosts(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const ids = formData.getAll("post_ids").map(String).filter(Boolean);
  const { data: br } = await supabase.from("briefs").select("client_id").eq("id", id).single();
  if (br && ids.length) await supabase.from("posts").update({ brief_id: id }).in("id", ids).eq("client_id", br.client_id);
  revalidatePath(`/panel/briefs/${id}`);
}

export async function unlinkPost(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("posts").update({ brief_id: null }).eq("id", s(formData, "post_id")!);
  revalidatePath(`/panel/briefs/${id}`);
}
