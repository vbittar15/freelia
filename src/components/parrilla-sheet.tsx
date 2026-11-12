"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addRows, deleteRow, saveCell } from "@/app/panel/parrilla/sheet-actions";
import { DAYS, FORMATS, SOCIAL, cn } from "@/lib/utils";
import { StatusPill } from "./brand";
import { Icon } from "./icons";

export type SheetRow = {
  id: string; date: string; time: string; topic: string; idea: string; art_text: string; copy: string;
  format: string; networks: string[]; status: string; thumb: string | null; comments: number; notes: string;
};

const SOCIAL_FORMATS = ["post", "carrusel", "reel", "historia", "video", "short", "live", "articulo"];
const dayName = (d: string) => (d ? DAYS[new Date(d + "T12:00:00").getDay()] : "");

function NetPicker({ value, onChange, disabled }: { value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className="w-full min-h-9 rounded-[10px] px-2 py-1 flex flex-wrap items-center gap-1 text-left hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand/30 outline-none">
        {value.length ? value.map((k) => {
          const n = SOCIAL.find((x) => x.key === k);
          return <span key={k} className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: n?.color ?? "#8c849f" }} title={n?.label}>{n?.abbr ?? k}</span>;
        }) : <span className="text-faint text-[13px]">Elegir…</span>}
        <Icon name="chevronRight" className="size-3.5 ml-auto rotate-90 text-faint" />
      </button>
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-56 rounded-[16px] bg-white p-2 shadow-[0_12px_32px_rgba(34,26,58,.18)] ring-1 ring-line anim-pop">
          {SOCIAL.map((n) => {
            const on = value.includes(n.key);
            return (
              <label key={n.key} className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 hover:bg-surface cursor-pointer text-[13px]">
                <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter((x) => x !== n.key) : [...value, n.key])} className="size-4 accent-[#3d5bf5]" />
                <span className="size-5 rounded-full grid place-items-center text-[9px] font-bold text-white" style={{ background: n.color }}>{n.abbr}</span>{n.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cell({ value, onSave, multiline, placeholder, disabled, className }: {
  value: string; onSave: (v: string) => void; multiline?: boolean; placeholder?: string; disabled?: boolean; className?: string;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const common = {
    value: v, disabled, placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(e.target.value),
    onBlur: () => { if (v !== value) onSave(v); },
    className: cn("w-full rounded-[10px] bg-transparent px-2 py-1.5 text-[13px] leading-snug outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand/30 placeholder:text-faint disabled:opacity-70", className),
  };
  return multiline
    ? <textarea {...common} rows={3} className={cn(common.className, "resize-y min-h-[62px]")} />
    : <input {...common} />;
}

export function ParrillaSheet({ clientId, month, rows: initial, defaultNetworks }: {
  clientId: string; month: string; rows: SheetRow[]; defaultNetworks: string[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  useEffect(() => setRows(initial), [initial]);
  const [state, setState] = useState<Record<string, "saving" | "ok" | "error">>({});
  const [, start] = useTransition();
  const [gen, setGen] = useState(initial.length === 0);
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [time, setTime] = useState("09:00");
  const [nets, setNets] = useState<string[]>(defaultNetworks.length ? defaultNetworks : ["instagram"]);
  const [fmt, setFmt] = useState("post");
  const [skip, setSkip] = useState(true);
  const [msg, setMsg] = useState("");

  const [y, m] = month.split("-").map(Number);
  const monthDates = useMemo(() => {
    const out: string[] = [];
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) out.push(`${month}-${String(d).padStart(2, "0")}`);
    return out;
  }, [y, m, month]);
  const toCreate = monthDates.filter((d) => days.includes(new Date(d + "T12:00:00").getDay()) && !(skip && rows.some((r) => r.date === d)));

  function save(r: SheetRow, field: Parameters<typeof saveCell>[1], value: string | string[], patch: Partial<SheetRow>) {
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    setState((s) => ({ ...s, [r.id]: "saving" }));
    const next = { ...r, ...patch };
    start(async () => {
      const res = await saveCell(r.id, field, value, next.date, next.time);
      setState((s) => ({ ...s, [r.id]: res.error ? "error" : "ok" }));
      if (res.error) setMsg(res.error);
    });
  }
  function generate(dates: string[]) {
    start(async () => {
      const res = await addRows(clientId, dates, time, nets, fmt);
      if (res.error) setMsg(res.error); else { setGen(false); setMsg(""); router.refresh(); }
    });
  }
  function remove(r: SheetRow) {
    if (!confirm(`¿Eliminar la publicación del ${r.date || "día sin fecha"}?`)) return;
    setRows((all) => all.filter((x) => x.id !== r.id));
    start(async () => { const res = await deleteRow(r.id, clientId); if (res.error) { setMsg(res.error); router.refresh(); } });
  }
  function exportCSV() {
    const head = ["Fecha", "Día", "Hora", "Tema", "Idea", "Texto en la pieza", "Copy", "Formato", "Redes", "Estado", "Notas"];
    const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = rows.map((r) => [r.date, dayName(r.date), r.time, r.topic, r.idea, r.art_text, r.copy, FORMATS[r.format] ?? r.format,
      r.networks.map((k) => SOCIAL.find((n) => n.key === k)?.label ?? k).join(", "), r.status, r.notes].map((v) => esc(String(v ?? ""))).join(";"));
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `parrilla-${month}.csv`; a.click();
  }
  const pending = rows.filter((r) => r.status === "borrador" || r.status === "cambios");
  const locked = (r: SheetRow) => r.status === "aprobado" || r.status === "publicado" || r.status === "entregado";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setGen((g) => !g)} className={cn("btn btn-sm", gen ? "bg-ink text-white" : "btn-primary")}>
          <Icon name="calendar" className="size-4" /> Generar fechas
        </button>
        <button type="button" onClick={() => generate([monthDates[0]])} className="btn btn-soft btn-sm"><Icon name="plus" className="size-4" /> Fila</button>
        <button type="button" onClick={exportCSV} disabled={!rows.length} className="btn btn-ghost btn-sm disabled:opacity-40"><Icon name="download" className="size-4" /> Excel</button>
        {pending.length > 0 && (
          <Link href={`/panel/enviar?cliente=${clientId}&ids=${pending.map((r) => r.id).join(",")}`} className="btn btn-sm btn-approve ml-auto">
            <Icon name="send" className="size-4" /> Enviar al cliente ({pending.length})
          </Link>
        )}
      </div>

      {gen && (
        <div className="rounded-[22px] bg-azul-t p-4 sm:p-5 anim-pop">
          <div className="font-semibold">¿Qué días publicas?</div>
          <p className="text-[13px] text-muted mb-3">Creo una fila por cada día del mes que elijas. Luego llenas tema, idea y copy.</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button key={d} type="button" onClick={() => setDays((x) => (x.includes(d) ? x.filter((k) => k !== d) : [...x, d]))}
                className={cn("btn btn-sm capitalize !px-3.5", days.includes(d) ? "bg-brand text-white" : "bg-white text-ink")}>{DAYS[d].slice(0, 3)}</button>
            ))}
          </div>
          <div className="grid sm:grid-cols-[120px_1fr_160px] gap-3 items-end">
            <label className="block"><span className="label">Hora</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input !bg-white" /></label>
            <div><span className="label">Redes</span><div className="rounded-[14px] bg-white px-1 py-0.5"><NetPicker value={nets} onChange={setNets} /></div></div>
            <label className="block"><span className="label">Formato</span>
              <select value={fmt} onChange={(e) => setFmt(e.target.value)} className="input !bg-white">{SOCIAL_FORMATS.map((k) => <option key={k} value={k}>{FORMATS[k]}</option>)}</select></label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} className="size-4 accent-[#3d5bf5]" /> Saltar los días que ya tienen publicación</label>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" disabled={!toCreate.length} onClick={() => generate(toCreate)} className="btn btn-primary disabled:opacity-50">Crear {toCreate.length} {toCreate.length === 1 ? "publicación" : "publicaciones"}</button>
            <button type="button" onClick={() => setGen(false)} className="btn btn-ghost">Cerrar</button>
          </div>
        </div>
      )}
      {msg && <p className="rounded-[14px] bg-rosa-t px-4 py-2.5 text-[13px]">{msg}</p>}

      {rows.length > 0 && (
        <div className="rounded-[20px] ring-1 ring-line bg-surface overflow-x-auto">
          <table className="w-max min-w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted">
                {["Fecha", "Hora", "Tema", "Idea", "Texto en la pieza", "Copy", "Formato", "Redes", "Arte", "Estado", "Notas", ""].map((h, i) => (
                  <th key={i} className={cn("sticky top-0 bg-surface-2 px-2 py-2.5 font-semibold border-b border-line", i === 0 && "left-0 z-20 sm:z-10")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const lk = locked(r);
                return (
                  <tr key={r.id} className="align-top group">
                    <td className="sticky left-0 z-10 bg-surface group-hover:bg-surface-2 px-1.5 py-1.5 border-b border-line w-[132px]">
                      <input type="date" value={r.date} disabled={lk} onChange={(e) => save(r, "date", e.target.value, { date: e.target.value })}
                        className="w-[124px] rounded-[10px] bg-transparent px-1.5 py-1 text-[13px] font-semibold outline-none hover:bg-white focus:bg-white" />
                      <div className="px-1.5 text-[11px] text-muted capitalize flex items-center gap-1.5">
                        {dayName(r.date)}
                        {state[r.id] === "saving" && <span className="size-1.5 rounded-full bg-amarillo anim-ping" title="Guardando" />}
                        {state[r.id] === "ok" && <span className="size-1.5 rounded-full bg-verde" title="Guardado" />}
                        {state[r.id] === "error" && <span className="size-1.5 rounded-full bg-rosa" title="Error" />}
                      </div>
                    </td>
                    <td className="px-1 py-1.5 border-b border-line w-[118px]">
                      <input type="time" value={r.time} disabled={lk} onChange={(e) => save(r, "time", e.target.value, { time: e.target.value })}
                        className="w-[112px] rounded-[10px] bg-transparent px-1.5 py-1.5 text-[13px] outline-none hover:bg-white focus:bg-white" />
                    </td>
                    <td className="px-1 py-1.5 border-b border-line w-[170px]"><Cell value={r.topic} disabled={lk} placeholder="Tema" onSave={(v) => save(r, "topic", v, { topic: v })} className="font-semibold" /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[220px]"><Cell multiline value={r.idea} disabled={lk} placeholder="Idea o concepto" onSave={(v) => save(r, "idea", v, { idea: v })} /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[220px]"><Cell multiline value={r.art_text} disabled={lk} placeholder="Lo que va escrito en la pieza" onSave={(v) => save(r, "art_text", v, { art_text: v })} /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[280px]"><Cell multiline value={r.copy} disabled={lk} placeholder="Copy de la publicación" onSave={(v) => save(r, "copy", v, { copy: v })} /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[140px]">
                      <select value={r.format} disabled={lk} onChange={(e) => save(r, "format", e.target.value, { format: e.target.value })}
                        className="w-full rounded-[10px] bg-transparent px-1.5 py-1.5 text-[13px] outline-none hover:bg-white focus:bg-white">
                        {[...new Set([...SOCIAL_FORMATS, r.format])].map((k) => <option key={k} value={k}>{FORMATS[k] ?? k}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1.5 border-b border-line w-[150px]"><NetPicker value={r.networks} disabled={lk} onChange={(v) => save(r, "networks", v, { networks: v })} /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[76px]">
                      <Link href={`/panel/parrilla/${r.id}`} className="block size-14 rounded-[12px] overflow-hidden bg-white ring-1 ring-line hover:ring-brand grid place-items-center" title="Subir o ver el arte">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.thumb ? <img src={r.thumb} alt="" className="size-full object-cover" /> : <Icon name="plus" className="size-5 text-faint" />}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 border-b border-line w-[120px]"><StatusPill status={r.status} /></td>
                    <td className="px-1 py-1.5 border-b border-line w-[200px]">
                      <Cell multiline value={r.notes} placeholder="Anotaciones" onSave={(v) => save(r, "notes", v, { notes: v })} />
                      {r.comments > 0 && <Link href={`/panel/parrilla/${r.id}`} className="mt-1 ml-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-dark"><Icon name="chat" className="size-3.5" /> {r.comments} del cliente</Link>}
                    </td>
                    <td className="px-1 py-1.5 border-b border-line w-[44px]">
                      {r.status === "borrador" && <button type="button" onClick={() => remove(r)} className="btn btn-ghost btn-sm !px-2" aria-label="Eliminar fila"><Icon name="trash" className="size-4" /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && <p className="text-[12px] text-muted px-1">Se guarda solo al salir de cada celda. Las publicaciones aprobadas quedan bloqueadas; las notas siempre se pueden editar.</p>}
    </div>
  );
}
