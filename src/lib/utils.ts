import type { LineItem } from "./types";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const money = (n: number | null | undefined) => cop.format(Number(n ?? 0));

export const total = (items: LineItem[] | undefined) =>
  (items ?? []).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);

const TZ = "America/Bogota";

export function fmtDate(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  // Las fechas "YYYY-MM-DD" se interpretan como día local, no UTC
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T12:00:00") : new Date(d);
  return new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opts }).format(date);
}

export function fmtDateTime(d: string | null | undefined) {
  return fmtDate(d, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)} d`;
  return fmtDate(d);
}

/** Convierte "2026-11-20T10:00" (hora Colombia, sin zona) en ISO UTC */
export function bogotaLocalToISO(local: string | null | undefined) {
  if (!local) return null;
  return new Date(local + ":00-05:00").toISOString();
}

/** ISO UTC -> "YYYY-MM-DDTHH:mm" en hora Colombia (para inputs datetime-local) */
export function isoToBogotaLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export const clientLabel = (c?: { name: string; company: string | null } | null) =>
  c ? c.company || c.name : "Cliente";

export const NETWORKS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  pinterest: "Pinterest",
  web: "Web / Blog",
};

export const FORMATS: Record<string, string> = {
  post: "Post",
  carrusel: "Carrusel",
  reel: "Reel / Video corto",
  historia: "Historia",
  video: "Video",
  articulo: "Artículo",
};

/** Número a letras en español (para "La suma de ... pesos") */
export function numberToWords(n: number): string {
  n = Math.round(n);
  if (n === 0) return "cero";
  const u = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const d = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const c = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const under1000 = (x: number): string => {
    if (x === 100) return "cien";
    const h = Math.floor(x / 100), r = x % 100;
    let s = c[h];
    if (r) {
      const t = r < 30 ? u[r] : d[Math.floor(r / 10)] + (r % 10 ? " y " + u[r % 10] : "");
      s = s ? s + " " + t : t;
    }
    return s;
  };
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions) parts.push(millions === 1 ? "un millón" : under1000(millions).replace(/uno$/, "un") + " millones");
  if (thousands) parts.push(thousands === 1 ? "mil" : under1000(thousands).replace(/uno$/, "un") + " mil");
  if (rest) parts.push(under1000(rest));
  let s = parts.join(" ");
  if (millions && !thousands && !rest) s += " de";
  return s;
}
