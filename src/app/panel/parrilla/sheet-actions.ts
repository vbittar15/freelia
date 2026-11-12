"use server";

import { revalidatePath } from "next/cache";
import { requireCreative } from "@/lib/auth";
import { FORMATS, NETWORKS, bogotaLocalToISO } from "@/lib/utils";

const TEXT = ["topic", "idea", "art_text", "copy", "notes"] as const;
type Field = (typeof TEXT)[number] | "format" | "networks" | "date" | "time";

const shortDate = (d: string) => { const [, m, day] = d.split("-"); return `${Number(day)}/${Number(m)}`; };

/** Guarda una celda de la parrilla */
export async function saveCell(id: string, field: Field, value: string | string[], date?: string, time?: string) {
  const { supabase } = await requireCreative();
  const up: Record<string, unknown> = {};
  if ((TEXT as readonly string[]).includes(field)) {
    const v = String(value ?? "").slice(0, 4000).trim() || null;
    up[field] = v;
    if (field === "topic") up.title = v ? v.slice(0, 120) : date ? `Publicación ${shortDate(date)}` : "Publicación";
  } else if (field === "format") {
    if (!(String(value) in FORMATS)) return { error: "Formato no válido" };
    up.format = value;
  } else if (field === "networks") {
    const arr = (Array.isArray(value) ? value : []).filter((k) => k in NETWORKS).slice(0, 10);
    up.networks = arr; up.network = arr[0] ?? "instagram";
  } else if (field === "date" || field === "time") {
    if (!date) { up.scheduled_at = null; }
    else up.scheduled_at = bogotaLocalToISO(`${date}T${time || "09:00"}`);
  }
  const { error } = await supabase.from("posts").update(up).eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

/** Crea filas para las fechas dadas */
export async function addRows(clientId: string, dates: string[], time: string, networks: string[], format: string) {
  const { supabase } = await requireCreative();
  const nets = networks.filter((k) => k in NETWORKS);
  const fmt = format in FORMATS ? format : "post";
  const rows = dates.slice(0, 62).map((d) => ({
    client_id: clientId, title: `Publicación ${shortDate(d)}`, social: true, status: "borrador",
    networks: nets, network: nets[0] ?? "instagram", format: fmt, scheduled_at: bogotaLocalToISO(`${d}T${time || "09:00"}`),
  }));
  if (!rows.length) return { error: "Elige al menos un día" };
  const { data, error } = await supabase.from("posts").insert(rows).select("id");
  if (error) return { error: error.message };
  revalidatePath(`/panel/clientes/${clientId}`);
  return { ok: true, ids: (data ?? []).map((r) => r.id as string) };
}

export async function deleteRow(id: string, clientId: string) {
  const { supabase } = await requireCreative();
  const { error } = await supabase.from("posts").delete().eq("id", id).in("status", ["borrador"]);
  if (error) return { error: error.message };
  revalidatePath(`/panel/clientes/${clientId}`);
  return { ok: true };
}
