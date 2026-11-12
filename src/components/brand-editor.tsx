"use client";

import { useRef, useState } from "react";
import type { ClientBrand } from "@/lib/types";
import { uploadFile } from "@/lib/upload";
import { brandShades, cn } from "@/lib/utils";
import { Icon } from "./icons";

const FONTS = ["Poppins", "Montserrat", "Inter", "Lato", "Nunito", "Raleway", "Playfair Display", "DM Serif Display", "Space Grotesk", "Otra"];

/** Saca los colores dominantes de una imagen (ignora blancos, negros y transparencias) */
async function extractColors(url: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = c.height = 72;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 72, 72);
  const d = ctx.getImageData(0, 0, 72, 72).data;
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]];
    if (a < 160) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max > 238 && min > 225) continue; // blanco
    if (max < 28) continue;               // negro
    const k = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const e = buckets.get(k) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b; buckets.set(k, e);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n]);
  const picked: number[][] = [];
  for (const col of sorted) {
    if (picked.every((p) => Math.hypot(p[0] - col[0], p[1] - col[1], p[2] - col[2]) > 70)) picked.push(col);
    if (picked.length === 3) break;
  }
  return picked.map((p) => "#" + p.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""));
}

/** Marca del cliente: logo, colores, tipografía, tono y brand book */
export function BrandEditor({ userId, initial, logo, brandbook, clientName }: {
  userId: string; initial?: ClientBrand | null; logo?: string | null; brandbook?: string | null; clientName?: string;
}) {
  const [brand, setBrand] = useState<ClientBrand>(initial ?? {});
  const [logoUrl, setLogoUrl] = useState(logo ?? "");
  const [book, setBook] = useState<{ url: string; name: string } | null>(brandbook ? { url: brandbook, name: "Brand book" } : null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const logoIn = useRef<HTMLInputElement>(null);
  const bookIn = useRef<HTMLInputElement>(null);
  const set = (p: Partial<ClientBrand>) => setBrand((b) => ({ ...b, ...p }));

  async function onLogo(f?: File) {
    if (!f) return;
    setBusy("logo"); setErr("");
    try {
      const r = await uploadFile(f, userId);
      setLogoUrl(r.url);
      if (!brand.primary) {
        const cols = await extractColors(r.url).catch(() => []);
        if (cols.length) set({ primary: cols[0], secondary: cols[1], accent: cols[2] });
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "No se pudo subir"); }
    setBusy(null);
  }
  async function fromLogo() {
    if (!logoUrl) return;
    setBusy("colors");
    const cols = await extractColors(logoUrl).catch(() => []);
    if (cols.length) set({ primary: cols[0], secondary: cols[1], accent: cols[2] });
    else setErr("No encontré colores en el logo");
    setBusy(null);
  }
  async function onBook(f?: File) {
    if (!f) return;
    setBusy("book"); setErr("");
    try { const r = await uploadFile(f, userId); setBook({ url: r.url, name: r.name }); }
    catch (e) { setErr(e instanceof Error ? e.message : "No se pudo subir"); }
    setBusy(null);
  }

  const sh = brandShades(brand.primary || "#3D5BF5");
  const swatch = (k: "primary" | "secondary" | "accent", label: string) => (
    <label className="flex items-center gap-2.5 rounded-[14px] bg-white px-3 py-2 cursor-pointer">
      <span className="relative size-8 rounded-[10px] ring-1 ring-line overflow-hidden shrink-0" style={{ background: brand[k] || "#fff" }}>
        <input type="color" value={brand[k] || "#ffffff"} onChange={(e) => set({ [k]: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={label} />
      </span>
      <span className="min-w-0"><span className="block text-[12px] text-muted">{label}</span><span className="block text-[13px] font-semibold uppercase">{brand[k] || "—"}</span></span>
    </label>
  );

  return (
    <div className="grid gap-4">
      <input type="hidden" name="logo_url" value={logoUrl} />
      <input type="hidden" name="brandbook_url" value={book?.url ?? ""} />
      <input type="hidden" name="brand" value={JSON.stringify(brand)} />

      <div className="grid sm:grid-cols-[150px_minmax(0,1fr)] gap-4 items-start">
        <div>
          <span className="label">Logo</span>
          <button type="button" onClick={() => logoIn.current?.click()}
            className="size-[150px] rounded-[22px] bg-white ring-1 ring-line grid place-items-center overflow-hidden hover:ring-brand transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoUrl ? <img src={logoUrl} alt="Logo" className="max-w-[80%] max-h-[80%] object-contain" />
              : <span className="flex flex-col items-center gap-1 text-muted text-[13px]"><Icon name="image" />{busy === "logo" ? "Subiendo…" : "Subir logo"}</span>}
          </button>
          <input ref={logoIn} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
          {logoUrl && <button type="button" onClick={() => setLogoUrl("")} className="mt-1 text-[12px] text-muted hover:text-ink">Quitar logo</button>}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="label !mb-0">Colores de la marca</span>
            {logoUrl && <button type="button" onClick={fromLogo} className="text-[13px] font-semibold text-brand-dark inline-flex items-center gap-1"><Icon name="sparkle" className="size-4" />{busy === "colors" ? "Leyendo…" : "Tomar del logo"}</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{swatch("primary", "Principal")}{swatch("secondary", "Secundario")}{swatch("accent", "Acento")}</div>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            <label className="block"><span className="label">Tipografía</span>
              <select className="input" value={brand.font ?? ""} onChange={(e) => set({ font: e.target.value })}>
                <option value="">Sin definir</option>{FONTS.map((f) => <option key={f}>{f}</option>)}
              </select></label>
            <div>
              <span className="label">Brand book o manual de marca</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => bookIn.current?.click()} className="btn btn-soft btn-sm"><Icon name="clip" className="size-4" />{busy === "book" ? "Subiendo…" : book ? "Cambiar" : "Subir PDF"}</button>
                {book && <a href={book.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-brand-dark truncate">{book.name}</a>}
              </div>
              <input ref={bookIn} type="file" accept=".pdf,image/*,.zip,.ai,.psd,.fig" className="hidden" onChange={(e) => onBook(e.target.files?.[0])} />
            </div>
          </div>
          <label className="block"><span className="label">Tono de comunicación</span>
            <textarea className="input" rows={2} value={brand.tone ?? ""} onChange={(e) => set({ tone: e.target.value })} placeholder="Ej. Cercano y divertido, tutea, usa emojis con moderación" /></label>
        </div>
      </div>
      {err && <p className="text-[13px] text-[#C2427F]">{err}</p>}

      {/* Vista previa del portal con su marca */}
      {sh && (
        <div className="rounded-[20px] overflow-hidden ring-1 ring-line bg-white">
          <div className="flex items-center gap-3 px-4 h-14" style={{ background: sh.soft }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoUrl ? <img src={logoUrl} alt="" className="h-8 max-w-[120px] object-contain" /> : <span className="font-bold" style={{ color: sh.dark }}>{clientName || "Tu cliente"}</span>}
            <span className="ml-auto text-[12px] text-muted">Así se verá su portal</span>
          </div>
          <div className="p-4 flex flex-wrap items-center gap-2">
            <span className={cn("btn btn-sm text-white")} style={{ background: sh.brand }}>Aprobar</span>
            <span className="btn btn-sm" style={{ background: sh.tint, color: sh.dark }}>Pedir cambios</span>
            <span className="badge" style={{ background: sh.soft, color: sh.dark }}>En revisión</span>
            {brand.font && <span className="text-[13px] text-muted ml-auto">Tipografía: {brand.font}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Logo y color del creativo (para sus documentos) */
export function MyBrandFields({ userId, logo, color }: { userId: string; logo?: string | null; color?: string | null }) {
  const [url, setUrl] = useState(logo ?? "");
  const [c, setC] = useState(color ?? "#3D5BF5");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function onFile(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      const r = await uploadFile(f, userId); setUrl(r.url);
      const cols = await extractColors(r.url).catch(() => []); if (cols[0]) setC(cols[0]);
    } finally { setBusy(false); }
  }
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name="logo_url" value={url} />
      <input type="hidden" name="brand_color" value={c} />
      <button type="button" onClick={() => input.current?.click()} className="size-16 rounded-[16px] bg-white ring-1 ring-line grid place-items-center overflow-hidden shrink-0 hover:ring-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="Tu logo" className="max-w-[85%] max-h-[85%] object-contain" /> : <Icon name="image" className="text-faint" />}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{busy ? "Subiendo…" : url ? "Cambiar logo" : "Subir logo"}</div>
        <label className="mt-1 flex items-center gap-2 text-[13px] text-muted cursor-pointer">
          <span className="relative size-6 rounded-[8px] ring-1 ring-line overflow-hidden" style={{ background: c }}>
            <input type="color" value={c} onChange={(e) => setC(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Color de tu marca" />
          </span>
          Color: <span className="uppercase font-semibold text-ink">{c}</span>
        </label>
      </div>
    </div>
  );
}
