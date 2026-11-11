import type { Contract } from "@/lib/types";
import { parseBody } from "@/lib/contract";
import { fmtDateTime, money } from "@/lib/utils";
import { Logo } from "./brand";

/** Contrato listo para leer, imprimir o guardar como PDF */
export function ContractDocument({ k }: { k: Contract }) {
  const blocks = parseBody(k.body);
  return (
    <article className="sheet p-6 sm:p-10 text-[14.5px] leading-relaxed">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[12px] uppercase tracking-wide text-muted">Contrato N.º {k.number}</div>
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight leading-tight mt-1">{k.title}</h1>
        </div>
        <Logo size={20} />
      </header>
      <div className="space-y-3">
        {blocks.map((b, i) => b.kind === "h"
          ? <h2 key={i} className="font-bold text-[15.5px] pt-3">{b.text}</h2>
          : b.kind === "li" ? <p key={i} className="pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-brand">{b.text}</p>
          : <p key={i}>{b.text}</p>)}
      </div>

      {k.services.length > 0 && (
        <div className="mt-6 rounded-[16px] bg-surface p-4 text-[13.5px] break-inside-avoid">
          <div className="font-semibold mb-2">Resumen de servicios</div>
          {k.services.map((s, i) => (
            <div key={i} className="flex justify-between gap-3 py-1 border-b border-line last:border-0">
              <span>{Number(s.qty) !== 1 && `${s.qty} × `}{s.name}</span>
              <span className="font-semibold whitespace-nowrap">{money(Number(s.price) * Number(s.qty))}{s.period === "mensual" ? "/mes" : ""}</span>
            </div>
          ))}
        </div>
      )}

      <section className="mt-10 grid sm:grid-cols-2 gap-8 break-inside-avoid">
        <div>
          <div className="h-20 flex items-end">
            {k.sent_at ? <span className="font-[cursive] text-[26px] text-brand-dark leading-none">{k.creative_name}</span> : <span className="text-muted text-[13px]">Pendiente</span>}
          </div>
          <div className="border-t border-ink/60 pt-2">
            <div className="font-semibold">{k.creative_name || "EL CONTRATISTA"}</div>
            <div className="text-[12px] text-muted">EL CONTRATISTA{k.creative_doc ? ` · Doc. ${k.creative_doc}` : ""}</div>
            {k.sent_at && <div className="text-[12px] text-muted">Firmado electrónicamente al enviar · {fmtDateTime(k.sent_at)}</div>}
          </div>
        </div>
        <div>
          <div className="h-20 flex items-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {k.signature ? <img src={k.signature} alt={`Firma de ${k.signer_name}`} className="max-h-20 max-w-full" /> : <span className="text-muted text-[13px]">Pendiente de firma</span>}
          </div>
          <div className="border-t border-ink/60 pt-2">
            <div className="font-semibold">{k.signer_name || k.clients?.company || k.clients?.name || "EL CONTRATANTE"}</div>
            <div className="text-[12px] text-muted">EL CONTRATANTE{k.signer_doc ? ` · Doc. ${k.signer_doc}` : ""}</div>
            {k.signed_at && <div className="text-[12px] text-muted">Firmado electrónicamente · {fmtDateTime(k.signed_at)}</div>}
          </div>
        </div>
      </section>

      {k.signed_at && (
        <footer className="mt-8 rounded-[14px] border border-line p-3 text-[11px] text-muted leading-relaxed break-inside-avoid">
          <b className="text-ink">Evidencia de firma electrónica (Ley 527 de 1999).</b> Firmado por {k.signer_name} ({k.signer_doc}{k.signer_email ? `, ${k.signer_email}` : ""}) el {fmtDateTime(k.signed_at)}
          {k.signer_ip ? ` desde la IP ${k.signer_ip}` : ""}. Huella SHA-256 del texto firmado: <span className="font-mono break-all">{k.body_hash}</span>
        </footer>
      )}
    </article>
  );
}
