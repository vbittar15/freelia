import { cn } from "@/lib/utils";

/** Íconos de Freelia: trazo 1.8, puntas redondeadas, cuadrícula de 24 */
const ICONS = {
  home: <path d="M4 11.5l8-7 8 7V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.6 6.5-5.6s5.9 2 6.5 5.6" /><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M18 14.7c1.9.7 3.2 2.5 3.6 5.3" /></>,
  brief: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="4" /><path d="M3.5 10h17M8.5 3v4M15.5 3v4" /></>,
  quote: <><rect x="4.5" y="3" width="15" height="18" rx="3" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>,
  money: <><path d="M5.5 3h13v18l-3.2-2-3.3 2-3.3-2-3.2 2z" /><path d="M9 8.5h6M9 12.5h6" /></>,
  chat: <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.3A8 8 0 1 1 20 11.5z" />,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9" /><path d="M10.3 20.5a1.94 1.94 0 0 0 3.4 0" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  send: <><path d="M20.5 3.5L10 14" /><path d="M20.5 3.5l-6.5 17-4-6.5-6.5-4z" /></>,
  more: <><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>,

  // acciones
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  pencil: <><path d="M15.5 4.5l4 4L8 20H4v-4z" /><path d="M13.5 6.5l4 4" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  download: <><path d="M12 4v11M7 10.5l5 5 5-5" /><path d="M4.5 19.5h15" /></>,
  share: <><path d="M12 15V4M8 7.5l4-4 4 4" /><path d="M6.5 11H5.5a1 1 0 0 0-1 1v7.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V12a1 1 0 0 0-1-1h-1" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  clip: <path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7l8.3-8.3a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.5-7.5" />,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  alert: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.2v.3" /></>,
  box: <><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  sparkle: <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9zM18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />,
  play: <path d="M7.5 5v14l11-7z" />,
  file: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5" /></>,
  music: <><path d="M9 18V5.5l11-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  // tipos de solicitud
  image: <><rect x="3.5" y="4" width="17" height="16" rx="4" /><circle cx="9" cy="9.5" r="1.7" /><path d="M20.5 15.5l-4.5-4.5-8.5 9" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2.5L15 19V5L7.5 9H5a1 1 0 0 0-1 1z" /><path d="M18.5 9a4 4 0 0 1 0 6M7.5 15l1.2 4.5" /></>,
  layers: <><path d="M12 3.5l9 4.8-9 4.8-9-4.8z" /><path d="M3 12.3l9 4.8 9-4.8M3 16.2l9 4.8 9-4.8" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></>,
  // rubros
  trend: <><path d="M3.5 17.5l6-6 4 4 7-7.5" /><path d="M15 8h5.5v5.5" /></>,
  community: <><path d="M14.5 10.5a5.5 5.5 0 0 1-8 4.9L3.5 16.5l1-3a5.5 5.5 0 1 1 10-3z" /><path d="M10.6 17.4a5.5 5.5 0 0 0 7.9 1.6l3 1-1-3a5.5 5.5 0 0 0-3.9-8.2" /></>,
  pen: <><path d="M12 19.5l7-7-3.5-3.5-7 7" /><path d="M15.5 9L14 4.5 4.5 7 3 20.5l1-1M3.5 20l6-6" /><circle cx="11" cy="13" r="1.6" /></>,
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="3" /><path d="M10.5 18.5h3" /></>,
  code: <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14" />,
  clapper: <><rect x="3.5" y="9" width="17" height="11.5" rx="2.5" /><path d="M3.5 9l15.6-4.2.7 2.6M8 7.8l2.7 2.6M13 6.4l2.8 2.6" /></>,
  camera: <><path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5H8l1.7-2.5h4.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><circle cx="12" cy="13" r="3.5" /></>,
  type: <path d="M5 7V5h14v2M12 5v14M9 19h6" />,
  brush: <><path d="M20 4.5c-3.5 1.5-8 6-9.5 8.5l1.5 1.5c2.5-1.5 7-6 8.5-9.5z" /><path d="M10.5 13c-2 0-3.5 1.5-3.5 3.5 0 1.5-1 2.5-3 3 4.5 1 8 0 8-3.5" /></>,
  wand: <><path d="M4 20L15 9M13.5 7.5l3 3" /><path d="M18 3.5v3M16.5 5h3M20 10v2.5M18.8 11.2h2.5M9.5 3.5v2M8.5 4.5h2" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.3" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></>,
  selfie: <><rect x="6.5" y="2.5" width="11" height="19" rx="3" /><path d="M12 15.3s-3-1.8-3-3.8a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.8-3 3.8z" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  building: <><rect x="4.5" y="3.5" width="10" height="17" rx="1.5" /><path d="M14.5 9.5h4a1 1 0 0 1 1 1v10M8 7.5h3M8 11h3M8 14.5h3M3 20.5h18" /></>,
  bulb: <><path d="M9 17.5h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16.5h5v-.6c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className, strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[22px] shrink-0", className)} fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

/** Ícono dentro de una baldosa con tinte pastel (tipos de solicitud, rubros, archivos) */
export const TINTS = {
  azul: "bg-azul-t text-brand-dark", lila: "bg-lila-t text-[#6B4FD8]", verde: "bg-verde-t text-[#1E8C57]",
  rosa: "bg-rosa-t text-[#C2427F]", amarillo: "bg-amarillo-t text-[#A9780A]", gris: "bg-surface-2 text-muted",
} as const;
export type Tint = keyof typeof TINTS;

export function IconTile({ name, tint = "azul", size = 40, className }: { name: IconName; tint?: Tint; size?: number; className?: string }) {
  return (
    <span className={cn("grid place-items-center shrink-0", TINTS[tint], className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.34) }} aria-hidden>
      <span style={{ width: size * 0.52, height: size * 0.52 }} className="grid [&>svg]:size-full"><Icon name={name} strokeWidth={1.9} /></span>
    </span>
  );
}
