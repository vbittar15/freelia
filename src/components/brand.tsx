import { cn } from "@/lib/utils";

const INK = "#221A3A";
const CHEEK = "#FF7EB6";

/**
 * Logo "Punto.": "freelia" en minúsculas, Poppins 900.
 * El punto de la i crece, sube y es lo único que lleva color.
 */
export function Logo({ className, size = 24, color = INK, dot = "#3D5BF5" }:
  { className?: string; size?: number; color?: string; dot?: string }) {
  return (
    <span
      className={cn("inline-block whitespace-nowrap select-none", className)}
      style={{ fontSize: size, fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.1, color }}
      role="img"
      aria-label="Freelia"
    >
      freel
      <span className="relative inline-block">
        <span className="inline-block" style={{ clipPath: "inset(0.325em 0 0 0)" }}>i</span>
        <span
          className="absolute block rounded-full"
          style={{ left: "calc(50% + 0.0175em)", top: "-0.01em", width: "0.3em", height: "0.3em", transform: "translateX(-50%)", background: dot }}
        />
      </span>
      a
    </span>
  );
}

export type LiaMood = "base" | "right" | "idea" | "happy" | "worry" | "sleep" | "smile" | "peek";

/**
 * Lia: el punto del logo, despierto. Gestos de la biblioteca de componentes.
 * Por debajo de 60 px va sin boca ni cachetes.
 */
export function Lia({ size = 40, mood = "base", color = "#3D5BF5", className, still }:
  { size?: number; mood?: LiaMood; color?: string; className?: string; still?: boolean }) {
  const big = size >= 60;
  const eye = (x: number, y: number) => <ellipse cx={x} cy={y} rx={6.5} ry={10} fill={INK} />;
  const line = (d: string, w = 5) => <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
  const cheeks = big && <><ellipse cx={-31} cy={12} rx={7.5} ry={4.8} fill={CHEEK} /><ellipse cx={31} cy={12} rx={7.5} ry={4.8} fill={CHEEK} /></>;
  const star = "M0 -1C.14 -.14 .14 -.14 1 0C.14 .14 .14 .14 0 1C-.14 .14 -.14 .14 -1 0C-.14 -.14 -.14 -.14 0 -1Z";

  let body = { rx: 50, ry: 50, dy: 0 };
  let face: React.ReactNode;
  let extra: React.ReactNode = null;

  switch (mood) {
    case "right":
      face = <>{eye(-6, -6)}{eye(24, -6)}{big && line("M3 14h12", 4.5)}</>;
      break;
    case "idea":
      body = { rx: 48.5, ry: 51.5, dy: -1.5 };
      face = <>{eye(-15, -18)}{eye(15, -18)}{big && <circle cx={0} cy={12} r={4.5} fill={INK} />}</>;
      extra = big && <path transform="translate(44 -66) scale(13)" d={star} fill={INK} />;
      break;
    case "happy":
      body = { rx: 51.5, ry: 48.5, dy: 1.5 };
      face = <>{line("M-23 -3q8 -13 16 0", 5.5)}{line("M7 -3q8 -13 16 0", 5.5)}{cheeks}{big && <path d="M-10 8h20a10 10 0 0 1-20 0z" fill={INK} />}</>;
      extra = big && <>{line("M54 -48l10 -12")}{line("M66 -30l15 -5")}{line("M-54 -48l-10 -12")}{line("M-66 -30l-15 -5")}</>;
      break;
    case "worry":
      if (big) body = { rx: 52.5, ry: 46.5, dy: 3.5 };
      face = <>{eye(-15, -2)}{eye(15, -2)}{line("M-28 -19l15 -7")}{line("M28 -19l-15 -7")}{big && line("M-9 16q4.5 -5 9 0t9 0", 4.5)}</>;
      extra = big && <path d="M60 -52c5 8 9 13 9 18a9 9 0 0 1-18 0c0-5 4-10 9-18z" fill="#3D5BF5" />;
      break;
    case "sleep":
      face = <>{line("M-23 -4h16")}{line("M7 -4h16")}{cheeks}</>;
      extra = big && <><text x={44} y={-40} fontFamily="Poppins" fontWeight={800} fontSize={26} fill={INK}>z</text><text x={64} y={-62} fontFamily="Poppins" fontWeight={800} fontSize={18} fill={INK}>z</text></>;
      break;
    case "smile":
      face = <>{eye(-15, -6)}{eye(15, -6)}{cheeks}{big && line("M-7 10q7 7 14 0", 4.5)}</>;
      break;
    case "peek":
      face = <>{eye(-22, 4)}{eye(8, 4)}{cheeks}{big && line("M-7 10q7 7 14 0", 4.5)}</>;
      break;
    default:
      face = <>{eye(-15, -6)}{eye(15, -6)}</>;
  }

  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className={cn("block shrink-0 overflow-visible", className)} aria-hidden>
      <ellipse cx={0} cy={body.dy} rx={body.rx} ry={body.ry} fill={color} />
      <g transform={`translate(0 ${body.dy})`}><g className={still || mood === "happy" || mood === "sleep" ? undefined : "lia-eyes"} style={{ animationDelay: `${(size * 37) % 4000}ms` }}>{face}</g></g>
      {extra}
    </svg>
  );
}

