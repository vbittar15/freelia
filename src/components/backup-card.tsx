"use client";

import { useState } from "react";
import { strToU8, zipSync, type Zippable } from "fflate";
import { Lia } from "./brand";

type Row = Record<string, unknown>;

const LABELS: Record<string, string> = {
  perfil: "perfil", clients: "clientes", briefs: "briefs", posts: "parrilla", post_comments: "comentarios",
  review_requests: "envios_a_aprobacion", quotes: "cotizaciones", quote_items: "cotizaciones_items",
  invoices: "cuentas_de_cobro", invoice_items: "cuentas_de_cobro_items", messages: "mensajes",
};

function toCSV(rows: Row[]) {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Separador ";" y BOM para que Excel en español lo abra bien
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => cell(r[c])).join(";"))].join("\r\n");
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "archivo";

/** Descarga una copia de seguridad en .zip (CSV para Excel + JSON + archivos opcionales) */
export function BackupCard({ role }: { role: "creative" | "client" }) {
  const [files, setFiles] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function run() {
    setBusy(true); setStatus("Reuniendo tus datos…");
    try {
      const res = await fetch("/api/backup", { cache: "no-store" });
      if (!res.ok) throw new Error("No pudimos generar la copia");
      const json = await res.json() as { exported_at: string; data: Record<string, Row[]> };
      const zip: Zippable = {};
      const d = json.data;
      zip["datos/freelia.json"] = strToU8(JSON.stringify(json, null, 2));
      for (const [t, rows] of Object.entries(d)) if (rows.length) zip[`datos/${LABELS[t] ?? t}.csv`] = strToU8(toCSV(rows));

      let got = 0, failed = 0;
      if (files) {
        const clientName = new Map((d.clients ?? []).map((c) => [c.id as string, slug(String(c.company || c.name || "cliente"))]));
        const list: { url: string; path: string }[] = [];
        for (const p of d.posts ?? []) if (p.asset_url) list.push({ url: String(p.asset_url), path: `${clientName.get(p.client_id as string) ?? "cliente"}/parrilla/${slug(String(p.title))}-${String(p.id).slice(0, 6)}` });
        for (const b of d.briefs ?? []) for (const f of (b.attachments as { url: string; name: string }[] | null) ?? []) list.push({ url: f.url, path: `${clientName.get(b.client_id as string) ?? "cliente"}/briefs/${slug(f.name)}` });
        for (const m of d.messages ?? []) if (m.attachment_url) list.push({ url: String(m.attachment_url), path: `${clientName.get(m.client_id as string) ?? "cliente"}/chat/${slug(String(m.attachment_name ?? "adjunto"))}` });
        const seen = new Set<string>();
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          if (seen.has(f.url)) continue; seen.add(f.url);
          setStatus(`Descargando archivos ${i + 1} de ${list.length}…`);
          try {
            const r = await fetch(f.url);
            if (!r.ok) throw 0;
            const ext = f.url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i)?.[1];
            let path = `archivos/${f.path}`;
            if (ext && !path.toLowerCase().endsWith("." + ext.toLowerCase())) path += "." + ext;
            while (zip[path]) path = path.replace(/(\.[a-z0-9]+)?$/i, (e) => `-2${e}`);
            zip[path] = [new Uint8Array(await r.arrayBuffer()), { level: 0 }];
            got++;
          } catch { failed++; }
        }
      }
      zip["LEEME.txt"] = strToU8(
        `Copia de seguridad de Freelia\nGenerada: ${new Date(json.exported_at).toLocaleString("es-CO")}\n\n` +
        `· datos/*.csv  → ábrelos en Excel o Google Sheets\n· datos/freelia.json → copia completa en formato técnico\n` +
        (files ? `· archivos/ → artes y adjuntos organizados por cliente (${got} archivos${failed ? `, ${failed} no se pudieron descargar` : ""})\n` : "") +
        `\nGuárdala en un lugar seguro: contiene datos de tus clientes.\n`);

      setStatus("Comprimiendo…");
      const blob = new Blob([zipSync(zip, { level: 6 })], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `freelia-copia-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`¡Lista! Tu copia se descargó${failed ? ` (${failed} ${failed === 1 ? "archivo no se pudo incluir" : "archivos no se pudieron incluir"})` : ""}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Algo salió mal. Inténtalo de nuevo.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-6 max-w-3xl card p-5 sm:p-6">
      <div className="flex gap-4 items-start">
        <div className="shrink-0 hidden sm:block"><Lia size={44} mood={busy ? "idea" : "smile"} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="h2">Copia de seguridad</h2>
          <p className="text-[14px] text-muted mt-1">
            {role === "creative"
              ? "Descarga todo en un .zip: clientes, parrilla, briefs, cotizaciones, cuentas de cobro y mensajes en archivos de Excel, más tus artes y adjuntos."
              : "Descarga en un .zip tus piezas, pedidos, cotizaciones, cuentas de cobro y mensajes, más los archivos."}
          </p>
          <label className="mt-3 flex items-start gap-2.5 text-[14px] cursor-pointer w-fit">
            <input type="checkbox" checked={files} onChange={(e) => setFiles(e.target.checked)} className="size-4 mt-1 shrink-0 accent-[#3d5bf5]" disabled={busy} />
            <span>Incluir artes y archivos adjuntos <span className="text-muted">(tarda más)</span></span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={run} disabled={busy} className="btn btn-primary disabled:opacity-60">{busy ? "Preparando…" : "Descargar copia (.zip)"}</button>
            {status && <span className="text-[13px] text-muted" aria-live="polite">{status}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
