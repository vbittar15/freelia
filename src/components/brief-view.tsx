import type { Brief } from "@/lib/types";
import { fmtDate, money } from "@/lib/utils";

export function BriefView({ brief }: { brief: Brief }) {
  const blocks: [string, string | null][] = [
    ["Objetivo", brief.objective],
    ["Público objetivo", brief.audience],
    ["Mensaje clave", brief.key_message],
    ["Entregables", brief.deliverables],
    ["Referencias", brief.refs],
  ];
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
      <div className="card p-6 space-y-6">
        {blocks.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-1.5">{k}</div>
            <p className="whitespace-pre-wrap leading-relaxed break-words">{v}</p>
          </div>
        ))}
        {blocks.every(([, v]) => !v) && <p className="text-muted">Este brief aún no tiene detalles.</p>}
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl bg-lila-t p-5">
          <div className="text-[11px] text-muted">Fecha de entrega</div>
          <div className="font-medium">{fmtDate(brief.deadline)}</div>
        </div>
        <div className="rounded-2xl bg-verde-t p-5">
          <div className="text-[11px] text-muted">Presupuesto</div>
          <div className="font-medium">{brief.budget ? money(brief.budget) : "Por definir"}</div>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <div className="text-[11px] text-muted">Creado</div>
          <div className="font-medium">{fmtDate(brief.created_at)}</div>
        </div>
      </div>
    </div>
  );
}
