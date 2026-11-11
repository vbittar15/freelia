import type { SupabaseClient } from "@supabase/supabase-js";
import type { Package, Service } from "./types";
import { UNITS } from "./rubros";

export type CatalogItem = { key: string; group: "Servicios" | "Paquetes"; label: string; description: string; unit_price: number };

/** Servicios y paquetes del creativo listos para usar como ítems de cotización/cobro */
export async function loadCatalog(supabase: SupabaseClient): Promise<CatalogItem[]> {
  const [{ data: sd }, { data: pd }] = await Promise.all([
    supabase.from("services").select("*").eq("active", true).order("position"),
    supabase.from("packages").select("*").eq("active", true).order("position"),
  ]);
  const services = ((sd ?? []) as Service[]).map((s) => ({
    key: "s:" + s.id, group: "Servicios" as const,
    label: `${s.name} · ${UNITS[s.unit] ?? s.unit}`,
    description: s.description ? `${s.name} – ${s.description}` : s.name,
    unit_price: Number(s.price),
  }));
  const packages = ((pd ?? []) as Package[]).map((p) => ({
    key: "p:" + p.id, group: "Paquetes" as const,
    label: `${p.name} · ${p.period === "mensual" ? "mensual" : "pago único"}`,
    description: `${p.name}${p.period === "mensual" ? " (mensual)" : ""}: ${p.items.map((i) => `${i.qty} ${i.name}`).join(", ")}`,
    unit_price: Number(p.price),
  }));
  return [...packages, ...services];
}
