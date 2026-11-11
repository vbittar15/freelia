"use client";

import { useState } from "react";
import type { Package, PackageItem, Service } from "@/lib/types";
import { money } from "@/lib/utils";
import { SubmitButton } from "./client-ui";

/** Formulario de paquete: elige servicios y cantidades, compara con el precio por separado */
export function PackageForm({ action, services, pkg, onCancelHref }: {
  action: (f: FormData) => void; services: Service[]; pkg?: Package; onCancelHref?: string;
}) {
  const [items, setItems] = useState<PackageItem[]>(pkg?.items ?? []);
  const [price, setPrice] = useState<number>(pkg?.price ?? 0);
  const qtyOf = (id: string) => items.find((i) => i.service_id === id)?.qty ?? 0;
  const setQty = (sv: Service, qty: number) => setItems((arr) => {
    const rest = arr.filter((i) => i.service_id !== sv.id);
    return qty > 0 ? [...rest, { service_id: sv.id, name: sv.name, qty }] : rest;
  });
  const separate = items.reduce((t, i) => t + (services.find((s) => s.id === i.service_id)?.price ?? 0) * i.qty, 0);
  const saving = separate > 0 && price > 0 && price < separate ? Math.round((1 - price / separate) * 100) : 0;

  return (
    <form action={action} className="grid gap-4">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <label className="block"><span className="label">Nombre del paquete *</span>
          <input name="name" required defaultValue={pkg?.name} className="input" placeholder="Ej. Plan Redes Básico" /></label>
        <label className="block"><span className="label">Cobro</span>
          <select name="period" defaultValue={pkg?.period ?? "mensual"} className="input">
            <option value="mensual">Mensual</option><option value="unico">Pago único</option>
          </select></label>
      </div>
      <label className="block"><span className="label">Descripción</span>
        <textarea name="description" rows={2} defaultValue={pkg?.description ?? ""} className="input" placeholder="Qué incluye, para quién es…" /></label>

      <div>
        <span className="label">Servicios incluidos</span>
        {services.length === 0 ? <p className="text-[14px] text-muted px-1">Primero agrega servicios en la pestaña Servicios.</p> : (
          <div className="flex flex-col gap-1.5">
            {services.map((sv) => {
              const q = qtyOf(sv.id);
              return (
                <div key={sv.id} className={`flex items-center gap-3 rounded-[16px] px-3 py-2 ${q ? "bg-azul-t" : "bg-surface"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium truncate">{sv.name}</div>
                    <div className="text-[12px] text-muted">{money(sv.price)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setQty(sv, Math.max(0, q - 1))} className="size-8 rounded-full bg-white text-[16px] font-semibold disabled:opacity-40" disabled={!q} aria-label={`Menos ${sv.name}`}>−</button>
                    <span className="w-7 text-center font-semibold tabular-nums">{q}</span>
                    <button type="button" onClick={() => setQty(sv, q + 1)} className="size-8 rounded-full bg-white text-[16px] font-semibold" aria-label={`Más ${sv.name}`}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 items-end">
        <label className="block"><span className="label">Precio del paquete *</span>
          <input name="price" type="number" min={0} step={1000} required value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className="input" placeholder={separate ? String(separate) : "0"} /></label>
        <div className="rounded-[16px] bg-surface px-4 py-2.5 text-[13px]">
          Por separado: <b>{money(separate)}</b>
          {saving > 0 && <span className="ml-2 badge bg-verde-t text-ink">Ahorra {saving}%</span>}
          {separate > 0 && price === 0 && <button type="button" onClick={() => setPrice(Math.round(separate * 0.9 / 1000) * 1000)} className="ml-2 font-semibold text-brand-dark hover:underline">Sugerir −10%</button>}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancelHref && <a href={onCancelHref} className="btn btn-ghost">Cancelar</a>}
        <SubmitButton>{pkg ? "Guardar paquete" : "Crear paquete"}</SubmitButton>
      </div>
    </form>
  );
}
