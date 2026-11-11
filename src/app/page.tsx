import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo, Lia, Sparkle, StatusPill, Trazo, type LiaMood } from "@/components/brand";
import { Reveal } from "@/components/reveal";
import { CalendarCard, InvoiceCard, Phone, ScreenApproval, ScreenChat, ScreenHome, Toast } from "@/components/mockups";

export const metadata = {
  title: "Freelia · Crea más. Persigue menos.",
  description: "Briefs, parrilla, aprobaciones, cotizaciones, cobros y chat con tus clientes en un solo lugar. Para freelancers creativos y agencias.",
};

const ROLES = ["Diseñadores", "Community managers", "Fotógrafos", "Ilustradores", "Copywriters", "Videógrafos", "Agencias", "Estrategas", "Content creators"];

const PAINS: { mood: LiaMood; color: string; tint: string; t: string; d: string }[] = [
  { mood: "worry", color: "#FF7EB6", tint: "#FFDCEB", t: "Aprobaciones perdidas en WhatsApp", d: "“¿Cuál era la versión final?” Audios, capturas y cambios regados en diez chats." },
  { mood: "right", color: "#3D5BF5", tint: "#DCE3FF", t: "Briefs que llegan en cinco audios", d: "La información clave se pierde y terminas adivinando qué quería el cliente." },
  { mood: "sleep", color: "#A98BFF", tint: "#E7DEFF", t: "Cobros que nadie paga a tiempo", d: "Cuentas de cobro en Word, recordatorios incómodos y meses persiguiendo pagos." },
];

const STEPS: { n: string; t: string; d: string; mood: LiaMood; color: string; tint: string }[] = [
  { n: "1", t: "Crea a tu cliente", d: "Su ficha, su color y su espacio. Todo lo de esa marca queda junto.", mood: "idea", color: "#FFC93C", tint: "#FFF1C2" },
  { n: "2", t: "Envíale su enlace", d: "Por WhatsApp o correo. Entra a su portal sin instalar nada.", mood: "right", color: "#3D5BF5", tint: "#DCE3FF" },
  { n: "3", t: "Aprueba, publica y cobra", d: "Él aprueba con un toque, tú publicas tranquila y cobras a tiempo.", mood: "happy", color: "#2FBF7A", tint: "#CDF2DF" },
];

const GESTURES: { mood: LiaMood; color: string; tint: string; l: string }[] = [
  { mood: "idea", color: "#FFC93C", tint: "#FFF1C2", l: "Idea" },
  { mood: "right", color: "#3D5BF5", tint: "#DCE3FF", l: "En revisión" },
  { mood: "happy", color: "#2FBF7A", tint: "#CDF2DF", l: "¡Aprobado!" },
  { mood: "worry", color: "#FF7EB6", tint: "#FFDCEB", l: "Alerta" },
  { mood: "smile", color: "#A98BFF", tint: "#E7DEFF", l: "Hola" },
  { mood: "sleep", color: "#B7AFC5", tint: "#EFECF4", l: "Todo en calma" },
];

const FAQ = [
  ["¿Mi cliente tiene que instalar algo?", "No. Le envías su enlace único y entra desde el navegador del celular o del computador. Ve solo lo que tú le envías."],
  ["¿Cuánto cuesta?", "Durante la beta, Freelia es gratis para freelancers. Los planes Pro y Agencia llegarán con funciones para equipos."],
  ["¿Sirve para agencias?", "Sí. Puedes manejar muchos clientes, cada uno con su parrilla, sus cotizaciones y sus cobros. Los equipos con varios creativos llegan pronto."],
  ["¿Genera facturas electrónicas?", "Por ahora genera cotizaciones y cuentas de cobro en PDF. La facturación electrónica está en el plan."],
  ["¿Mis datos están seguros?", "Cada creativo ve solo lo suyo y cada cliente solo lo que le compartes. La seguridad se controla desde la base de datos."],
];

