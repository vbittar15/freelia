"use client";

import { useMemo, useState } from "react";
import { Lia, Logo } from "./brand";
import { SubmitButton } from "./client-ui";
import { RUBROS, UNITS, rubroMap, suggestedServices, usesSocial } from "@/lib/rubros";
import { cn, money } from "@/lib/utils";

/** Bienvenida en 3 pasos: rubros → servicios y precios sugeridos → datos del negocio */
export function Onboarding({ action, name, initial, business, city, error }: {
  action: (f: FormData) => void; name: string; initial: string[]; business: string; city: string; error?: string;
}) {
  const [step, setStep] = useState(initial.length ? 1 : 0);
  const [rubros, setRubros] = useState<string[]>(initial);
  const sug = useMemo(() => suggestedServices(rubros), [rubros]);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Record<string, number>>({});
  const toggleR = (k: string) => setRubros((s) => (s.includes(k) ? s.filter((x) => x !== k) : s.length >= 8 ? s : [...s, k]));
  const chosen = sug.filter((x) => !off.has(x.name));

  const bubble = [
    { mood: "happy" as const, text: `¡Hola${name ? `, ${name}` : ""}! Soy Lia. Cuéntame a qué te dedicas y adapto Freelia a tu trabajo.` },
    { mood: "idea" as const, text: chosen.length ? "Te sugiero estos servicios con precios de referencia en Colombia. Ajusta tus tarifas o quita los que no ofreces." : "Puedes agregar tus servicios después en Ajustes." },
    { mood: "smile" as const, text: "Último paso: ¿cómo se llama tu marca? Así aparece en tus cotizaciones y cuentas de cobro." },
  ][step];

  return (
    <form action={action} className="on-white min-h-[100dvh] flex flex-col">
      {rubros.map((k) => <input key={k} type="hidden" name="specialties" value={k} />)}
      {chosen.map((x) => (
        <span key={x.name}>
          <input type="hidden" name="svc" value={x.name} />
          <input type="hidden" name={`price:${x.name}`} value={prices[x.name] ?? x.price} />
        </span>
      ))}

      <header className="flex items-center justify-between px-5 sm:px-8 h-16">
        <Logo size={24} />
        <div className="flex gap-1.5" aria-label={`Paso ${step + 1} de 3`}>
          {[0, 1, 2].map((k) => <span key={k} className={cn("h-1.5 rounded-full transition-all", k === step ? "w-7 bg-brand" : k < step ? "w-3 bg-brand/40" : "w-3 bg-surface-2")} />)}
        </div>
      </header>

      <div className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-8 pb-36">
        <div key={step} className="flex gap-3 items-start mt-4 mb-6 anim-page">
          <div className="shrink-0 anim-float"><Lia size={56} mood={bubble.mood} /></div>
          <div className="rounded-[22px] rounded-tl-[6px] bg-azul-t px-4 py-3 text-[15px] leading-relaxed">{bubble.text}</div>
        </div>
        {error && <p className="mb-4 rounded-[16px] bg-rosa-t px-4 py-3 text-[14px]">{error}</p>}

        {step === 0 && (
          <div className="anim-page">
            <h1 className="h1 text-[28px]">¿A qué te dedicas?</h1>
            <p className="text-muted mt-1 mb-5">Puedes elegir varios. Así ajusto tus servicios, formatos y el recorrido.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger">
              {RUBROS.map((r) => {
                const on = rubros.includes(r.key);
                return (
                  <button key={r.key} type="button" onClick={() => toggleR(r.key)} aria-pressed={on}
                    className={cn("flex flex-col items-start gap-1.5 rounded-[20px] p-3.5 text-left transition-all active:scale-[.98]",
                      on ? "bg-brand text-white shadow-[0_8px_22px_rgba(61,91,245,.28)]" : "bg-surface hover:bg-surface-2")}>
                    <span className="text-[22px]" aria-hidden>{r.emoji}</span>
                    <span className="text-[14px] font-semibold leading-tight">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="anim-page">
            <h1 className="h1 text-[28px]">Tus servicios y precios</h1>
            <p className="text-muted mt-1 mb-5">Los usarás al cotizar. Puedes cambiarlos cuando quieras en Ajustes.</p>
            {sug.length === 0 && <p className="card p-5 text-muted">No tengo sugerencias para este rubro todavía. Agrega tus servicios en Ajustes.</p>}
            {rubros.map((k) => {
              const list = sug.filter((x) => x.category === k);
              if (!list.length) return null;
              return (
                <div key={k} className="mb-5">
                  <div className="font-semibold text-[14px] mb-2 px-1">{rubroMap[k].emoji} {rubroMap[k].label}</div>
                  <div className="flex flex-col gap-2">
                    {list.map((x) => {
                      const on = !off.has(x.name);
                      return (
                        <div key={x.name} className={cn("flex items-center gap-3 rounded-[18px] p-3 transition-colors", on ? "bg-surface" : "bg-surface/50 opacity-60")}>
                          <button type="button" aria-pressed={on} aria-label={on ? `Quitar ${x.name}` : `Incluir ${x.name}`}
                            onClick={() => setOff((s) => { const n = new Set(s); if (n.has(x.name)) n.delete(x.name); else n.add(x.name); return n; })}
                            className={cn("size-6 rounded-[8px] grid place-items-center shrink-0", on ? "bg-brand text-white" : "bg-white ring-1 ring-line")}>
                            {on && <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-semibold leading-tight">{x.name}</div>
                            <div className="text-[12px] text-muted">{UNITS[x.unit]}</div>
                          </div>
                          <label className="relative w-[128px] shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[13px]">$</span>
                            <input type="number" min={0} step={1000} disabled={!on} aria-label={`Precio de ${x.name}`}
                              className="input h-10 pl-6 pr-2 text-[14px] !bg-white" value={prices[x.name] ?? x.price}
                              onChange={(e) => setPrices((p) => ({ ...p, [x.name]: Number(e.target.value) }))} />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="anim-page space-y-4">
            <h1 className="h1 text-[28px]">Tu marca</h1>
            <label className="block"><span className="label">Nombre comercial o marca personal</span>
              <input name="business_name" defaultValue={business} className="input" placeholder="Ej. Estudio Punto" /></label>
            <label className="block"><span className="label">Ciudad</span>
              <input name="city" defaultValue={city} className="input" placeholder="Barranquilla" /></label>
            <div className="rounded-[20px] bg-verde-t p-4 text-[14px]">
              <b>Listo para empezar:</b> {rubros.map((k) => rubroMap[k]?.short).join(", ")} · {chosen.length} {chosen.length === 1 ? "servicio" : "servicios"}
              {chosen.length > 0 && <> desde {money(Math.min(...chosen.map((x) => prices[x.name] ?? x.price)))}</>}
              {!usesSocial(rubros) && <> · tu sección de trabajo se llamará <b>Entregas</b></>}
            </div>
          </div>
        )}
      </div>

      <footer className="fixed inset-x-0 bottom-0 bg-white/90 backdrop-blur border-t border-line">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-4 flex items-center gap-3">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">Atrás</button>}
          <div className="ml-auto" />
          {step < 2 ? (
            <button type="button" disabled={step === 0 && !rubros.length} onClick={() => setStep(step + 1)}
              className="btn btn-primary btn-lg disabled:opacity-50 disabled:pointer-events-none">
              {step === 0 ? (rubros.length ? "Continuar" : "Elige al menos uno") : "Continuar"}
            </button>
          ) : (
            <SubmitButton className="btn btn-primary btn-lg" pendingText="Preparando tu espacio…">Empezar el recorrido →</SubmitButton>
          )}
        </div>
      </footer>
    </form>
  );
}
