import Link from "next/link";
import { cn } from "@/lib/utils";
import { Lia, type LiaMood, Sparkle, StateLia, StatusPill } from "./brand";

export function PageHeader({
  title, subtitle, actions, back,
}: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-7">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-dark hover:underline mb-3">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="h1">{title}</h1>
          {subtitle && <div className="text-muted mt-1.5">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Encabezado en tono suave con Lia asomándose (Inicio y Cobros) */
export function Hero({ children, tint = "#DCE3FF", lia = "#3D5BF5", mood = "peek" }:
  { children: React.ReactNode; tint?: string; lia?: string; mood?: LiaMood }) {
  return (
    <div className="relative overflow-hidden rounded-[32px] px-6 md:px-9 pt-7 pb-8 md:pt-9 md:pb-10 mb-8" style={{ background: tint }}>
      <Sparkle size={14} className="absolute right-[150px] top-[46%] hidden sm:block" />
      <Sparkle size={9} color="#A98BFF" className="absolute right-[176px] top-[60%] hidden sm:block" />
      <div className="absolute -right-5 -bottom-7 sm:-bottom-6 scale-75 sm:scale-100 origin-bottom-right"><div className="anim-peek"><div className="anim-bob"><Lia size={124} mood={mood} color={lia} /></div></div></div>
      <div className="relative pr-16 sm:pr-28">{children}</div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center text-center px-6 py-12 anim-page">
      <div className="anim-float"><Lia size={64} mood="sleep" color="#A98BFF" /></div>
      <h3 className="mt-4 font-semibold text-[16px]">{title}</h3>
      {text && <p className="text-muted mt-1 max-w-sm text-[14px]">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const TONES = {
  cielo: "#DCE3FF", lavanda: "#E7DEFF", menta: "#CDF2DF", mantequilla: "#FFF1C2", rosa: "#FFDCEB",
} as const;
const DOTS = {
  cielo: "#3D5BF5", lavanda: "#A98BFF", menta: "#2FBF7A", mantequilla: "#FFC93C", rosa: "#FF7EB6",
} as const;

export function Stat({ label, value, tone = "cielo", href }: { label: string; value: React.ReactNode; tone?: keyof typeof TONES; href?: string }) {
  const inner = (
    <div className={cn("rounded-[22px] p-4 sm:p-5 h-full", href && "lift")} style={{ background: TONES[tone] }}>
      <div className="flex items-start gap-2 text-[12px] sm:text-[13px] font-medium text-muted leading-tight">
        <span className="size-[7px] rounded-full mt-1 shrink-0" style={{ background: DOTS[tone] }} />{label}
      </div>
      <div className="text-[22px] sm:text-[26px] font-bold mt-1.5 tracking-[-0.02em] break-words">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <StatusPill status={status} label={label} />;
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="#A69EBB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
);

/** Fila de lista: Lia del estado + título + detalle + (valor) + chevron */
export function Row({ href, status, icon, title, sub, right, pill }:
  { href: string; status?: string; icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; pill?: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 bg-surface rounded-[20px] pl-3 pr-3.5 py-3 hover:bg-surface-2 transition-[background,transform] active:scale-[.99]">
      {icon ?? (status && <StateLia status={status} />)}
      <div className="min-w-0 flex-1">
        <div className="text-[15px] leading-[21px] font-semibold truncate">{title}</div>
        {sub && <div className="text-[13px] leading-[19px] text-muted truncate">{sub}</div>}
      </div>
      {right && <div className="text-[15px] font-semibold whitespace-nowrap">{right}</div>}
      {pill && <div className="hidden sm:block">{pill}</div>}
      <Chevron />
    </Link>
  );
}

export function RowList({ children, empty }: { children: React.ReactNode[]; empty?: React.ReactNode }) {
  if (!children.length) return <>{empty ?? null}</>;
  return <div className="flex flex-col gap-2.5 stagger">{children}</div>;
}

export function ClientChip({ name, color }: { name: string; color?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="size-2 rounded-full shrink-0" style={{ background: color || "#C9D6FF" }} />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-muted mt-1.5 px-1">{hint}</span>}
    </label>
  );
}

export function Section({ title, action, children, className, count }:
  { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string; count?: number }) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="h2">{title}</h2>
          {!!count && <span className="min-w-[22px] h-[22px] px-[7px] rounded-full bg-brand-soft text-[12px] font-bold inline-flex items-center justify-center">{count}</span>}
        </div>
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
      className="inline-flex items-center justify-center rounded-full font-semibold text-ink shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36, background: color || "#E7DEFF" }}
    >
      {initials}
    </span>
  );
}

/** Aviso con tono (éxito, info, error) */
export function Notice({ tone = "info", children }: { tone?: "ok" | "info" | "error" | "warn"; children: React.ReactNode }) {
  const map = {
    ok: { bg: "#CDF2DF", c: "#2FBF7A", m: "happy" as LiaMood },
    info: { bg: "#DCE3FF", c: "#3D5BF5", m: "base" as LiaMood },
    error: { bg: "#FFDCEB", c: "#FF7EB6", m: "worry" as LiaMood },
    warn: { bg: "#FFF1C2", c: "#FFC93C", m: "idea" as LiaMood },
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-[20px] px-4 py-3 mb-5 text-[14px] anim-pop" style={{ background: map.bg }}>
      <Lia size={26} mood={map.m} color={map.c} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
