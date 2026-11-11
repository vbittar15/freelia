import { Lia, Logo, Sparkle, StatusPill, Trazo } from "./brand";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

/* Mockups estáticos de la app para la landing (datos de ejemplo) */

export function Phone({ children, className, tilt = 0 }: { children: React.ReactNode; className?: string; tilt?: number }) {
  return (
    <div className={cn("relative w-[270px] h-[560px] rounded-[44px] bg-ink p-[9px] shadow-[0_30px_80px_rgba(34,26,58,.28)]", className)}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      <div className="relative w-full h-full rounded-[36px] bg-white overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[86px] h-[24px] rounded-full bg-ink z-20" />
        <div className="absolute inset-0 pt-10 text-ink">{children}</div>
      </div>
    </div>
  );
}

const MiniRow = ({ tint, dot, mood, title, sub }: { tint: string; dot: string; mood: Parameters<typeof Lia>[0]["mood"]; title: string; sub: string }) => (
  <div className="flex items-center gap-2.5 bg-surface rounded-[16px] p-2.5">
    <span className="size-8 rounded-full flex items-center justify-center shrink-0" style={{ background: tint }}><Lia size={19} mood={mood} color={dot} still /></span>
    <div className="min-w-0 flex-1">
      <div className="text-[11.5px] font-semibold leading-tight truncate">{title}</div>
      <div className="text-[10px] text-muted truncate">{sub}</div>
    </div>
  </div>
);

