"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { UNITS, suggestedServices, validRubros, withDefaults } from "@/lib/rubros";
import { NETWORKS } from "@/lib/utils";
import type { PackageItem } from "@/lib/types";

const s = (f: FormData, k: string) => {
  const v = f.get(k);
  return v === null || String(v).trim() === "" ? null : String(v).trim();
};
const money = (f: FormData, k: string) => {
  const v = s(f, k);
  const x = v === null ? 0 : Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(x) && x >= 0 ? Math.round(x) : 0;
};
const go = (tab: string, extra = "") => redirect(`/panel/ajustes?tab=${tab}${extra}`);
const done = (tab: string, msg = "Guardado") => {
  revalidatePath("/panel", "layout");
  go(tab, `&ok=${encodeURIComponent(msg)}`);
};

// ---------------------------------------------------------------- Rubros
export async function saveSpecialties(formData: FormData) {
  const { supabase, user } = await requireCreative();
  const specialties = validRubros(formData.getAll("specialties"));
  if (!specialties.length) go("negocio", `&error=${encodeURIComponent("Elige al menos un rubro")}`);
  await supabase.from("profiles").update({ specialties }).eq("id", user.id);
  done("negocio", "Rubros actualizados");
}

// ---------------------------------------------------------------- Servicios
export async function saveService(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  const unit = s(formData, "unit") ?? "proyecto";
  const row = {
    name: s(formData, "name"),
    description: s(formData, "description"),
    category: s(formData, "category"),
    unit: unit in UNITS ? unit : "proyecto",
    price: money(formData, "price"),
    active: formData.get("active") !== "off",
  };
  if (!row.name) go("servicios", `&error=${encodeURIComponent("Escribe el nombre del servicio")}`);
  if (id) await supabase.from("services").update(row).eq("id", id);
  else await supabase.from("services").insert({ ...row, position: Date.now() % 1e9 });
  done("servicios", id ? "Servicio actualizado" : "Servicio agregado");
}

export async function deleteService(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("services").delete().eq("id", s(formData, "id")!);
  done("servicios", "Servicio eliminado");
}

export async function addSuggested(formData: FormData) {
  const { supabase, profile } = await requireCreative();
  const names = formData.getAll("names").map(String);
  const all = suggestedServices(profile.specialties ?? []);
  const { data: existing } = await supabase.from("services").select("name");
  const have = new Set((existing ?? []).map((e) => e.name.toLowerCase()));
  const rows = all.filter((x) => names.includes(x.name) && !have.has(x.name.toLowerCase()))
    .map((x, i) => ({ name: x.name, description: x.description ?? null, category: x.category, unit: x.unit, price: x.price, position: i }));
  if (rows.length) await supabase.from("services").insert(rows);
  done("servicios", rows.length === 1 ? "Servicio agregado" : `${rows.length} servicios agregados`);
}

// ---------------------------------------------------------------- Paquetes
export async function savePackage(formData: FormData) {
  const { supabase } = await requireCreative();
  const id = s(formData, "id");
  let items: PackageItem[] = [];
  try {
    items = (JSON.parse(String(formData.get("items") || "[]")) as PackageItem[])
      .filter((i) => i.name && Number(i.qty) > 0)
      .map((i) => ({ service_id: i.service_id ?? null, name: String(i.name).slice(0, 120), qty: Number(i.qty) }));
  } catch { /* vacío */ }
  const row = {
    name: s(formData, "name"),
    description: s(formData, "description"),
    period: s(formData, "period") === "mensual" ? "mensual" : "unico",
    price: money(formData, "price"),
    items,
  };
  if (!row.name) go("paquetes", `&error=${encodeURIComponent("Escribe el nombre del paquete")}`);
  if (!items.length) go("paquetes", `&error=${encodeURIComponent("Incluye al menos un servicio en el paquete")}`);
  if (id) await supabase.from("packages").update(row).eq("id", id);
  else await supabase.from("packages").insert({ ...row, position: Date.now() % 1e9 });
  done("paquetes", id ? "Paquete actualizado" : "Paquete creado");
}

export async function deletePackage(formData: FormData) {
  const { supabase } = await requireCreative();
  await supabase.from("packages").delete().eq("id", s(formData, "id")!);
  done("paquetes", "Paquete eliminado");
}

// ---------------------------------------------------------------- Preferencias
export async function saveSettings(formData: FormData) {
  const { supabase, user, profile } = await requireCreative();
  const tab = s(formData, "tab") ?? "cotizaciones";
  const cur = withDefaults(profile.settings);
  const int = (k: string, min: number, max: number, def: number) => {
    const v = Number(s(formData, k));
    return Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : def;
  };
  const next = { ...cur };
  if (tab === "cotizaciones") {
    next.quote_valid_days = int("quote_valid_days", 1, 365, cur.quote_valid_days);
    next.quote_notes = s(formData, "quote_notes") ?? "";
    next.invoice_due_days = int("invoice_due_days", 0, 365, cur.invoice_due_days);
    next.invoice_notes = s(formData, "invoice_notes") ?? "";
  } else if (tab === "parrilla") {
    next.networks = formData.getAll("networks").map(String).filter((k) => k in NETWORKS);
    next.rounds_included = int("rounds_included", 0, 10, cur.rounds_included);
  }
  await supabase.from("profiles").update({ settings: next }).eq("id", user.id);
  done(tab, "Preferencias guardadas");
}

// ---------------------------------------------------------------- Bienvenida
export async function finishOnboarding(formData: FormData) {
  const { supabase, user, profile } = await requireCreative();
  const specialties = validRubros(formData.getAll("specialties"));
  if (!specialties.length) redirect(`/bienvenida?error=${encodeURIComponent("Elige al menos un rubro")}`);
  await supabase.from("profiles").update({
    specialties,
    business_name: s(formData, "business_name") ?? profile.business_name,
    city: s(formData, "city") ?? profile.city,
    onboarded_at: new Date().toISOString(),
  }).eq("id", user.id);

  // Servicios sugeridos elegidos (con el precio que haya ajustado)
  const picked = formData.getAll("svc").map(String);
  const sug = suggestedServices(specialties);
  const { data: existing } = await supabase.from("services").select("name");
  const have = new Set((existing ?? []).map((e) => e.name.toLowerCase()));
  const rows = sug.filter((x) => picked.includes(x.name) && !have.has(x.name.toLowerCase())).map((x, i) => ({
    name: x.name, description: x.description ?? null, category: x.category, unit: x.unit,
    price: money(formData, `price:${x.name}`) || x.price, position: i,
  }));
  if (rows.length) await supabase.from("services").insert(rows);
  revalidatePath("/panel", "layout");
  redirect("/panel?tour=1");
}
