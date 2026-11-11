import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo, Lia, Sparkle, StatusPill, Trazo, type LiaMood } from "@/components/brand";

const FEATURES: { t: string; d: string; tint: string; dot: string; mood: LiaMood }[] = [
  { t: "Clientes y briefs", d: "Cada cliente con su ficha, sus briefs y su historial. Tus clientes también pueden enviarte pedidos.", tint: "#FFF1C2", dot: "#FFC93C", mood: "idea" },
  { t: "Parrilla y aprobaciones", d: "Planea el contenido y envíalo a aprobar. El cliente aprueba o pide cambios con un toque.", tint: "#DCE3FF", dot: "#3D5BF5", mood: "right" },
  { t: "Cotizaciones y cobros", d: "Cotizaciones que el cliente acepta en línea y cuentas de cobro listas en PDF.", tint: "#CDF2DF", dot: "#2FBF7A", mood: "happy" },
  { t: "Chat y avisos", d: "Toda la conversación con cada cliente en un solo lugar, con avisos al instante.", tint: "#E7DEFF", dot: "#A98BFF", mood: "smile" },
];

export default async function Home() {
  const { profile } = await getSession();
  if (profile) redirect(profile.role === "client" ? "/cliente" : "/panel");

  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        <Logo size={28} />
        <div className="flex gap-2">
          <Link href="/ingresar" className="btn btn-ghost">Ingresar</Link>
          <Link href="/registro" className="btn btn-primary">Empezar gratis</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-[36px] bg-azul-t px-7 sm:px-14 pt-14 pb-16 sm:py-20">
          <Sparkle size={18} className="absolute right-[34%] top-[18%]" />
          <Sparkle size={11} color="#A98BFF" className="absolute right-[31%] top-[25%]" />
          <span className="eyebrow">Para freelancers creativos y agencias</span>
          <h1 className="mt-3 text-[42px] sm:text-[60px] leading-[1.04] font-semibold tracking-[-0.035em] max-w-2xl">
            Crea más.<br /><Trazo>Persigue menos.</Trazo>
          </h1>
          <p className="mt-5 text-[17px] leading-[27px] max-w-lg text-ink/80">
            Brief, cotización, parrilla, aprobaciones y cobro con tus clientes en un solo lugar. Tranquilo, ordenado y tuyo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 relative z-10">
            <Link href="/registro" className="btn btn-primary btn-lg">Crear mi espacio</Link>
            <Link href="/ingresar" className="btn btn-lg bg-white text-ink hover:bg-surface">Ya tengo cuenta</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-2 max-w-md relative z-10">
            <StatusPill status="nuevo" label="Brief" /><StatusPill status="en_revision" /><StatusPill status="aprobado" /><StatusPill status="pagada" label="Cobrado" />
          </div>
          <div className="absolute -right-12 -bottom-16 hidden sm:block"><Lia size={300} mood="smile" /></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((f) => (
          <div key={f.t} className="rounded-[24px] p-6" style={{ background: f.tint }}>
            <Lia size={40} mood={f.mood} color={f.dot} />
            <h3 className="mt-4 font-semibold text-[16px]">{f.t}</h3>
            <p className="text-ink/75 mt-1.5 leading-relaxed text-[14px]">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="pb-10 text-center text-muted text-[12px] flex items-center justify-center gap-2">
        <Logo size={16} /> <span>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