const TabBar = ({ active = 0 }: { active?: number }) => (
  <div className="absolute left-2.5 right-2.5 bottom-3 h-[46px] rounded-full bg-white border border-line shadow-[0_6px_20px_rgba(34,26,58,.10)] flex items-center px-1 gap-0.5">
    {["Inicio", "Clientes", "Parrilla", "Cobros"].map((t, i) => (
      <div key={t} className={cn("flex-1 h-[38px] rounded-full flex items-center justify-center text-[9.5px]", i === active ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted")}>{t}</div>
    ))}
  </div>
);

export function ScreenHome() {
  return (
    <>
      <div className="relative mx-0 h-[190px] bg-azul-t rounded-b-[28px] -mt-10 pt-12 px-4 overflow-hidden">
        <div className="flex items-center justify-between"><Logo size={17} /><span className="size-7 rounded-full bg-white shadow-sm" /></div>
        <div className="mt-4 text-[10px] text-muted font-medium">Martes 10 de noviembre</div>
        <div className="text-[20px] font-semibold tracking-tight leading-tight">Hola, Caro.</div>
        <div className="text-[12px] mt-0.5">Hoy tienes <Trazo>3 pendientes</Trazo></div>
        <div className="absolute -right-4 -bottom-6"><Lia size={76} mood="peek" /></div>
        <Sparkle size={10} className="absolute right-[86px] top-[110px]" />
      </div>
      <div className="px-3 pt-4 space-y-2">
        <div className="text-[12px] font-bold px-1">Para hoy</div>
        <MiniRow tint="#FFDCEB" dot="#FF7EB6" mood="worry" title="Reel de lanzamiento" sub="Estudio Brisa pidió cambios" />
        <MiniRow tint="#FFDCEB" dot="#FF7EB6" mood="worry" title="Cuenta de cobro 014" sub="Café Orilla · $ 1.200.000" />
        <MiniRow tint="#FFF1C2" dot="#FFC93C" mood="idea" title="Parrilla de diciembre" sub="Café Orilla · 5:00 p. m." />
        <div className="text-[12px] font-bold px-1 pt-1">Esperando al cliente</div>
        <MiniRow tint="#DCE3FF" dot="#3D5BF5" mood="right" title="Logo y papelería" sub="Óptica Lumen lo está revisando" />
      </div>
      <TabBar />
    </>
  );
}

export function ScreenApproval() {
  return (
    <div className="px-3">
      <div className="text-[10px] text-muted font-medium px-1">Estudio Brisa <span className="inline-flex align-middle ml-0.5"><Logo size={9} /></span></div>
      <div className="text-[18px] font-semibold tracking-tight px-1">Por aprobar</div>
      <div className="mt-3 rounded-[22px] overflow-hidden bg-lila-t relative h-[230px]">
        <div className="absolute left-[16%] top-[14%] w-[46%] h-[46%] rounded-full bg-lila opacity-60" />
        <div className="absolute right-[10%] bottom-[16%] w-[40%] h-[16%] rounded-full bg-brand opacity-60" />
        <div className="absolute left-[10%] bottom-[12%] w-[20%] h-[18%] rounded-[10px] bg-amarillo opacity-70" />
        <span className="absolute left-[150px] top-[38px] size-6 rounded-full bg-rosa border-2 border-white flex items-center justify-center text-[10px] font-bold shadow">1</span>
        <div className="absolute left-3 top-3"><StatusPill status="en_revision" /></div>
      </div>
      <div className="mt-3 px-1">
        <div className="text-[13px] font-semibold">Reel de lanzamiento</div>
        <div className="text-[10.5px] text-muted">Instagram · Reel · vie 14, 10:00 a. m.</div>
        <div className="mt-2 flex gap-1.5 items-center text-[10px] text-muted">Ronda
          <span className="size-2 rounded-full bg-ink" /><span className="size-2 rounded-full border border-ink" /><span className="size-2 rounded-full border border-ink" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-[42px] rounded-full bg-verde flex items-center justify-center text-[13px] font-semibold gap-1.5"><Icon name="check" className="size-4" strokeWidth={2.4} /> Aprobar</div>
        <div className="h-[42px] rounded-full bg-rosa-t flex items-center justify-center text-[13px] font-semibold">Pedir cambios</div>
      </div>
    </div>
  );
}

export function ScreenCobros() {
  return (
    <>
      <div className="px-4">
        <div className="text-[18px] font-semibold tracking-tight">Cobros</div>
        <div className="mt-3 rounded-[22px] bg-verde-t p-4 relative overflow-hidden">
          <div className="text-[10px] text-muted font-medium">Cobrado este mes</div>
          <div className="text-[24px] font-bold tracking-tight">$ 6.400.000</div>
          <div className="absolute -right-3 -bottom-4"><Lia size={64} mood="happy" color="#2FBF7A" /></div>
        </div>
      </div>
      <div className="px-3 pt-3 space-y-2">
        <MiniRow tint="#CDF2DF" dot="#2FBF7A" mood="happy" title="N.º 013 · Café Orilla" sub="Pagada · $ 1.800.000" />
        <MiniRow tint="#DCE3FF" dot="#3D5BF5" mood="right" title="N.º 014 · Café Orilla" sub="Vence el 20 · $ 1.200.000" />
        <MiniRow tint="#FFDCEB" dot="#FF7EB6" mood="worry" title="N.º 011 · Óptica Lumen" sub="Vencida · $ 900.000" />
        <div className="rounded-[16px] bg-azul-t p-2.5 flex gap-2 items-end">
          <Lia size={20} still />
          <div className="text-[10.5px] leading-snug">Te recuerdo la cuenta 011. <b>¿La envío?</b></div>
        </div>
      </div>
      <TabBar active={3} />
    </>
  );
}

export function ScreenChat() {
  return (
    <div className="px-3 flex flex-col h-full pb-4">
      <div className="flex items-center gap-2 px-1 pb-3 border-b border-line">
        <span className="size-8 rounded-full bg-rosa-t flex items-center justify-center text-[11px] font-bold">CO</span>
        <div><div className="text-[12px] font-semibold">Café Orilla</div><div className="text-[9.5px] text-verde font-medium">En su portal</div></div>
      </div>
      <div className="flex-1 space-y-2 pt-3 text-[11px]">
        <div className="max-w-[78%] bg-surface rounded-[16px] rounded-bl-[5px] px-3 py-2">¿Me mandas la parrilla de diciembre?</div>
        <div className="max-w-[78%] ml-auto bg-brand text-white rounded-[16px] rounded-br-[5px] px-3 py-2">¡Lista! Ya te llegó para aprobar.</div>
        <div className="max-w-[78%] bg-surface rounded-[16px] rounded-bl-[5px] px-3 py-2">Aprobada. Me encantó el reel.</div>
        <div className="mx-auto w-fit"><StatusPill status="aprobado" label="Parrilla aprobada" /></div>
      </div>
      <div className="h-10 rounded-full bg-surface flex items-center px-3 text-[10.5px] text-faint">Escribe un mensaje…</div>
    </div>
  );
}

/* Tarjetas flotantes tipo notificación */
export function Toast({ mood, color, tint, title, sub, className }:
  { mood: Parameters<typeof Lia>[0]["mood"]; color: string; tint: string; title: string; sub: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 bg-white rounded-[20px] pl-2.5 pr-4 py-2.5 shadow-[0_14px_40px_rgba(34,26,58,.14)] border border-line", className)}>
      <span className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: tint }}><Lia size={24} mood={mood} color={color} /></span>
      <div><div className="text-[13px] font-semibold leading-tight whitespace-nowrap">{title}</div><div className="text-[11.5px] text-muted whitespace-nowrap">{sub}</div></div>
    </div>
  );
}

