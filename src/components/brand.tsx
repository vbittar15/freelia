import { cn } from "@/lib/utils";

/**
 * Logo "Punto." según el manual de marca:
 * "freelia" en minúsculas, Poppins 900. El punto de la i crece, sube
 * y es lo único que lleva color (azul de marca).
 */
export function Logo({ className, size = 24, color = "var(--color-ink)", dot = "var(--color-brand)" }:
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

/** Lia: el mismo punto, con ojos. Sin boca, brazos ni piernas: con la mirada basta. */
export function Lia({ size = 40, mood = "base", color = "var(--color-brand)", className }:
  { size?: number; mood?: "base" | "happy" | "wink" | "calm"; color?: string; className?: string }) {
  const eye = "var(--color-ink)";
  const oval = (x: number) => <ellipse cx={x} cy={-6} rx={6.5} ry={mood === "calm" ? 5 : 10} fill={eye} />;
  const arc = (x: number) => <path d={`M${x - 8} -3q8 -13 16 0`} fill="none" stroke={eye} strokeWidth={5.5} strokeLinecap="round" />;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" className={className} aria-hidden>
      <circle r={50} fill={color} />
      {mood === "happy" ? <>{arc(-15)}{arc(15)}</> : mood === "wink" ? <>{arc(-15)}{oval(15)}</> : <>{oval(-15)}{oval(15)}</>}
    </svg>
  );
}
