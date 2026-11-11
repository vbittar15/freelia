"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push";
import { Lia } from "./brand";

/** Registra el service worker (app instalable + push) */
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type State = "loading" | "unsupported" | "ios-install" | "ask" | "on" | "denied";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

function store(key: string, v?: string) {
  try { if (v === undefined) return localStorage.getItem(key); localStorage.setItem(key, v); } catch { /* sin almacenamiento */ }
  return null;
}

/**
 * Tarjeta para instalar Freelia y activar notificaciones en este dispositivo.
 * compact: versión para el inicio, que se puede cerrar.
 */
export function NotifyCard({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [install, setInstall] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (compact && store("freelia-notify-hide") === "1") setHidden(true);
    const onBIP = (e: Event) => { e.preventDefault(); setInstall(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", onBIP);
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) { setState(isIOS() && !isStandalone() ? "ios-install" : "unsupported"); return; }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "ask");
    })();
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [compact]);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "ask"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
      const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const { error } = await createClient().from("push_subscriptions").upsert(
        { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
        { onConflict: "endpoint", ignoreDuplicates: true });
      if (error) throw error;
      setState("on");
      reg.showNotification("¡Listo! Notificaciones activas", { body: "Te avisaremos aquí cuando pase algo importante.", icon: "/icon-192.png", badge: "/badge-96.png" });
    } catch {
      setMsg("No se pudieron activar. Intenta de nuevo.");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setState("ask"); setBusy(false);
  }

  async function doInstall() {
    if (!install) return;
    await install.prompt();
    await install.userChoice;
    setInstall(null);
  }

  if (state === "loading" || hidden) return null;
  if (compact && state === "on" && !install) return null;
  if (compact && (state === "unsupported" || state === "denied")) return null;

  const close = compact && (
    <button type="button" aria-label="Cerrar" onClick={() => { setHidden(true); store("freelia-notify-hide", "1"); }}
      className="absolute top-3 right-3 size-8 rounded-full hover:bg-white/60 flex items-center justify-center text-muted cursor-pointer">✕</button>
  );

  return (
    <div className="relative rounded-[22px] bg-lila-t p-5 anim-pop">
      {close}
      <div className="flex gap-3.5 pr-6">
        <div className="anim-bob shrink-0"><Lia size={40} mood={state === "on" ? "happy" : state === "denied" ? "worry" : "idea"} color={state === "on" ? "#2FBF7A" : state === "denied" ? "#FF7EB6" : "#A98BFF"} /></div>
        <div className="min-w-0">
          {state === "ios-install" && (
            <>
              <div className="font-semibold">Instala Freelia en tu iPhone</div>
              <p className="text-[14px] text-ink/75 mt-1 leading-relaxed">
                Toca <b>Compartir</b> <span aria-hidden>⬆︎</span> en Safari y luego <b>“Agregar a pantalla de inicio”</b>. Ábrela desde ahí para activar las notificaciones.
              </p>
            </>
          )}
          {state === "ask" && (
            <>
              <div className="font-semibold">Activa las notificaciones</div>
              <p className="text-[14px] text-ink/75 mt-1">Te avisamos al instante cuando aprueben, pidan cambios, te escriban o te paguen.</p>
            </>
          )}
          {state === "on" && (
            <>
              <div className="font-semibold">Notificaciones activas en este dispositivo</div>
              <p className="text-[14px] text-ink/75 mt-1">Actívalas también en tu otro celular o computador si quieres.</p>
            </>
          )}
          {state === "denied" && (
            <>
              <div className="font-semibold">Las notificaciones están bloqueadas</div>
              <p className="text-[14px] text-ink/75 mt-1">Permítelas en la configuración de tu navegador para este sitio y vuelve a intentarlo.</p>
            </>
          )}
          {state === "unsupported" && (
            <>
              <div className="font-semibold">Este navegador no admite notificaciones</div>
              <p className="text-[14px] text-ink/75 mt-1">Prueba con Chrome, Edge, Firefox o Safari actualizado.</p>
            </>
          )}

          <div className="mt-3.5 flex flex-wrap gap-2">
            {state === "ask" && <button type="button" onClick={enable} disabled={busy} className="btn btn-primary btn-sm">{busy ? "Activando…" : "Activar notificaciones"}</button>}
            {state === "on" && !compact && <button type="button" onClick={disable} disabled={busy} className="btn btn-sm bg-white text-ink hover:bg-surface">Desactivar aquí</button>}
            {install && <button type="button" onClick={doInstall} className="btn btn-sm bg-white text-ink hover:bg-surface">Instalar la app</button>}
          </div>
          {msg && <p className="text-[13px] text-[#c03a77] mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