/* Mini calendario de parrilla */
export function CalendarCard() {
  const items: Record<number, [string, string]> = { 3: ["#CDF2DF", "Reel verano"], 5: ["#DCE3FF", "Carrusel tips"], 9: ["#FFDCEB", "Promo 2x1"], 12: ["#E7DEFF", "Historia"], 16: ["#CDF2DF", "Lanzamiento"], 18: ["#FFF1C2", "Brief nuevo"] };
  return (
    <div className="bg-white rounded-[24px] border border-line p-4 shadow-[0_20px_60px_rgba(34,26,58,.10)] w-full max-w-[420px]">
      <div className="flex items-center justify-between mb-3"><div className="font-semibold text-[14px]">Diciembre</div><div className="text-[11px] text-muted">Café Orilla</div></div>
      <div className="grid grid-cols-7 gap-1 text-[9px] text-muted text-center mb-1">{["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }, (_, i) => i + 1).map((d) => (
          <div key={d} className="h-[46px] rounded-[10px] bg-surface p-1 overflow-hidden">
            <div className="text-[9px] text-muted font-medium">{d}</div>
            {items[d] && <div className="mt-0.5 rounded-[6px] px-1 py-0.5 text-[7.5px] font-semibold truncate" style={{ background: items[d][0] }}>{items[d][1]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Mini cuenta de cobro */
export function InvoiceCard() {
  return (
    <div className="relative bg-white rounded-[24px] border border-line p-6 shadow-[0_20px_60px_rgba(34,26,58,.10)] w-full max-w-[360px] min-w-[260px] text-[12px]">
      <div className="text-muted text-[10px]">Cuenta de cobro</div>
      <div className="text-[24px] font-semibold tracking-tight">N.º 014</div>
      <div className="mt-3 text-center"><div className="text-[9px] tracking-[.3em] text-muted">DEBE A</div><div className="font-semibold text-[13px]">Carolina Ríos</div><div className="text-muted text-[10px]">C.C. 1.045.678.901</div></div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between"><span>Parrilla diciembre (12 piezas)</span><b>$ 900.000</b></div>
        <div className="flex justify-between"><span>Sesión de fotos</span><b>$ 300.000</b></div>
      </div>
      <div className="mt-3 pt-3 border-t border-line flex justify-between items-end"><span className="text-muted text-[10px]">Total</span><span className="text-[20px] font-bold">$ 1.200.000</span></div>
      <div className="absolute -right-4 -top-4 rotate-12 rounded-full bg-verde text-ink font-bold text-[13px] px-4 py-2 shadow-lg anim-pop inline-flex items-center gap-1"><Icon name="check" className="size-4" strokeWidth={2.6} /> Pagada</div>
    </div>
  );
}
