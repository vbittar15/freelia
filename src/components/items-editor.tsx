"use client";

import { useState } from "react";
import type { LineItem } from "@/lib/types";
import { money } from "@/lib/utils";

/** Editor de ítems para cotizaciones y cuentas de cobro. Envía un input oculto "items" en JSON. */
export function ItemsEditor({ initial }: { initial?: LineItem[] }) {
  const [items, setItems] = useState<LineItem[]>(
    initial && initial.length ? initial : [{ description: "", quantity: 1, unit_price: 0 }]
  );
  const update = (i: number, patch: Partial<LineItem>) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
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
              onClick={() => setItems((arr) => (arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr))}>✕</button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <button type="button" className="btn btn-soft btn-sm"
          onClick={() => setItems((arr) => [...arr, { description: "", quantity: 1, unit_price: 0 }])}>
          + Agregar ítem
        </button>
        <div className="text-right">
          <div className="text-[11px] text-muted">Total</div>
          <div className="text-[20px] font-semibold tracking-tight">{money(sum)}</div>
        </div>
      </div>
    </div>
  );
}
