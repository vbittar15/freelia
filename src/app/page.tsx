import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo, Lia } from "@/components/brand";

const FEATURES = [
  { t: "Clientes y briefs", d: "Cada cliente con su ficha, sus briefs y su historial. Tus clientes también pueden enviarte solicitudes.", bg: "bg-cielo" },
  { t: "Parrilla y aprobaciones", d: "Planea el contenido en calendario y envíalo a aprobar. El cliente aprueba o pide cambios con un clic.", bg: "bg-lavanda" },
  { t: "Cotizaciones y cobros", d: "Cotizaciones que el cliente acepta en línea y cuentas de cobro listas para descargar en PDF.", bg: "bg-menta" },
  { t: "Chat y notificaciones", d: "Toda la conversación con cada cliente en un solo lugar, con avisos en tiempo real.", bg: "bg-mantequilla" },
];

export default async function Home() {
  const { profile } = await getSession();
  if (profile) redirect(profile.role === "client" ? "/cliente" : "/panel");

  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Link href="/ingresar" className="btn btn-ghost">Ingresar</Link>
          <Link href="/registro" className="btn btn-primary">Empezar gratis</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <span className="badge bg-brand-soft text-brand">Para freelancers creativos y agencias</span>
          <h1 className="mt-5 text-[40px] sm:text-[52px] leading-[1.05] font-semibold tracking-tight">
            Crea más. Persigue menos<span className="text-brand">.</span>
          </h1>
          <p className="mt-5 text-[16px] text-muted max-w-lg leading-relaxed">
            Freelia reúne briefs, parrilla de contenido, aprobaciones, cotizaciones, cobros y chat con tus clientes.
            Un solo lugar, tranquilo y ordenado, para tu trabajo creativo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/registro" className="btn btn-primary h-12 px-6">Crear mi espacio</Link>
            <Link href="/ingresar" className="btn btn-soft h-12 px-6">Ya tengo cuenta</Link>
          </div>
        </div>
        <div className="relative h-80 hidden lg:block">
          <div className="absolute right-6 top-0 size-64 rounded-full bg-lavanda" />
          <div className="absolute left-4 bottom-0 size-48 rounded-full bg-cielo" />
          <div className="absolute right-0 bottom-6 card p-4 w-60 shadow-sm">
            <div className="text-[11px] text-muted">Bratelli · Instagram</div>
            <div className="font-medium mt-1">Lanzamiento sabor maracuyá</div>
            <div className="mt-3 flex gap-2"><span className="badge bg-menta text-[#2c7a57]"><span className="dot" />Aprobado</span></div>
          </div>
          <div className="absolute left-10 top-10 card p-4 w-52 shadow-sm">
            <div className="text-[11px] text-muted">Cotización #12</div>
            <div className="font-semibold text-[18px] mt-1">$ 2.400.000</div>
            <div className="text-[11px] text-[#2c7a57] mt-1">✓ Aceptada por el cliente</div>
          </div>
          <Lia size={72} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f) => (
          <div key={f.t} className={`${f.bg} rounded-2xl p-6`}>
            <h3 className="font-medium">{f.t}</h3>
            <p className="text-muted mt-2 leading-relaxed text-[13px]">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-line py-8 text-center text-muted text-[12px]">
        © {new Date().getFullYear()} Freelia<span className="text-brand">.</span>
      </footer>
    </div>
  );
}
