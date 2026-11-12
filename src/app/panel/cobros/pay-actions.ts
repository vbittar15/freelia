"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { withDefaults } from "@/lib/rubros";
import type { ClientService } from "@/lib/types";
import { invoiceTotals } from "@/lib/utils";

const s = (f: FormData, k: string) => { const v = f.get(k); return v == null || String(v).trim() === "" ? null : String(v).trim(); };
const back = (id: string, q = "") => redirect(`/panel/cobros/${id}${q}`);
const proof = (f: FormData) => { try { const a = JSON.parse(String(f.get("proof") || "[]")); return Array.isArray(a) && a[0]?.url ? String(a[0].url) : null; } catch { return null; } };

async function balanceOf(id: string) {
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("invoices").select("*, invoice_items(quantity, unit_price), invoice_payments(amount, confirmed)").eq("id", id).single();
  return data ? invoiceTotals(data) : null;
}

export async function registerPayment(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "invoice_id")!;
  const amount = Math.round(Number(s(formData, "amount") ?? 0));
  if (!(amount > 0)) back(id, `?error=${encodeURIComponent("Escribe el valor del pago")}`);
  const { error } = await supabase.from("invoice_payments").insert({
    invoice_id: id, amount, paid_on: s(formData, "paid_on") ?? new Date().toISOString().slice(0, 10),
    method: s(formData, "method") ?? "transferencia", reference: s(formData, "reference"), note: s(formData, "note"), proof_url: proof(formData), confirmed: true,
  });
  if (error) back(id, `?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/panel", "layout");
  back(id, "?ok=pago");
}

export async function markPaid(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id")!;
  const t = await balanceOf(id);
  if (t && t.balance > 0) await supabase.from("invoice_payments").insert({ invoice_id: id, amount: t.balance, method: "transferencia", confirmed: true, note: "Pago registrado como completo" });
  await supabase.from("invoices").update({ status: "pagada", paid_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/panel", "layout");
  back(id, "?ok=pagada");
}

export async function confirmPayment(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "invoice_id")!;
  await supabase.from("invoice_payments").update({ confirmed: true }).eq("id", s(formData, "payment_id")!);
  revalidatePath("/panel", "layout");
  back(id, "?ok=confirmado");
}

export async function removePayment(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "invoice_id")!;
  await supabase.from("invoice_payments").delete().eq("id", s(formData, "payment_id")!);
  const t = await balanceOf(id);
  if (t && t.balance > 0) await supabase.from("invoices").update({ status: "enviada", paid_at: null }).eq("id", id).eq("status", "pagada");
  revalidatePath("/panel", "layout");
  back(id);
}

export async function markReminded(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("invoices").update({ reminded_at: new Date().toISOString() }).eq("id", s(formData, "id")!);
  revalidatePath("/panel/cobros", "layout");
}

/** Cuenta de cobro del mes con los servicios mensuales del cliente */
export async function generateMonthly(formData: FormData) {
  const { supabase, profile } = await requireCreative();
  const clientId = s(formData, "client_id")!;
  const period = s(formData, "period")!;
  const { data: exists } = await supabase.from("invoices").select("id").eq("client_id", clientId).eq("period", period).maybeSingle();
  if (exists) back(exists.id);
  const { data: lines } = await supabase.from("client_services").select("*").eq("client_id", clientId).eq("period", "mensual").order("position");
  const svc = (lines ?? []) as ClientService[];
  if (!svc.length) redirect(`/panel/clientes/${clientId}?tab=cobros&error=${encodeURIComponent("Este cliente no tiene servicios mensuales. Agrégalos en Editar cliente.")}`);
  const st = withDefaults(profile.settings);
  const [y, m] = period.split("-").map(Number);
  const mes = new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const today = new Date(Date.now() - 5 * 3600000);
  const due = new Date(today.getTime() + st.invoice_due_days * 86400000).toISOString().slice(0, 10);
  const { data: inv, error } = await supabase.from("invoices").insert({
    client_id: clientId, concept: `Servicios de ${mes}`, period, issue_date: today.toISOString().slice(0, 10), due_date: due,
    notes: st.invoice_notes, tax_rate: st.tax_rate, withholding_rate: st.withholding_rate,
  }).select("id").single();
  if (error || !inv) redirect(`/panel/clientes/${clientId}?tab=cobros&error=${encodeURIComponent(error?.message ?? "No se pudo crear")}`);
  await supabase.from("invoice_items").insert(svc.map((x, i) => ({
    invoice_id: inv.id, description: `${x.name}${x.includes ? ` – ${x.includes}` : ""} (${mes})`, quantity: x.qty, unit_price: x.price, position: i,
  })));
  revalidatePath("/panel", "layout");
  back(inv.id, "?ok=generada");
}
