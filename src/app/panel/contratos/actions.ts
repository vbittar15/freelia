"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { buildContract, defaultTerms } from "@/lib/contract";
import type { ClientService, ContractTerms } from "@/lib/types";

const s = (f: FormData, k: string) => { const v = f.get(k); return v == null || String(v).trim() === "" ? null : String(v).trim(); };
const num = (f: FormData, k: string, min: number, max: number, def: number) => { const v = Number(s(f, k)); return Number.isFinite(v) && s(f, k) != null ? Math.max(min, Math.min(max, Math.round(v))) : def; };
const back = (id: string, q = "") => redirect(`/panel/contratos/${id}${q}`);

async function regenerate(id: string, terms?: Partial<ContractTerms>) {
  const { supabase, profile } = await requireCreative();
  const { data: k } = await supabase.from("contracts").select("*, clients(name, company, document_id, email)").eq("id", id).single();
  if (!k) redirect("/panel/clientes");
  if (k.status !== "borrador") back(id, `?error=${encodeURIComponent("Solo puedes cambiar un contrato en borrador")}`);
  const { data: lines } = await supabase.from("client_services").select("*").eq("client_id", k.client_id).order("position");
  const t = { ...defaultTerms(profile), ...(k.terms ?? {}), ...(terms ?? {}) };
  const services = ((lines ?? []) as ClientService[]).map(({ name, includes, qty, price, period }) => ({ name, includes, qty, price, period }));
  const built = buildContract({ creative: profile, client: k.clients, services, terms: t });
  await supabase.from("contracts").update({ ...built, services, terms: t, creative_name: profile.full_name, creative_doc: profile.document_id }).eq("id", id);
}

export async function updateTerms(formData: FormData) {
  const id = s(formData, "id")!;
  const months = num(formData, "months", 0, 60, 6);
  await regenerate(id, {
    start: s(formData, "start") ?? undefined, months: months || null, pay_day: num(formData, "pay_day", 1, 28, 5),
    advance: num(formData, "advance", 0, 100, 50), notice_days: num(formData, "notice_days", 0, 90, 15),
    rounds: num(formData, "rounds", 0, 10, 2), due_days: num(formData, "due_days", 0, 90, 15), city: s(formData, "city") ?? undefined,
  });
  revalidatePath(`/panel/contratos/${id}`);
  back(id, "?ok=terminos");
}

export async function refreshFromServices(formData: FormData) {
  const id = s(formData, "id")!;
  await regenerate(id);
  revalidatePath(`/panel/contratos/${id}`);
  back(id, "?ok=regenerado");
}

export async function saveBody(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (body.length < 50) back(id, `?error=${encodeURIComponent("El texto del contrato está muy corto")}`);
  const { error } = await supabase.from("contracts").update({ body, title: s(formData, "title") ?? undefined }).eq("id", id).eq("status", "borrador");
  if (error) back(id, `?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/panel/contratos/${id}`);
  back(id, "?ok=texto");
}

export async function sendContract(formData: FormData) {
  const { supabase, profile } = await requireCreative();
  const id = s(formData, "id")!;
  if (!profile.full_name || !profile.document_id) back(id, `?error=${encodeURIComponent("Completa tu nombre y tu cédula o NIT en Mi perfil antes de enviar el contrato")}`);
  const { error } = await supabase.from("contracts")
    .update({ status: "enviado", sent_at: new Date().toISOString(), creative_name: profile.full_name, creative_doc: profile.document_id })
    .eq("id", id).eq("status", "borrador");
  if (error) back(id, `?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/panel", "layout");
  back(id, "?ok=enviado");
}

export async function unsendContract(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  await supabase.from("contracts").update({ status: "borrador", sent_at: null }).eq("id", id).eq("status", "enviado");
  revalidatePath("/panel", "layout");
  back(id);
}

export async function voidContract(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const { error } = await supabase.from("contracts").update({ status: "anulado" }).eq("id", id);
  if (error) back(id, `?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/panel", "layout");
  back(id);
}

export async function newContract(formData: FormData) {
  const { supabase, profile } = await requireCreative();
  const clientId = s(formData, "client_id")!;
  const { data: c } = await supabase.from("clients").select("name, company, document_id, email").eq("id", clientId).single();
  if (!c) redirect("/panel/clientes");
  const { data: lines } = await supabase.from("client_services").select("*").eq("client_id", clientId).order("position");
  const terms = defaultTerms(profile);
  const services = ((lines ?? []) as ClientService[]).map(({ name, includes, qty, price, period }) => ({ name, includes, qty, price, period }));
  const built = buildContract({ creative: profile, client: c, services, terms });
  const { data: k, error } = await supabase.from("contracts")
    .insert({ ...built, services, terms, client_id: clientId, creative_name: profile.full_name, creative_doc: profile.document_id }).select("id").single();
  if (error || !k) redirect(`/panel/clientes/${clientId}?error=${encodeURIComponent(error?.message ?? "No se pudo crear")}`);
  revalidatePath("/panel", "layout");
  back(k.id, "?nuevo=1");
}
