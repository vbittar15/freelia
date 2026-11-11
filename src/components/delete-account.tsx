"use client";

import { useState } from "react";
import { Lia } from "./brand";
import { SubmitButton } from "./client-ui";

/** Zona de peligro: eliminar la cuenta con confirmación escrita */
export function DeleteAccount({ action, back, role, error }: { action: (f: FormData) => void; back: string; role: "creative" | "client"; error?: string }) {
  const [open, setOpen] = useState(!!error);
  const [text, setText] = useState("");
  const ok = text.trim().toUpperCase() === "ELIMINAR";
  const lost = role === "creative"
    ? ["Tus clientes y sus fichas", "Parrilla, piezas y comentarios", "Solicitudes, cotizaciones y cuentas de cobro", "Chats y archivos que subiste"]
    : ["Tu acceso al portal y tus notificaciones", "Los archivos que subiste", "Tu equipo creativo conserva el historial de piezas, pedidos y mensajes"];

  return (
    <section id="eliminar" className="on-white mt-10 max-w-3xl rounded-[22px] ring-1 ring-rosa/40 p-5 sm:p-6">
      <h2 className="h2">Eliminar cuenta</h2>
      <p className="text-[14px] text-muted mt-1">
        {role === "creative" ? "Se borra tu marca en Freelia y todo lo que creaste. Tus clientes perderán el acceso a su portal contigo." : "Tu cuenta se elimina y quedas desconectado de tu equipo creativo."} No se puede deshacer.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm mt-4 bg-rosa-t text-ink hover:bg-rosa/30">Quiero eliminar mi cuenta</button>
      ) : (
        <form action={action} className="mt-4 space-y-4 anim-page">
          <input type="hidden" name="back" value={back} />
          <div className="flex gap-3 rounded-[18px] bg-rosa-t p-4">
            <div className="shrink-0"><Lia size={36} mood="worry" color="#FF7EB6" /></div>
            <div className="text-[14px]">
              <div className="font-semibold mb-1">{role === "creative" ? "Se eliminará para siempre:" : "Qué pasa al eliminarla:"}</div>
              <ul className="space-y-0.5">{lost.map((l) => <li key={l}>· {l}</li>)}</ul>
              {role === "creative" && <p className="mt-2 text-muted">Antes, descarga tu copia de seguridad (arriba) para guardar todo.</p>}
            </div>
          </div>
          {error && <p className="rounded-[14px] bg-rosa-t px-3 py-2 text-[13px]">{error}</p>}
          <label className="block">
            <span className="label">Escribe <b className="text-ink">ELIMINAR</b> para confirmar</span>
            <input name="confirm" value={text} onChange={(e) => setText(e.target.value)} className="input max-w-xs" autoComplete="off" autoCapitalize="characters" />
          </label>
          <div className="flex flex-wrap gap-2">
            <SubmitButton className={`btn ${ok ? "bg-rosa text-white hover:bg-[#f0609f]" : "bg-surface text-muted pointer-events-none"}`} pendingText="Eliminando…">Eliminar mi cuenta para siempre</SubmitButton>
            <button type="button" onClick={() => { setOpen(false); setText(""); }} className="btn btn-ghost">Cancelar</button>
          </div>
        </form>
      )}
    </section>
  );
}
