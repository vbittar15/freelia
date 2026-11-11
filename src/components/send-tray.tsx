"use client";

import { useMemo, useState } from "react";
import { Lia, Logo } from "./brand";
import { StatusBadge } from "./ui";
import { SubmitButton } from "./client-ui";
import { FORMATS, NETWORKS, cn, fmtDateTime } from "@/lib/utils";
import type { Post } from "@/lib/types";

export type TrayPost = Post & { openPins: number; lastChange: string | null };

const isImg = (u?: string | null) => !!u && !/\.(mp4|mov|webm)$/i.test(u);

function Thumb({ p, size = 56 }: { p: Post; size?: number }) {
  return isImg(p.asset_url)
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={p.asset_url!} alt="" style={{ width: size, height: size }} className="rounded-[14px] object-cover bg-lila-t shrink-0" />
    : <div style={{ width: size, height: size }} className="rounded-[14px] bg-azul-t flex items-center justify-center shrink-0"><Lia size={size * 0.5} mood={p.asset_url ? "right" : "sleep"} color={p.asset_url ? undefined : "#A98BFF"} /></div>;
}

/** Bandeja para armar un envío a aprobación: elegir piezas, escribir mensaje, ver lo que recibe el cliente */
export function SendTray({ action, clientId, clientName, hasAccount, posts, preselected, briefTitle, roundsIncluded = 2 }: {
  action: (f: FormData) => void; clientId: string; clientName: string; hasAccount: boolean;
  posts: TrayPost[]; preselected: string[]; briefTitle?: string | null; roundsIncluded?: number;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set(preselected));
  const [msg, setMsg] = useState("");
  const fixes = posts.filter((p) => p.status === "cambios");
  const fresh = posts.filter((p) => p.status !== "cambios");
  const chosen = useMemo(() => posts.filter((p) => sel.has(p.id)), [posts, sel]);
  const n = chosen.length;
  const warnings = chosen.filter((p) => !p.asset_url || !p.scheduled_at || p.openPins > 0).length;
  const first = clientName.split(" ")[0];

  const toggle = (id: string) => setSel((s) => { const x = new Set(s); if (x.has(id)) x.delete(id); else x.add(id); return x; });
  const setAll = (list: TrayPost[], on: boolean) => setSel((s) => { const x = new Set(s); list.forEach((p) => (on ? x.add(p.id) : x.delete(p.id))); return x; });

  const group = (title: string, hint: string, list: TrayPost[]) => list.length > 0 && (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2 px-1">
        <div>
          <div className="font-semibold text-[15px]">{title} <span className="text-muted font-medium">· {list.length}</span></div>
          <div className="text-[12px] text-muted">{hint}</div>
        </div>
        <button type="button" className="text-[13px] font-semibold text-brand-dark hover:underline shrink-0"
          onClick={() => setAll(list, !list.every((p) => sel.has(p.id)))}>
          {list.every((p) => sel.has(p.id)) ? "Quitar todas" : "Elegir todas"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((p) => {
          const on = sel.has(p.id);
          const warn = [!p.asset_url && "sin arte", !p.scheduled_at && "sin fecha"].filter(Boolean).join(" · ");
          return (
            <label key={p.id} className={cn("flex gap-3 rounded-[18px] p-3 cursor-pointer transition-all",
              on ? "bg-white ring-2 ring-brand shadow-[0_6px_18px_rgba(61,91,245,.12)]" : "bg-surface hover:bg-surface-2")}>
              <input type="checkbox" name="post_ids" value={p.id} checked={on} onChange={() => toggle(p.id)} className="sr-only" />
              <span className={cn("mt-1 size-5 rounded-[7px] grid place-items-center shrink-0 transition-colors", on ? "bg-brand text-white" : "bg-white ring-1 ring-line")}>
                {on && <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
              </span>
              <Thumb p={p} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[15px] truncate">{p.title}</span>
                  {p.status === "cambios" && <span className="badge bg-rosa-t text-ink shrink-0">Ronda {(p.round ?? 1) + 1}</span>}
                  {p.status === "cambios" && (p.round ?? 1) > roundsIncluded && <span className="badge bg-amarillo-t text-ink shrink-0" title={`Tu tarifa incluye ${roundsIncluded} rondas de cambios`}>Ronda extra</span>}
                </span>
                <span className="block text-[12px] text-muted truncate">{NETWORKS[p.network] ?? p.network} · {FORMATS[p.format] ?? p.format} · {p.scheduled_at ? fmtDateTime(p.scheduled_at) : "Sin fecha"}</span>
                {p.status === "cambios" && p.lastChange && (
                  <span className="mt-1.5 block text-[12px] leading-snug bg-rosa-t/60 rounded-[10px] px-2.5 py-1.5"><b>Pidió:</b> {p.lastChange}</span>
                )}
                {(warn || p.openPins > 0) && (
                  <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    {p.openPins > 0 && <span className="rounded-full bg-amarillo-t px-2 py-0.5">📍 {p.openPins} {p.openPins === 1 ? "marca" : "marcas"} sin resolver</span>}
                    {warn && <span className="rounded-full bg-amarillo-t px-2 py-0.5">⚠ {warn}</span>}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <form action={action} className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="space-y-6 min-w-0">
        {briefTitle && <p className="rounded-[18px] bg-azul-t px-4 py-3 text-[14px]">Elegimos las piezas del pedido <b>{briefTitle}</b>. Puedes sumar otras.</p>}
        {group("Correcciones", "Piezas en las que pidió cambios. Se reenvían como nueva ronda.", fixes)}
        {group("Nuevas piezas", "Borradores listos para que los vea por primera vez.", fresh)}

        <div className="card p-5 space-y-3">
          <label className="block">
            <span className="label">Mensaje para {first} <span className="text-muted font-normal">(opcional)</span></span>
            <textarea name="message" rows={3} maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} className="input"
              placeholder={fixes.length ? "Ej. Ya ajusté los colores y el logo como pediste. ¡Quedo atenta!" : "Ej. Te comparto la parrilla de diciembre. Si puedes, apruébala antes del viernes 🙌"} />
          </label>
          {fixes.length > 0 && (
            <label className="flex items-start gap-2.5 text-[14px] cursor-pointer">
              <input type="checkbox" name="resolve" defaultChecked className="mt-0.5 size-4 accent-[#3d5bf5]" />
              <span>Marcar como resueltas las marcas 📍 de las correcciones<span className="block text-[12px] text-muted">Tu cliente las verá como “corregido” para comprobarlo.</span></span>
            </label>
          )}
        </div>
      </div>

      {/* Vista previa */}
      <aside className="lg:sticky lg:top-6 space-y-4">
        <div className="rounded-[28px] bg-gradient-to-b from-azul-t to-lila-t p-4">
          <div className="text-[12px] font-semibold text-muted mb-2 px-1">Así le llega a {first}</div>
          <div className="rounded-[20px] bg-white/90 backdrop-blur p-3.5 shadow-[0_8px_24px_rgba(34,26,58,.12)] anim-page" key={n}>
            <div className="flex items-center gap-2 text-[11px] text-muted"><Logo size={11} /><span className="ml-auto">ahora</span></div>
            <div className="mt-1 font-semibold text-[14px]">{n === 0 ? "Elige piezas para enviar" : n === 1 ? "Tienes 1 pieza para aprobar" : `Tienes ${n} piezas para aprobar`}</div>
            <div className="text-[13px] text-muted line-clamp-2">{msg.trim() || chosen.map((p) => p.title).join(", ") || "—"}</div>
          </div>
          {n > 0 && (
            <div className="mt-3 rounded-[20px] bg-white p-3">
              <div className="text-[12px] text-muted mb-2">Al abrirla revisa una por una:</div>
              <div className="flex -space-x-2">
                {chosen.slice(0, 6).map((p) => <span key={p.id} className="ring-2 ring-white rounded-[14px]"><Thumb p={p} size={40} /></span>)}
                {n > 6 && <span className="size-10 rounded-[14px] bg-surface ring-2 ring-white grid place-items-center text-[12px] font-semibold">+{n - 6}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold whitespace-nowrap">
                <span className="rounded-full bg-verde-t px-2 py-1">✓ Aprobar</span>
                <span className="rounded-full bg-rosa-t px-2 py-1">📍 Pedir cambios</span>
                <span className="rounded-full bg-surface px-2 py-1">Aprobar todas</span>
              </div>
            </div>
          )}
        </div>

        {!hasAccount && (
          <p className="rounded-[18px] bg-amarillo-t px-4 py-3 text-[13px]">{first} aún no tiene cuenta en Freelia. Al enviar te damos el enlace para mandárselo por WhatsApp.</p>
        )}
        {n > 0 && warnings > 0 && <p className="text-[12px] text-muted px-1">⚠ {warnings} {warnings === 1 ? "pieza tiene" : "piezas tienen"} avisos. Puedes enviarlas igual.</p>}
        <SubmitButton className={cn("btn btn-lg w-full", n ? "btn-primary" : "bg-surface text-muted pointer-events-none")} pendingText="Enviando…">
          {n ? `Enviar ${n} ${n === 1 ? "pieza" : "piezas"} a ${first}` : "Elige al menos una pieza"}
        </SubmitButton>
      </aside>
    </form>
  );
}
