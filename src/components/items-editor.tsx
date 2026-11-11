"use client";

import { useState } from "react";
import type { LineItem } from "@/lib/types";
import { money } from "@/lib/utils";
import type { CatalogItem } from "@/lib/catalog";
import { Icon } from "./icons";

/** Editor de ítems para cotizaciones y cuentas de cobro. Envía un input oculto "items" en JSON. */
export function ItemsEditor({ initial, catalog = [] }: { initial?: LineItem[]; catalog?: CatalogItem[] }) {
  const [items, setItems] = useState<LineItem[]>(
    initial && initial.length ? initial : [{ description: "", quantity: 1, unit_price: 0 }]
  );
  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addFromCatalog = (key: string) => {
    const c = catalog.find((x) => x.key === key);
    if (!c) return;
    const line = { description: c.description, quantity: 1, unit_price: c.unit_price };
    setItems((arr) => (arr.length === 1 && !arr[0].description.trim() && !Number(arr[0].unit_price) ? [line] : [...arr, line]));
  };
  const sum = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);

  return (
    <div>
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="hidden lg:grid grid-cols-[1fr_80px_150px_120px_32px] gap-2 px-1 mb-2 text-[11px] uppercase tracking-wide text-muted">
        <span>Descripción</span><span>Cant.</span><span>Valor unitario</span><span className="text-right">Subtotal</span><span />
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] lg:grid-cols-[1fr_80px_150px_120px_32px] gap-2 items-center rounded-[18px] lg:rounded-none bg-surface-2 lg:bg-transparent p-2.5 lg:p-0 anim-pop">
            <input className="input col-span-2 lg:col-span-1" placeholder="Ej. Diseño de 12 piezas para Instagram"
              value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
            <label className="block"><span className="lg:hidden block text-[11px] text-muted font-medium px-1 mb-1">Cant.</span>
              <input className="input" type="number" min="0" step="0.5" value={it.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })} aria-label="Cantidad" /></label>
            <label className="block"><span className="lg:hidden block text-[11px] text-muted font-medium px-1 mb-1">Valor unitario</span>
              <input className="input" type="number" min="0" step="1000" value={it.unit_price}
                onChange={(e) => update(i, { unit_price: Number(e.target.value) })} aria-label="Valor unitario" /></label>
            <span className="font-semibold text-[14px] lg:text-right pl-1 lg:pl-0"><span className="lg:hidden text-muted font-medium text-[12px]">Subtotal </span>{money(Number(it.quantity) * Number(it.unit_price))}</span>
            <button type="button" className="btn btn-ghost btn-sm px-2 justify-self-end" aria-label="Quitar"
              onClick={() => setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr))}><Icon name="x" className="size-4" strokeWidth={2.2} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {catalog.length > 0 && (
            <select className="input h-9 w-full sm:w-auto sm:max-w-[320px] text-[13px] font-semibold !bg-brand-soft text-brand-dark pr-9" value=""
              onChange={(e) => { addFromCatalog(e.target.value); e.currentTarget.value = ""; }} aria-label="Agregar desde mi catálogo">
              <option value="" disabled>+ Desde mis servicios</option>
              {(["Paquetes", "Servicios"] as const).map((g) => catalog.some((c) => c.group === g) && (
                <optgroup key={g} label={g}>
                  {catalog.filter((c) => c.group === g).map((c) => <option key={c.key} value={c.key}>{c.label} — {money(c.unit_price)}</option>)}
                </optgroup>
              ))}
            </select>
          )}
          <button type="button" className="btn btn-soft btn-sm"
            onClick={() => setItems((arr) => [...arr, { description: "", quantity: 1, unit_price: 0 }])}>
            + Ítem libre
          </button>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted">Total</div>
          <div className="text-[20px] font-semibold tracking-tight">{money(sum)}</div>
        </div>
      </div>
    </div>
  );
}
