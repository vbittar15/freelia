import Link from "next/link";
import type { Brief } from "@/lib/types";
import { KINDS, type RequestKind, fieldValue } from "@/lib/requests";
import { cn } from "@/lib/utils";
import { Icon, IconTile } from "./icons";

/** Elegir el tipo de solicitud */
export function KindPicker({ href, current }: { href: (k: string) => string; current?: string }) {
  if (current) return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
      <div className="flex gap-1.5 w-max">
        {KINDS.map((k) => (
          <Link key={k.key} href={href(k.key)} scroll={false}
            className={cn("btn btn-sm whitespace-nowrap", current === k.key ? "bg-brand text-white" : "bg-surface text-ink hover:bg-surface-2")}>
            <Icon name={k.icon} className="size-4" /> {k.label}
          </Link>
        ))}
      </div>
    </div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger">
      {KINDS.map((k) => (
        <Link key={k.key} href={href(k.key)} scroll={false}
          className={cn("rounded-[22px] p-4 flex flex-col gap-2 transition-all active:scale-[.98]",
            current === k.key ? "bg-brand text-white shadow-[0_8px_22px_rgba(61,91,245,.28)]" : "bg-surface hover:bg-surface-2")}>
          <IconTile name={k.icon} tint={k.tint} size={42} className={current === k.key ? "!bg-white/20 !text-white" : ""} />
          <span className="font-semibold text-[16px] leading-tight">{k.label}</span>
          <span className={cn("text-[12px] leading-snug", current === k.key ? "text-white/80" : "text-muted")}>{k.desc}</span>
        </Link>
      ))}
    </div>
  );
}

/** Campos del formulario según el tipo */
export function RequestFields({ kind, brief }: { kind: RequestKind; brief?: Brief }) {
  const def = (key: string): unknown => key.startsWith("d.") ? (brief?.details as Record<string, unknown> | undefined)?.[key.slice(2)] : brief ? (brief as unknown as Record<string, unknown>)[key] : undefined;
  return (
    <>
      <input type="hidden" name="kind" value={kind.key} />
      <label className="block sm:col-span-2"><span className="label">{kind.titleLabel}{kind.key === "parrilla" ? "" : " *"}</span>
        <input name="title" className="input" required={kind.key !== "parrilla"} defaultValue={brief?.title} placeholder={kind.titlePlaceholder} /></label>
      {kind.fields.map((f) => {
        const v = def(f.key);
        const cls = f.wide ? "sm:col-span-2" : "";
        const label = <span className="label">{f.label}{f.required ? " *" : ""}</span>;
        if (f.type === "textarea") return <label key={f.key} className={cn("block", cls)}>{label}<textarea name={f.key} rows={3} required={f.required} className="input" defaultValue={(v as string) ?? ""} placeholder={f.placeholder} /></label>;
        if (f.type === "select") return (
          <label key={f.key} className={cn("block", cls)}>{label}
            <select name={f.key} className="input" defaultValue={(v as string) ?? f.options?.[0][0]}>{f.options?.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>);
        if (f.type === "checks") return (
          <div key={f.key} className={cls}>{label}
            <div className="flex flex-wrap gap-2">
              {f.options?.map(([k, l]) => (
                <label key={k} className="inline-flex items-center rounded-full bg-white px-3.5 py-2 text-[14px] cursor-pointer has-[:checked]:bg-brand has-[:checked]:text-white transition-colors">
                  <input type="checkbox" name={f.key} value={k} defaultChecked={Array.isArray(v) && v.includes(k)} className="sr-only" />{l}
                </label>
              ))}
            </div>
          </div>);
        const type = f.type === "money" ? "number" : f.type;
        return <label key={f.key} className={cn("block", cls)}>{label}<input name={f.key} type={type} required={f.required} min={type === "number" ? 0 : undefined} step={f.type === "money" ? 1000 : undefined}
          className="input" defaultValue={(v as string | number) ?? ""} placeholder={f.placeholder} /></label>;
      })}
    </>
  );
}

/** Mostrar los datos de una solicitud */
export function RequestDetails({ brief, kind }: { brief: Brief; kind: RequestKind }) {
  const rows = kind.fields.map((f) => [f.label.replace(/\s*\(opcional\)/i, ""), fieldValue(brief, f)] as const).filter(([, v]) => v);
  const extra = ([["Objetivo", brief.objective], ["Público", brief.audience], ["Mensaje", brief.key_message], ["Entregables", brief.deliverables], ["Referencias", brief.refs]] as const)
    .filter(([l, v]) => v && !rows.some(([rl, rv]) => rv === v || rl === l));
  const all = [...rows, ...extra];
  if (!all.length) return <p className="text-muted text-[14px]">Sin detalles adicionales.</p>;
  return (
    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
      {all.map(([l, v]) => (
        <div key={l} className={String(v).length > 60 ? "sm:col-span-2" : ""}>
          <dt className="text-[11px] uppercase tracking-wide text-muted mb-1">{l}</dt>
          <dd className="whitespace-pre-wrap leading-relaxed break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Avance por etapas */
export function StageTrack({ stages, current }: { stages: { key: string; label: string }[]; current: string }) {
  const idx = Math.max(0, stages.findIndex((s) => s.key === current));
  return (
    <div>
      <ol className="flex items-start gap-1" aria-label="Avance de la solicitud">
        {stages.map((s, i) => (
          <li key={s.key} className="flex-1 min-w-0 flex flex-col gap-1.5" aria-current={i === idx ? "step" : undefined}>
            <span className={cn("h-1.5 rounded-full transition-colors", i <= idx ? "bg-brand" : "bg-surface-2")} />
            <span className={cn("hidden sm:block text-[12px] leading-tight truncate", i === idx ? "font-semibold text-ink" : i < idx ? "text-muted" : "text-faint")}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="sm:hidden mt-2 text-[13px]"><b>{stages[idx]?.label}</b> <span className="text-muted">· paso {idx + 1} de {stages.length}{stages[idx + 1] ? ` · sigue: ${stages[idx + 1].label.toLowerCase()}` : ""}</span></p>
    </div>
  );
}
