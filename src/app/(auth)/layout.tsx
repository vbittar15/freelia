import Link from "next/link";
import { Logo, Lia } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col px-6 sm:px-12 py-8">
        <Link href="/"><Logo size={28} /></Link>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto py-10">{children}</div>
        </div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-surface items-center justify-center">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-lavanda" />
        <div className="absolute bottom-10 -left-20 size-72 rounded-full bg-cielo" />
        <div className="absolute top-1/3 left-1/4 size-24 rounded-full bg-menta" />
        <div className="relative max-w-sm text-center px-8">
          <Lia size={96} className="mx-auto" />
          <p className="mt-8 text-[22px] font-medium leading-snug tracking-tight">
            Tu trabajo creativo, tus clientes y tus cobros en un solo lugar<span className="text-brand">.</span>
          </p>
          <p className="mt-3 text-muted">Briefs, parrilla, aprobaciones, cotizaciones y chat. Sin perseguir a nadie por WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}
