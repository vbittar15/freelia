"use client";

import { useState } from "react";
import { waNumber } from "./invite-panel";

/** Compartir el enlace de revisión por WhatsApp o copiarlo */
export function ShareReview({ link, clientName, count, phone, message }:
  { link: string; clientName: string; count: number; phone?: string | null; message?: string | null }) {
  const [copied, setCopied] = useState(false);
  const first = clientName.split(" ")[0];
  const text = `Hola ${first}, te envié ${count === 1 ? "1 pieza" : `${count} piezas`} para aprobar en Freelia.${message ? `\n\n${message}` : ""}\n\nRevísalas aquí: ${link}`;
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
        className="btn btn-sm bg-[#25D366] text-ink hover:bg-[#1fbe5b]">Avisar por WhatsApp</a>
      <button type="button" onClick={copy} className="btn btn-sm bg-white text-ink hover:bg-surface">{copied ? "¡Copiado!" : "Copiar mensaje"}</button>
    </div>
  );
}
