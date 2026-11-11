import type { Brief } from "@/lib/types";
import { FileGrid } from "./files";
import { RequestDetails } from "./request-fields";
import { kindOf } from "@/lib/requests";
import { fmtDate, fmtDateTime, money } from "@/lib/utils";

export function BriefView({ brief }: { brief: Brief }) {
  const kind = kindOf(brief);
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
      <div className="card p-5 sm:p-6 space-y-6">
        <RequestDetails brief={brief} kind={kind} />
        {!!brief.attachments?.length && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Archivos</div>
            <FileGrid files={brief.attachments} />
          </div>
        )}
      </div>
      <div className="space-y-3">
        {kind.key === "reunion" ? (
          <div className="rounded-2xl bg-lila-t p-5">
            <div className="text-[11px] text-muted">Reunión</div>
            <div className="font-medium">{brief.meeting_at ? fmtDateTime(brief.meeting_at) : "Por confirmar"}</div>
          </div>
        ) : (
          <div className="rounded-2xl bg-lila-t p-5">
            <div className="text-[11px] text-muted">Fecha de entrega</div>
            <div className="font-medium">{fmtDate(brief.deadline)}</div>
          </div>
        )}
        {brief.budget ? (
          <div className="rounded-2xl bg-verde-t p-5">
            <div className="text-[11px] text-muted">Presupuesto</div>
            <div className="font-medium">{money(brief.budget)}</div>
          </div>
        ) : null}
        <div className="rounded-2xl bg-surface p-5">
          <div className="text-[11px] text-muted">Creada</div>
          <div className="font-medium">{fmtDate(brief.created_at)}</div>
        </div>
      </div>
    </div>
  );
}
