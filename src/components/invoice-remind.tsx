"use client";

import { useTransition } from "react";
import { markReminded } from "@/app/panel/cobros/pay-actions";
import { waNumber } from "./invite-panel";
import { Icon } from "./icons";

/** Recordatorio de pago por WhatsApp (y deja constancia de cuándo se envió) */
export function InvoiceRemind({ id, phone, text }: { id: string; phone?: string | null; text: string }) {
  const [pending, start] = useTransition();
  return (
    <a href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
      onClick={() => start(async () => { const f = new FormData(); f.set("id", id); await markReminded(f); })}
      className="btn btn-sm bg-[#25D366] text-ink hover:bg-[#1fbe5b]">
      <Icon name="chat" className="size-4" /> {pending ? "Abriendo…" : "Recordar por WhatsApp"}
    </a>
  );
}
