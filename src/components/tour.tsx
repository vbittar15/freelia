"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lia, type LiaMood } from "./brand";
import { rubroMap, usesSocial } from "@/lib/rubros";

type Step = { target?: string[]; title: string; text: string; mood: LiaMood; color?: string };

function buildSteps(keys: string[], name: string): Step[] {
  const social = usesSocial(keys);
  const shorts = keys.map((k) => rubroMap[k]?.short).filter(Boolean);
  const list = shorts.length > 1 ? `${shorts.slice(0, -1).join(", ")} y ${shorts.at(-1)}` : shorts[0] ?? "lo que haces";
  return [
    { title: `¡Hola${name ? `, ${name}` : ""}! Soy Lia`, mood: "happy",
      text: `El punto de freelia. Te muestro la app en un minuto, pensada para ${list}.` },
    { target: ["/panel/clientes"], title: "Tus clientes", mood: "right",
      text: "Crea la ficha de cada cliente. Desde ahí lo invitas a su portal con un enlace único por WhatsApp o correo." },
    { target: ["/panel/parrilla"], title: social ? "Tu parrilla de contenido" : "Tus entregas", mood: "idea",
      text: social
        ? "Planea las piezas por fecha y red social. Tu cliente marca sobre el arte lo que quiere cambiar 📍."
        : "Organiza pantallas, sitios, archivos y entregas por fecha. Tu cliente los revisa y marca sobre ellos lo que quiere ajustar." },
    { target: ["/panel/envios", "more"], title: "Revisiones", mood: "smile",
      text: "Cuando tengas varias listas, las envías juntas con un mensaje. Tu cliente las revisa una por una y aquí ves cómo va." },
    { target: ["/panel/briefs", "more"], title: "Solicitudes", mood: "right",
      text: "Tus clientes piden proyectos, piezas, parrillas, campañas o reuniones. Cada solicitud muestra su avance y el material que subes para ella." },
    { target: ["/panel/cotizaciones", "more"], title: "Cotizaciones", mood: "idea",
      text: "Cotiza en segundos con tus servicios y paquetes guardados. Tu cliente la acepta desde su portal." },
    { target: ["/panel/cobros"], title: "Cuentas de cobro", mood: "happy", color: "#2FBF7A",
      text: "Genera cuentas de cobro con tus datos bancarios y lleva el control de lo que te deben." },
    { target: ["/panel/ajustes", "more"], title: "Ajustes", mood: "smile",
      text: `Aquí defines servicios, paquetes y precios. Te dejé sugerencias para ${list}; ajústalas a tu tarifa.` },
    { target: ["notificaciones"], title: "Siempre al tanto", mood: "peek",
      text: "Te aviso cuando aprueben, pidan cambios, te escriban o te paguen. Actívame las notificaciones en tu celular." },
    { title: "¡Todo listo!", mood: "happy",
      text: "Empieza creando tu primer cliente. Puedes repetir este recorrido cuando quieras desde Ajustes." },
  ];
}

function findTarget(keys?: string[]) {
  if (!keys) return null;
  for (const k of keys) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${k}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
    }
  }
  return null;
}

/** Recorrido guiado por Lia. Se abre con ?tour=1 en el panel. */
export function Tour({ specialties, name }: { specialties: string[]; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(1024);
  const key = specialties.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const steps = useMemo(() => buildSteps(specialties, name), [key, name]);
  const step = steps[i];

  useEffect(() => {
    const check = () => {
      const u = new URL(window.location.href);
      if (u.searchParams.get("tour") === "1") { setI(0); setOpen(true); }
    };
    check();
    window.addEventListener("freelia:tour", check);
    return () => window.removeEventListener("freelia:tour", check);
  }, []);

  const measure = useCallback(() => {
    setVw(window.innerWidth);
    const el = findTarget(step?.target);
    const r = el?.getBoundingClientRect() ?? null;
    setRect((prev) => (prev && r && prev.left === r.left && prev.top === r.top && prev.width === r.width && prev.height === r.height) || (!prev && !r) ? prev : r);
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const t = setTimeout(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [open, i, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function close(go?: string) {
    setOpen(false);
    const u = new URL(window.location.href);
    u.searchParams.delete("tour");
    window.history.replaceState(null, "", u.pathname + u.search);
    if (go) router.push(go);
  }

  if (!open || !step) return null;

  const pad = 6;
  const last = i === steps.length - 1;
  const bubbleW = Math.min(340, vw - 32);
  let style: React.CSSProperties;
  if (rect) {
    const below = rect.top < window.innerHeight / 2;
    const left = Math.max(16, Math.min(rect.left + rect.width / 2 - bubbleW / 2, vw - bubbleW - 16));
    // Escritorio: barra lateral → globo a la derecha del ítem
    if (rect.left < 260 && rect.width < 260 && vw >= 1024) style = { left: rect.right + 18, top: Math.max(16, Math.min(rect.top - 20, window.innerHeight - 260)), width: bubbleW };
    else style = below ? { left, top: rect.bottom + 16, width: bubbleW } : { left, bottom: window.innerHeight - rect.top + 16, width: bubbleW };
  } else {
    style = { left: (vw - bubbleW) / 2, top: Math.max(16, window.innerHeight / 2 - 110), width: bubbleW };
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Recorrido por Freelia">
      {rect ? (
        <div className="fixed rounded-[22px] transition-all duration-300 ease-out pointer-events-none ring-2 ring-white/80"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(34,26,58,.58)" }} />
      ) : <div className="fixed inset-0 bg-ink/60 backdrop-blur-[2px]" />}
      <div className="fixed inset-0" onClick={() => setI((x) => Math.min(x + 1, steps.length - 1))} />

      <div key={i} className="fixed anim-pop rounded-[26px] bg-white p-5 shadow-[0_18px_50px_rgba(34,26,58,.28)]" style={style}>
        <div className="flex gap-3.5">
          <div className="shrink-0 anim-float"><Lia size={rect ? 46 : 62} mood={step.mood} color={step.color} /></div>
          <div className="min-w-0">
            <div className="font-bold text-[17px] tracking-tight leading-tight">{step.title}</div>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{step.text}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {steps.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-brand" : "w-1.5 bg-surface-2"}`} />)}
          </div>
          <div className={`flex gap-1.5 ${last ? "w-full justify-end" : "ml-auto"}`}>
            {last ? (
              <>
                <button type="button" onClick={() => close()} className="btn btn-ghost btn-sm">Explorar</button>
                <button type="button" onClick={() => close("/panel/clientes/nuevo")} className="btn btn-primary btn-sm">Crear mi primer cliente</button>
              </>
            ) : (
              <>
                {i === 0
                  ? <button type="button" onClick={() => close()} className="btn btn-ghost btn-sm">Ahora no</button>
                  : <button type="button" onClick={() => setI(i - 1)} className="btn btn-ghost btn-sm" aria-label="Anterior">‹</button>}
                <button type="button" onClick={() => setI(i + 1)} className="btn btn-primary btn-sm" autoFocus>{i === 0 ? "Empezar" : "Siguiente"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