/** Estrellita de cuatro puntas (detalle creativo) */
export function Sparkle({ size = 14, color = "#3D5BF5", className, style }:
  { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="-1 -1 2 2" width={size} height={size} className={className} style={style} aria-hidden>
      <path className="anim-twinkle" style={{ animationDelay: `${(size * 173) % 2000}ms` }} d="M0 -1C.14 -.14 .14 -.14 1 0C.14 .14 .14 .14 0 1C-.14 .14 -.14 .14 -1 0C-.14 -.14 -.14 -.14 0 -1Z" fill={color} />
    </svg>
  );
}

/** Trazo a mano bajo una palabra clave */
export function Trazo({ children, color = "#3D5BF5" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden
        className="absolute overflow-visible" style={{ left: "-2%", bottom: "-0.16em", width: "104%", height: "0.24em" }}>
        <path className="trazo-path" pathLength={1} d="M3 9c22-9 40 7 62 0s42-8 64 0 44 6 68-2" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/* ---------- Estados: color + gesto + palabra ---------- */
type StateDef = { label: string; dot: string; tint: string; mood: LiaMood };
export const STATES: Record<string, StateDef> = {
  // parrilla
  borrador:    { label: "Borrador",        dot: "#B7AFC5", tint: "#EFECF4", mood: "sleep" },
  en_revision: { label: "En revisión",     dot: "#3D5BF5", tint: "#DCE3FF", mood: "right" },
  cambios:     { label: "Cambios pedidos", dot: "#FF7EB6", tint: "#FFDCEB", mood: "worry" },
  aprobado:    { label: "Aprobado",        dot: "#2FBF7A", tint: "#CDF2DF", mood: "happy" },
  publicado:   { label: "Publicado",       dot: "#A98BFF", tint: "#E7DEFF", mood: "smile" },
  // briefs
  nuevo:       { label: "Brief nuevo",     dot: "#FFC93C", tint: "#FFF1C2", mood: "idea" },
  en_proceso:  { label: "En proceso",      dot: "#3D5BF5", tint: "#DCE3FF", mood: "right" },
  completado:  { label: "Completado",      dot: "#2FBF7A", tint: "#CDF2DF", mood: "happy" },
  // cotizaciones
  enviada:     { label: "Enviada",         dot: "#3D5BF5", tint: "#DCE3FF", mood: "right" },
  aceptada:    { label: "Aceptada",        dot: "#2FBF7A", tint: "#CDF2DF", mood: "happy" },
  rechazada:   { label: "Rechazada",       dot: "#FF7EB6", tint: "#FFDCEB", mood: "worry" },
  cotizado:    { label: "Cotizado",        dot: "#A98BFF", tint: "#E7DEFF", mood: "smile" },
  // cobros
  pendiente:   { label: "Pendiente",       dot: "#3D5BF5", tint: "#DCE3FF", mood: "right" },
  pagada:      { label: "Pagada",          dot: "#2FBF7A", tint: "#CDF2DF", mood: "happy" },
  vencida:     { label: "Vencida",         dot: "#FF7EB6", tint: "#FFDCEB", mood: "worry" },
};
const fallback: StateDef = { label: "", dot: "#B7AFC5", tint: "#EFECF4", mood: "base" };

/** Ícono de fila: círculo suave con Lia en el color del estado */
export function StateLia({ status, size = 40 }: { status: string; size?: number }) {
  const s = STATES[status] ?? fallback;
  return (
    <span className="flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, background: s.tint }}>
      <Lia size={Math.round(size * 0.6)} mood={s.mood} color={s.dot} />
    </span>
  );
}

/** Etiqueta de estado: el color nunca va solo, siempre con su palabra */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = STATES[status] ?? fallback;
  return (
    <span className="inline-flex items-center gap-1.5 h-[26px] pl-2 pr-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap text-ink shrink-0"
      style={{ background: s.tint }}>
      <span className="size-[7px] rounded-full" style={{ background: s.dot }} />
      {label ?? (s.label || status)}
    </span>
  );
}
