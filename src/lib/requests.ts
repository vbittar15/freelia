/** Tipos de solicitud que puede hacer un cliente y sus campos */
import type { Brief, Post } from "./types";
import type { IconName, Tint } from "@/components/icons";

export type FieldDef = {
  key: string; // columna de briefs o "d.<clave>" para details
  label: string;
  type: "text" | "textarea" | "date" | "month" | "number" | "select" | "checks" | "money";
  placeholder?: string;
  options?: [string, string][];
  required?: boolean;
  wide?: boolean;
};

export type RequestKind = {
  key: "proyecto" | "pieza" | "parrilla" | "campana" | "reunion";
  label: string;
  icon: IconName;
  tint: Tint;
  desc: string;
  titleLabel: string;
  titlePlaceholder: string;
  fields: FieldDef[];
  files: boolean;
  material: boolean; // produce piezas para revisar
};

const REDES: [string, string][] = [["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["x", "X"]];

export const KINDS: RequestKind[] = [
  { key: "pieza", label: "Pieza", icon: "image", tint: "rosa", desc: "Un diseño, video, foto o texto puntual",
    titleLabel: "¿Qué pieza necesitas?", titlePlaceholder: "Ej. Flyer para el evento del sábado", files: true, material: true,
    fields: [
      { key: "d.formato", label: "Tipo de pieza", type: "select", options: [["post", "Post para redes"], ["carrusel", "Carrusel"], ["historia", "Historia"], ["video", "Video / reel"], ["flyer", "Flyer o afiche"], ["logo", "Logo"], ["presentacion", "Presentación"], ["foto", "Fotografía"], ["web", "Página web"], ["otro", "Otro"]] },
      { key: "deadline", label: "¿Para cuándo?", type: "date" },
      { key: "key_message", label: "Texto o mensaje que debe llevar", type: "textarea", wide: true },
      { key: "refs", label: "Referencias o links", type: "textarea", wide: true },
    ] },
  { key: "parrilla", label: "Parrilla", icon: "grid", tint: "azul", desc: "El contenido de redes de un mes",
    titleLabel: "Nombre de la parrilla", titlePlaceholder: "Ej. Parrilla de diciembre", files: true, material: true,
    fields: [
      { key: "d.mes", label: "Mes", type: "month", required: true },
      { key: "d.cantidad", label: "¿Cuántas publicaciones?", type: "number", placeholder: "12" },
      { key: "d.redes", label: "Redes", type: "checks", options: REDES, wide: true },
      { key: "objective", label: "Objetivo del mes", type: "textarea", wide: true, placeholder: "Ej. Lanzar el sabor nuevo y vender más los fines de semana" },
      { key: "d.fechas", label: "Fechas o temas importantes", type: "textarea", wide: true, placeholder: "Ej. 8 dic promo 2x1, Navidad, cierre de año" },
    ] },
  { key: "campana", label: "Campaña", icon: "megaphone", tint: "amarillo", desc: "Varias piezas alrededor de un objetivo",
    titleLabel: "Nombre de la campaña", titlePlaceholder: "Ej. Lanzamiento sabor maracuyá", files: true, material: true,
    fields: [
      { key: "objective", label: "Objetivo", type: "textarea", wide: true, required: true },
      { key: "d.inicio", label: "Inicia", type: "date" },
      { key: "deadline", label: "Termina", type: "date" },
      { key: "audience", label: "¿A quién va dirigida?", type: "textarea" },
      { key: "key_message", label: "Mensaje principal", type: "textarea" },
      { key: "d.canales", label: "Canales", type: "text", wide: true, placeholder: "Ej. Instagram, TikTok, punto de venta" },
      { key: "budget", label: "Presupuesto (opcional)", type: "money" },
    ] },
  { key: "proyecto", label: "Proyecto", icon: "layers", tint: "lila", desc: "Algo más grande: marca, web, video…",
    titleLabel: "Nombre del proyecto", titlePlaceholder: "Ej. Rediseño de la página web", files: true, material: true,
    fields: [
      { key: "objective", label: "¿Qué quieres lograr?", type: "textarea", wide: true, required: true },
      { key: "deliverables", label: "¿Qué esperas recibir?", type: "textarea", wide: true, placeholder: "Ej. Logo, manual de marca y plantillas" },
      { key: "deadline", label: "¿Para cuándo?", type: "date" },
      { key: "budget", label: "Presupuesto (opcional)", type: "money" },
      { key: "refs", label: "Referencias o links", type: "textarea", wide: true },
    ] },
  { key: "reunion", label: "Reunión", icon: "video", tint: "verde", desc: "Hablar en vivo con tu equipo",
    titleLabel: "¿De qué quieres hablar?", titlePlaceholder: "Ej. Revisar resultados del mes", files: false, material: false,
    fields: [
      { key: "d.modo", label: "Modalidad", type: "select", options: [["virtual", "Virtual (videollamada)"], ["presencial", "Presencial"], ["llamada", "Llamada"]] },
      { key: "d.opciones", label: "¿Qué días y horas te sirven?", type: "textarea", wide: true, required: true, placeholder: "Ej. martes o jueves después de las 3 p. m." },
    ] },
];

export const kindMap = Object.fromEntries(KINDS.map((k) => [k.key, k])) as Record<string, RequestKind>;
export const kindOf = (b: Pick<Brief, "kind">) => kindMap[b.kind ?? "proyecto"] ?? kindMap.proyecto;

/** Valor de un campo para mostrar */
export function fieldValue(b: Brief, f: FieldDef): string | null {
  const raw = f.key.startsWith("d.") ? (b.details as Record<string, unknown> | null)?.[f.key.slice(2)] : (b as unknown as Record<string, unknown>)[f.key];
  if (raw == null || raw === "") return null;
  if (Array.isArray(raw)) return raw.map((v) => f.options?.find(([k]) => k === v)?.[1] ?? v).join(", ") || null;
  if (f.type === "select") return f.options?.find(([k]) => k === raw)?.[1] ?? String(raw);
  if (f.type === "month") {
    const [y, m] = String(raw).split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  }
  if (f.type === "date") return new Date(String(raw) + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  if (f.type === "money") return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(raw));
  return String(raw);
}

/** Etapa de una solicitud, para mostrar el avance */
export type Stage = { key: string; label: string };
export function stagesFor(kind: RequestKind): Stage[] {
  if (kind.key === "reunion") return [{ key: "nuevo", label: "Solicitada" }, { key: "confirmada", label: "Confirmada" }, { key: "realizada", label: "Realizada" }];
  return [{ key: "nuevo", label: "Recibida" }, { key: "en_proceso", label: "En proceso" }, { key: "revision", label: "En revisión" }, { key: "aprobado", label: "Aprobada" }, { key: "entregado", label: "Entregada" }];
}

export function stageOf(b: Brief, posts: Pick<Post, "status">[]): string {
  const kind = kindOf(b);
  if (kind.key === "reunion") {
    if (!b.meeting_at) return "nuevo";
    return new Date(b.meeting_at) < new Date() ? "realizada" : "confirmada";
  }
  if (b.delivered_at) return "entregado";
  const sent = posts.filter((p) => p.status !== "borrador");
  if (sent.length && sent.every((p) => ["aprobado", "publicado", "entregado"].includes(p.status)) && posts.every((p) => p.status !== "borrador")) return "aprobado";
  if (sent.some((p) => p.status === "en_revision" || p.status === "cambios")) return "revision";
  if (b.status === "nuevo" && !posts.length) return "nuevo";
  return "en_proceso";
}

export const STAGE_LABEL: Record<string, string> = {
  nuevo: "Nueva", en_proceso: "En proceso", revision: "En revisión", aprobado: "Aprobada", entregado: "Entregada",
  confirmada: "Reunión confirmada", realizada: "Reunión realizada",
};

/** Convierte el formulario de una solicitud en columnas + details */
export function parseRequest(f: FormData, kindKey: string) {
  const kind = kindMap[kindKey] ?? kindMap.proyecto;
  const str = (k: string) => { const v = f.get(k); return v == null || String(v).trim() === "" ? null : String(v).trim(); };
  const row: Record<string, unknown> = { kind: kind.key, title: str("title") };
  const details: Record<string, unknown> = {};
  for (const fd of kind.fields) {
    const name = fd.key;
    let v: unknown;
    if (fd.type === "checks") v = f.getAll(name).map(String).filter(Boolean);
    else if (fd.type === "number" || fd.type === "money") { const x = str(name); v = x == null ? null : Number(x.replace(/[^\d.]/g, "")) || null; }
    else v = str(name);
    if (name.startsWith("d.")) { if (v != null && !(Array.isArray(v) && !v.length)) details[name.slice(2)] = v; }
    else row[name] = v;
  }
  if (!row.title && kind.key === "parrilla" && details.mes) {
    const [y, m] = String(details.mes).split("-").map(Number);
    row.title = "Parrilla de " + new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  }
  row.details = details;
  const missing = kind.fields.filter((fd) => fd.required && (fd.key.startsWith("d.") ? details[fd.key.slice(2)] == null : row[fd.key] == null)).map((fd) => fd.label);
  return { row, missing, kind };
}
