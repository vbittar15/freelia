"use client";

import { useState } from "react";
import type { ClientService, Package, Service } from "@/lib/types";
import { UNITS } from "@/lib/rubros";
import { money } from "@/lib/utils";
import { Icon } from "./icons";

type Line = Pick<ClientService, "service_id" | "package_id" | "name" | "includes" | "qty" | "price" | "period">;

/** Servicios y paquetes que se le prestan a un cliente (input oculto "services") */
export function ClientServicesEditor({ services, packages, initial = [] }: { services: Service[]; packages: Package[]; initial?: Line[] }) {
  const [lines, setLines] = useState<Line[]>(initial);
  const upd = (i: number, p: Partial<Line>) => setLines((a) => a.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const add = (l: Line) => setLines((a) => [...a, l]);
  function pick(v: string) {
    const [kind, id] = v.split(":");
    if (kind === "s") {
      const s = services.find((x) => x.id === id); if (!s) return;
      add({ service_id: s.id, package_id: null, name: s.name, includes: s.description, qty: 1, price: Number(s.price), period: s.unit === "mes" ? "mensual" : "unico" });
    } else if (kind === "p") {
      const p = packages.find((x) => x.id === id); if (!p) return;
      add({ service_id: null, package_id: p.id, name: p.name, includes: p.items.map((i) => `${i.qty} ${i.name}`).join(", "), qty: 1, price: Number(p.price), period: p.period });
    } else add({ service_id: null, package_id: null, name: "", includes: "", qty: 1, price: 0, period: "mensual" });
  }
  const total = (p: "mensual" | "unico") => lines.filter((l) => l.period === p).reduce((a, l) => a + Number(l.price) * Number(l.qty), 0);

  return (
    <div>
      <input type="hidden" name="services" value={JSON.stringify(lines)} />
      <div className="flex flex-col gap-2">
        {lines.map((l, i) => (
          <div key={i} className="rounded-[18px] bg-white p-3 grid gap-2 anim-pop">
            <div className="flex items-center gap-2">
              {l.package_id && <span className="badge bg-lila-t text-ink shrink-0">Paquete</span>}
              <input className="input h-10 text-[15px] font-semibold" value={l.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="Servicio" aria-label="Servicio" />
              <button type="button" onClick={() => setLines((a) => a.filter((_, k) => k !== i))} className="btn btn-ghost btn-sm !px-2.5 shrink-0" aria-label="Quitar">
                <Icon name="x" className="size-4" strokeWidth={2.2} />
              </button>
            </div>
            <input className="input h-10 text-[14px] !bg-surface" value={l.includes ?? ""} onChange={(e) => upd(i, { includes: e.target.value })} placeholder="Qué incluye (ej. 12 piezas, 4 reels, informe mensual)" aria-label="Qué incluye" />
            <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[70px_1fr_150px] gap-2">
              <label className="block"><span className="text-[11px] text-muted px-1">Cant.</span>
                <input type="number" min={0} step="0.5" className="input h-10 !bg-surface" value={l.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })} /></label>
              <label className="block"><span className="text-[11px] text-muted px-1">Valor</span>
                <input type="number" min={0} step={1000} className="input h-10 !bg-surface" value={l.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} /></label>
              <label className="block col-span-2 sm:col-span-1"><span className="text-[11px] text-muted px-1">Se cobra</span>
                <select className="input h-10 !bg-surface" value={l.period} onChange={(e) => upd(i, { period: e.target.value as Line["period"] })}>
                  <option value="mensual">Mensual</option><option value="unico">Pago único</option>
                </select></label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(services.length > 0 || packages.length > 0) && (
          <select className="input h-10 w-full sm:w-auto sm:max-w-[320px] text-[14px] font-semibold !bg-brand-soft text-brand-dark" value=""
            onChange={(e) => { pick(e.target.value); e.currentTarget.value = ""; }} aria-label="Agregar desde mis servicios">
            <option value="" disabled>+ Desde mis servicios o paquetes</option>
            {packages.length > 0 && <optgroup label="Paquetes">{packages.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name} — {money(p.price)}{p.period === "mensual" ? "/mes" : ""}</option>)}</optgroup>}
            {services.length > 0 && <optgroup label="Servicios">{services.map((s) => <option key={s.id} value={`s:${s.id}`}>{s.name} — {money(s.price)} {UNITS[s.unit] ?? ""}</option>)}</optgroup>}
          </select>
        )}
        <button type="button" onClick={() => pick("libre")} className="btn btn-soft btn-sm"><Icon name="plus" className="size-4" /> Servicio libre</button>
      </div>
      {lines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px] px-1">
          {total("mensual") > 0 && <span>Mensual: <b>{money(total("mensual"))}</b></span>}
          {total("unico") > 0 && <span>Pago único: <b>{money(total("unico"))}</b></span>}
        </div>
      )}
    </div>
  );
}
