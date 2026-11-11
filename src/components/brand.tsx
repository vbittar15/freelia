import { cn } from "@/lib/utils";

/** Logo "Punto.": Freelia en Poppins con el punto de la i en azul de marca */
export function Logo({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("font-semibold tracking-tight text-ink select-none inline-flex items-baseline", className)}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-label="Freelia"
    >
      Freel
      <span className="relative inline-block">
        ı
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-brand"
          style={{ width: size * 0.24, height: size * 0.24, top: -size * 0.14 }}
        />
      </span>
      a
    </span>
  );
}

/** Lia: la asistente, un punto con ojos */
export function Lia({ size = 40, mood = "happy", className }: { size?: number; mood?: "happy" | "wink" | "calm"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="var(--color-brand)" />
      <circle cx="13" cy="12" r="5" fill="white" opacity=".18" />
      {mood === "wink" ? (
        <path d="M12.5 18.5q2.5-2 5 0" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="15" cy="18" rx="2.2" ry={mood === "calm" ? 1.4 : 2.8} fill="white" />
      )}
      <ellipse cx="25" cy="18" rx="2.2" ry={mood === "calm" ? 1.4 : 2.8} fill="white" />
      <path d="M16.5 24.5q3.5 3 7 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="11" cy="23" r="2" fill="#ffb8d2" opacity=".55" />
      <circle cx="29" cy="23" r="2" fill="#ffb8d2" opacity=".55" />
    </svg>
  );
}