export default async function Home() {
  const { profile } = await getSession();
  if (profile) redirect(profile.role === "client" ? "/cliente" : "/panel");

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/"><Logo size={26} /></Link>
          <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-muted">
            <a href="#funciones" className="hover:text-ink">Funciones</a>
            <a href="#lia" className="hover:text-ink">Lia</a>
            <a href="#planes" className="hover:text-ink">Planes</a>
            <a href="#preguntas" className="hover:text-ink">Preguntas</a>
          </nav>
          <div className="flex gap-1.5 sm:gap-2">
            <Link href="/ingresar" className="btn btn-ghost btn-sm sm:h-11 sm:px-5 sm:text-[15px]">Ingresar</Link>
            <Link href="/registro" className="btn btn-primary btn-sm sm:h-11 sm:px-5 sm:text-[15px]">Empezar gratis</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        <div className="relative rounded-[32px] sm:rounded-[44px] bg-azul-t overflow-hidden px-6 sm:px-12 pt-10 sm:pt-16 pb-0 lg:pb-16 grid lg:grid-cols-[1.05fr_1fr] gap-8 items-center">
          <Sparkle size={20} className="absolute left-[46%] top-[12%] hidden lg:block" />
          <Sparkle size={12} color="#A98BFF" className="absolute left-[49%] top-[19%] hidden lg:block" />
          <Sparkle size={16} color="#FFC93C" className="absolute left-[6%] bottom-[10%] hidden lg:block" />

          <div className="relative z-10 anim-page min-w-0">
            <span className="inline-flex items-center gap-2 bg-white rounded-full pl-1.5 pr-3.5 h-8 text-[12px] sm:text-[13px] font-semibold shadow-sm">
              <span className="relative flex size-5 items-center justify-center"><span className="absolute inset-0 rounded-full bg-verde anim-ping" /><span className="relative size-2.5 rounded-full bg-verde" /></span>
              Beta abierta · gratis para freelancers
            </span>
            <h1 className="mt-5 text-[38px] min-[400px]:text-[44px] sm:text-[64px] lg:text-[68px] xl:text-[72px] leading-[1.02] font-semibold tracking-[-0.04em]">
              Crea más.<br /><Trazo>Persigue menos.</Trazo>
            </h1>
            <p className="mt-5 text-[17px] sm:text-[19px] leading-[1.55] max-w-xl text-ink/80">
              El espacio de trabajo para freelancers creativos y agencias: brief, parrilla, aprobaciones, cotizaciones, cobros y chat con tus clientes en un solo lugar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/registro" className="btn btn-primary btn-lg">Crear mi espacio gratis</Link>
              <a href="#funciones" className="btn btn-lg bg-white text-ink hover:bg-surface">Ver cómo funciona</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <StatusPill status="nuevo" label="Brief" /><StatusPill status="en_revision" /><StatusPill status="aprobado" /><StatusPill status="pagada" label="Cobrado" />
            </div>
          </div>

          {/* Teléfonos */}
          <div className="relative h-[470px] sm:h-[560px] lg:h-[600px] -mx-6 sm:mx-0">
            <div className="absolute left-1/2 lg:left-[46%] -translate-x-1/2 top-4 sm:top-0 z-10 scale-[.82] sm:scale-100 origin-top">
              <div className="anim-float"><Phone><ScreenHome /></Phone></div>
            </div>
            <div className="hidden sm:block absolute right-[-30px] lg:right-[-60px] top-24 scale-[.86] origin-top-right">
              <div className="anim-float-r" style={{ animationDelay: "1.2s" }}><Phone tilt={6}><ScreenApproval /></Phone></div>
            </div>
            <Toast className="absolute z-20 left-2 sm:left-0 lg:-left-10 top-[58%] anim-float" mood="happy" color="#2FBF7A" tint="#CDF2DF" title="Estudio Brisa aprobó" sub="Reel de lanzamiento" />
            <Toast className="absolute z-20 right-2 sm:right-auto sm:left-[54%] top-[6%] hidden sm:flex anim-float-r" mood="smile" color="#A98BFF" tint="#E7DEFF" title="$ 1.200.000 pagado" sub="Cuenta de cobro 014" />
            <div className="absolute -left-4 top-10 hidden lg:block anim-bob"><Lia size={70} mood="idea" color="#FFC93C" /></div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="py-10 sm:py-14 overflow-hidden" aria-label="Para quién es">
        <div className="flex w-max gap-3 animate-[f-marquee_38s_linear_infinite] hover:[animation-play-state:paused]">
          {[...ROLES, ...ROLES].map((r, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 h-12 px-5 rounded-full bg-surface text-[15px] font-semibold whitespace-nowrap">
              <span className="size-2 rounded-full" style={{ background: ["#3D5BF5", "#FFC93C", "#2FBF7A", "#FF7EB6", "#A98BFF"][i % 5] }} />{r}
            </span>
          ))}
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">¿Te suena?</span>
          <h2 className="mt-2 text-[32px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">Tu talento es crear, no perseguir <Trazo color="#FF7EB6">aprobaciones</Trazo>.</h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {PAINS.map((p, i) => (
            <Reveal key={p.t} delay={i * 100}>
              <div className="rounded-[28px] p-7 h-full lift" style={{ background: p.tint }}>
                <div className="anim-bob w-fit" style={{ animationDelay: `${i * .6}s` }}><Lia size={64} mood={p.mood} color={p.color} /></div>
                <h3 className="mt-5 text-[19px] font-semibold leading-snug">{p.t}</h3>
                <p className="mt-2 text-ink/75 leading-relaxed">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-20 sm:space-y-28 scroll-mt-24">
        <Feature
          eyebrow="Parrilla y aprobaciones" tint="#DCE3FF"
          title={<>Envía a aprobar y recibe un <Trazo>sí</Trazo> en minutos.</>}
          text="Planea el mes en calendario, sube el arte y el copy, y envíalo. Tu cliente aprueba o pide cambios con un toque, y tú recibes el aviso al instante."
          bullets={["Calendario por cliente", "Comentarios sobre cada pieza", "Rondas de cambios a la vista"]}
          visual={
            <div className="relative w-full flex justify-center py-6">
              <CalendarCard />
              <Toast className="absolute -bottom-2 left-0 sm:-left-4 anim-float" mood="worry" color="#FF7EB6" tint="#FFDCEB" title="Pidieron cambios" sub="“¿Probamos el logo más grande?”" />
            </div>
          }
        />
        <Feature reverse
          eyebrow="Portal del cliente" tint="#E7DEFF"
          title={<>Tu cliente tiene <Trazo color="#A98BFF">su propio portal</Trazo>.</>}
          text="Con un enlace único, sin instalar nada. Ve lo que debe aprobar, sus cotizaciones y cobros, te envía pedidos y te escribe. Se acabaron los “¿me reenvías eso?”."
          bullets={["Enlace único por WhatsApp o correo", "Aprobar o pedir cambios", "Pedidos con brief guiado"]}
          visual={
            <div className="relative flex justify-center gap-4 py-4">
              <div className="scale-[.78] sm:scale-90 origin-top -mb-28 sm:-mb-14"><Phone><ScreenApproval /></Phone></div>
              <div className="hidden sm:block scale-90 origin-top -mb-14 mt-16"><Phone><ScreenChat /></Phone></div>
            </div>
          }
        />
        <Feature
          eyebrow="Cotizaciones y cobros" tint="#CDF2DF"
          title={<>Cotiza, cobra y <Trazo color="#2FBF7A">sí te pagan</Trazo>.</>}
          text="Cotizaciones que el cliente acepta en línea y se convierten en cuenta de cobro con un toque. Formato colombiano, valor en letras, tus datos bancarios y PDF listo."
          bullets={["Consecutivos automáticos", "Vencidas a la vista", "Descarga en PDF"]}
          visual={
            <div className="relative flex justify-center items-center py-6">
              <InvoiceCard />
              <Toast className="absolute -bottom-3 right-0 sm:-right-2 anim-float hidden sm:flex" mood="smile" color="#A98BFF" tint="#E7DEFF" title="Cotización aceptada" sub="Café Orilla · $ 1.200.000" />
            </div>
          }
        />
      </section>

      {/* LIA */}
      <section id="lia" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 scroll-mt-24">
        <div className="relative rounded-[32px] sm:rounded-[44px] bg-surface px-6 sm:px-12 py-12 sm:py-16 overflow-hidden">
          <Reveal className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
            <div>
              <span className="eyebrow">Conoce a Lia</span>
              <h2 className="mt-2 text-[32px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">El punto del logo, <Trazo>despierto</Trazo>.</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink/80 max-w-md">
                Lia te cuenta cómo va cada trabajo con una mirada: cuando hay una idea, cuando algo espera, cuando celebra un aprobado o cuando un cobro se vence.
              </p>
              <div className="mt-6 flex gap-3 items-end max-w-sm">
                <div className="anim-bob"><Lia size={40} /></div>
                <div className="bg-azul-t rounded-[22px] rounded-bl-[6px] px-4 py-3 text-[15px] leading-snug">Te recuerdo la cuenta de cobro 014. ¿La envío?</div>
              </div>
              <p className="mt-3 text-[13px] text-muted">Muy pronto Lia también te ayudará a escribir copys y recordar cobros.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GESTURES.map((g, i) => (
                <div key={g.l} className="rounded-[24px] p-5 flex flex-col items-center gap-3 lift anim-wiggle" style={{ background: g.tint }}>
                  <div className="anim-float" style={{ animationDelay: `${i * .4}s` }}><Lia size={72} mood={g.mood} color={g.color} /></div>
                  <span className="text-[13px] font-semibold">{g.l}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Así de simple</span>
          <h2 className="mt-2 text-[32px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">Empieza en <Trazo>tres pasos</Trazo>.</h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full rounded-[28px] border border-line p-7 lift bg-white">
                <span className="absolute top-6 right-7 text-[64px] leading-none font-black text-surface-2 select-none">{s.n}</span>
                <span className="size-14 rounded-full flex items-center justify-center" style={{ background: s.tint }}><Lia size={34} mood={s.mood} color={s.color} /></span>
                <h3 className="mt-5 text-[19px] font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted leading-relaxed">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 scroll-mt-24">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="eyebrow">Planes</span>
          <h2 className="mt-2 text-[32px] sm:text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">Gratis mientras estamos en <Trazo color="#FFC93C">beta</Trazo>.</h2>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-3 gap-4 items-stretch">
          <Plan name="Freelancer" tag="Gratis en beta" tint="#DCE3FF" highlight
            items={["Clientes ilimitados", "Parrilla y aprobaciones", "Cotizaciones y cuentas de cobro", "Portal y chat con cada cliente"]}
            cta={<Link href="/registro" className="btn btn-primary btn-lg w-full">Empezar gratis</Link>} />
          <Plan name="Pro" tag="Próximamente" tint="#E7DEFF"
            items={["Todo lo de Freelancer", "Lia con IA para copys", "Recordatorios automáticos de cobro", "Tu marca en el portal del cliente"]} />
          <Plan name="Agencia" tag="Próximamente" tint="#CDF2DF"
            items={["Todo lo de Pro", "Equipos y roles", "Varios creativos por cliente", "Reportes por cliente"]} />
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 scroll-mt-24">
        <Reveal className="text-center">
          <span className="eyebrow">Preguntas</span>
          <h2 className="mt-2 text-[32px] sm:text-[40px] leading-[1.1] font-semibold tracking-[-0.03em]">Lo que nos preguntan</h2>
        </Reveal>
        <div className="mt-8 space-y-2.5">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group card px-5 sm:px-6 py-4 open:bg-azul-t transition-colors">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[16px]">
                {q}
                <span className="size-8 rounded-full bg-white flex items-center justify-center shrink-0 transition-transform group-open:rotate-45 text-[20px] leading-none">+</span>
              </summary>
              <p className="mt-3 text-ink/80 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] bg-brand text-white px-6 sm:px-14 py-14 sm:py-20">
            <Sparkle size={20} color="#FFC93C" className="absolute right-[30%] top-10" />
            <Sparkle size={12} color="#FFFFFF" className="absolute right-[27%] top-16" />
            <div className="relative z-10 max-w-xl pb-16 sm:pb-0">
              <h2 className="text-[32px] sm:text-[52px] leading-[1.05] font-semibold tracking-[-0.035em]">Tu próximo cliente ya merece un portal.</h2>
              <p className="mt-4 text-[17px] text-white/85">Crea tu espacio en un minuto. Gratis durante la beta.</p>
              <Link href="/registro" className="btn btn-lg bg-white text-ink hover:bg-azul-t mt-8">Crear mi espacio gratis</Link>
            </div>
            <div className="absolute -right-8 -bottom-10 sm:-right-6 sm:-bottom-20 scale-[.5] sm:scale-100 origin-bottom-right"><div className="anim-bob"><Lia size={260} mood="happy" color="#FFC93C" /></div></div>
          </div>
        </Reveal>
      </section>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-muted">
        <div className="flex items-center gap-3"><Logo size={20} /><span>Crea más. Persigue menos.</span></div>
        <div>© {new Date().getFullYear()} Freelia</div>
      </footer>
    </div>
  );
}

function Feature({ eyebrow, title, text, bullets, visual, tint, reverse }:
  { eyebrow: string; title: React.ReactNode; text: string; bullets: string[]; visual: React.ReactNode; tint: string; reverse?: boolean }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center`}>
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <span className="inline-flex items-center gap-2 rounded-full h-8 px-3.5 text-[13px] font-semibold" style={{ background: tint }}>{eyebrow}</span>
        <h2 className="mt-4 text-[30px] sm:text-[42px] leading-[1.1] font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="mt-4 text-[17px] leading-relaxed text-ink/80">{text}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 font-medium">
              <span className="size-6 rounded-full bg-verde-t flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="#221A3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>{b}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={150} className={reverse ? "lg:order-1" : ""}>
        <div className="relative rounded-[32px] sm:rounded-[40px] px-4 sm:px-8 py-8 sm:py-10 overflow-hidden" style={{ background: tint }}>
          {visual}
        </div>
      </Reveal>
    </div>
  );
}

function Plan({ name, tag, items, tint, cta, highlight }:
  { name: string; tag: string; items: string[]; tint: string; cta?: React.ReactNode; highlight?: boolean }) {
  return (
    <Reveal className="h-full">
      <div className={`h-full flex flex-col rounded-[28px] p-7 lift ${highlight ? "ring-2 ring-brand" : ""}`} style={{ background: highlight ? "#FFFFFF" : tint }}>
        <div className="flex items-center justify-between">
          <h3 className="text-[22px] font-semibold">{name}</h3>
          <span className="rounded-full px-3 h-7 inline-flex items-center text-[12px] font-semibold" style={{ background: highlight ? tint : "#FFFFFF" }}>{tag}</span>
        </div>
        <ul className="mt-6 space-y-3 flex-1">
          {items.map((it) => (
            <li key={it} className="flex gap-3 text-[15px]"><span className="mt-2 size-1.5 rounded-full bg-ink shrink-0" />{it}</li>
          ))}
        </ul>
        <div className="mt-7">{cta ?? <span className="btn btn-lg w-full bg-white/70 text-muted pointer-events-none">Muy pronto</span>}</div>
      </div>
    </Reveal>
  );
}
