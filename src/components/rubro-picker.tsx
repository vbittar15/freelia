"use client";

import { useState } from "react";
import { RUBROS } from "@/lib/rubros";
import { cn } from "@/lib/utils";

/** Selector múltiple de rubros (envía inputs "specialties") */
export function RubroPicker({ initial = [], name = "specialties", compact }: { initial?: string[]; name?: string; compact?: boolean }) {
  const [sel, setSel] = useState<string[]>(initial);
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : s.length >= 8 ? s : [...s, k]));
  return (
    <div>
      {sel.map((k) => <input key={k} type="hidden" name={name} value={k} />)}
      <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
        {RUBROS.map((r) => {
          const on = sel.includes(r.key);
          return (
            <button key={r.key} type="button" onClick={() => toggle(r.key)} aria-pressed={on}
              className={cn("flex items-center gap-2 rounded-[16px] px-3 py-2.5 text-left text-[13px] leading-tight font-medium transition-all active:scale-[.98]",
                on ? "bg-brand text-white shadow-[0_6px_16px_rgba(61,91,245,.25)]" : compact ? "bg-white text-ink hover:ring-2 hover:ring-brand/20" : "bg-surface text-ink hover:bg-surface-2")}>
              <span className="text-[17px] shrink-0" aria-hidden>{r.emoji}</span>
              <span className="min-w-0">{r.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted px-1">{sel.length ? `${sel.length} ${sel.length === 1 ? "elegido" : "elegidos"} · puedes cambiarlos después en Ajustes` : "Elige uno o varios."}</p>
    </div>
  );
}
