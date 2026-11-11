import Link from "next/link";
import { cn } from "@/lib/utils";
import { Lia } from "./brand";

export function PageHeader({
  title, subtitle, actions, back,
}: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-7">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-brand mb-3">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center text-center px-6 py-14">
      <Lia size={52} mood="calm" />
      <h3 className="mt-4 font-medium">{title}</h3>
      {text && <p className="text-muted mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone = "cielo", href }: { label: string; value: React.ReactNode; tone?: "cielo" | "lavanda" | "menta" | "mantequilla" | "rosa"; href?: string }) {
  const bg = { cielo: "bg-cielo", lavanda: "bg-lavanda", menta: "bg-menta", mantequilla: "bg-mantequilla", rosa: "bg-rosa" }[tone];
  const inner = (
    <div className={cn("rounded-2xl p-5 h-full transition-transform", bg, href && "hover:-translate-y-0.5")}>
      <div className="text-[12px] text-muted">{label}</div>
      <div className="text-[24px] font-semibold mt-1 tracking-tight">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  // parrilla
  borrador: { label: "Borrador", cls: "bg-surface text-muted" },
  en_revision: { label: "En revisión", cls: "bg-mantequilla text-[#9a7413]" },
  cambios: { label: "Cambios pedidos", cls: "bg-rosa text-[#b13a68]" },
  aprobado: { label: "Aprobado", cls: "bg-menta text-[#2c7a57]" },
  publicado: { label: "Publicado", cls: "bg-lavanda text-[#5b49c9]" },
  // briefs
  nuevo: { label: "Nuevo", cls: "bg-cielo text-brand" },
  en_proceso: { label: "En proceso", cls: "bg-mantequilla text-[#9a7413]" },
  completado: { label: "Completado", cls: "bg-menta text-[#2c7a57]" },
  // cotizaciones
  enviada: { label: "Enviada", cls: "bg-cielo text-brand" },
  aceptada: { label: "Aceptada", cls: "bg-menta text-[#2c7a57]" },
  rechazada: { label: "Rechazada", cls: "bg-rosa text-[#b13a68]" },
  // cobros
  pagada: { label: "Pagada", cls: "bg-menta text-[#2c7a57]" },
  vencida: { label: "Vencida", cls: "bg-rosa text-[#b13a68]" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-surface text-muted" };
  return (
    <span className={cn("badge", s.cls)}>
      <span className="dot" />
      {label ?? s.label}
    </span>
  );
}

export function ClientChip({ name, color }: { name: string; color?: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="size-2.5 rounded-full shrink-0" style={{ background: color || "#C9D6FF" }} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Avatar({ name, size = 32, color }: { name?: string | null; size?: number; color?: string | null }) {
  const initials = (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-medium text-ink shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: color || "var(--color-lavanda)" }}
    >
      {initials}
    </span>
  );
}
