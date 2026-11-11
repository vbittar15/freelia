import Link from "next/link";
import { Logo, Lia, Sparkle, StatusPill, Trazo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col px-6 sm:px-12 py-8">
        <Link href="/"><Logo size={28} /></Link>
        <div className="lg:hidden relative overflow-hidden rounded-[28px] bg-azul-t mt-6 px-6 py-6">
          <p className="relative z-10 text-[22px] leading-[1.15] font-semibold tracking-[-0.02em] pr-24">Crea más.<br /><Trazo>Persigue menos.</Trazo></p>
          <div className="absolute -right-5 -bottom-8"><div className="anim-peek"><div className="anim-bob"><Lia size={110} mood="smile" /></div></div></div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto py-10 on-white anim-page">{children}</div>
        </div>
      </div>
      <div className="hidden lg:block p-4">
        <div className="relative h-full overflow-hidden rounded-[36px] bg-azul-t flex flex-col justify-center px-14">
          <Sparkle size={18} className="absolute right-[30%] top-[16%]" />
          <Sparkle size={11} color="#A98BFF" className="absolute right-[26%] top-[21%]" />
          <Sparkle size={14} color="#FFC93C" className="absolute left-[14%] bottom-[22%]" />
          <h2 className="text-[44px] leading-[1.08] font-semibold tracking-[-0.03em] max-w-md">
            Crea más.<br /><Trazo>Persigue menos.</Trazo>
          </h2>
          <p className="mt-4 text-[17px] leading-[26px] text-ink/80 max-w-sm">
            Brief, cotización, parrilla, aprobaciones y cobro con tus clientes en un solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 max-w-md">
            <StatusPill status="nuevo" label="Brief" />
            <StatusPill status="cotizado" label="Cotizado" />
            <StatusPill status="en_revision" />
            <StatusPill status="aprobado" />
            <StatusPill status="pagada" label="Cobrado" />
          </div>
          <div className="absolute -right-10 -bottom-12"><div className="anim-peek"><div className="anim-bob"><Lia size={240} mood="smile" /></div></div></div>
        </div>
      </div>
    </div>
  );
}
