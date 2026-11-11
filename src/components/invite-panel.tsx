"use client";

import { useState } from "react";
import { Lia } from "./brand";

function waNumber(phone?: string | null) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10 && d.startsWith("3")) return "57" + d; // celular Colombia
  return d;
}

/** Tarjeta para invitar al cliente a su portal con su enlace único */
export function InvitePanel({ link, clientName, creativeName, phone, email, highlight }:
  { link: string; clientName: string; creativeName: string; phone?: string | null; email?: string | null; highlight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const first = clientName.split(" ")[0];
  const message =
    `Hola ${first}, te invito a tu portal en Freelia. Ahí puedes revisar y aprobar las piezas, ver cotizaciones y cuentas de cobro, y escribirme, todo en un solo lugar.\n\nEntra con este enlace (es solo para ti): ${link}\n\n${creativeName}`;
  const wa = `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message)}`;
  const mail = `mailto:${email ?? ""}?subject=${encodeURIComponent(`${creativeName} te invita a Freelia`)}&body=${encodeURIComponent(message)}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={`rounded-[22px] p-5 ${highlight ? "bg-azul-t ring-2 ring-brand" : "bg-azul-t"}`}>
      <div className="flex items-center gap-3">
        <Lia size={36} mood="right" />
        <div>
          <div className="font-semibold text-[15px]">Invita a {first} a su portal</div>
          <div className="text-[13px] text-muted">Su enlace único lo conecta a esta ficha.</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 bg-white rounded-[16px] pl-3.5 pr-1.5 py-1.5">
        <span className="flex-1 min-w-0 truncate text-[13px] text-muted select-all">{link}</span>
        <button type="button" onClick={copy} className="btn btn-primary btn-sm shrink-0">{copied ? "¡Copiado!" : "Copiar"}</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25D366] text-ink hover:bg-[#1fbe5b]">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.3c.2-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" /></svg>
          WhatsApp
        </a>
        <a href={mail} className="btn btn-sm bg-white text-ink hover:bg-surface">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></svg>
          Correo
        </a>
      </div>
      <p className="mt-3 text-[12px] text-muted leading-relaxed">
        Si no le llegó o lo perdió, envíaselo otra vez. Si crees que alguien más lo tiene, genera uno nuevo y el anterior deja de funcionar.
      </p>
    </div>
  );
}
