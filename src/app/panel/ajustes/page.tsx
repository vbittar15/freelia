import Link from "next/link";
import { requireCreative } from "@/lib/auth";
import { Notice, PageHeader } from "@/components/ui";
import { ConfirmSubmit, SubmitButton } from "@/components/client-ui";
import { RubroPicker } from "@/components/rubro-picker";
import { PackageForm } from "@/components/package-form";
import { MyBrandFields } from "@/components/brand-editor";
import { Lia } from "@/components/brand";
import type { Package, Service } from "@/lib/types";
import { RUBROS, UNITS, rubroMap, suggestedServices, usesSocial, withDefaults } from "@/lib/rubros";
import { NETWORKS, cn, money } from "@/lib/utils";
import { saveMyBrand, addSuggested, deletePackage, deleteService, savePackage, saveService, saveSettings, saveSpecialties } from "./actions";
import { Icon, IconTile } from "@/components/icons";

export const metadata = { title: "Ajustes" };

const TABS = [
  { key: "negocio", label: "Mi negocio" },
  { key: "servicios", label: "Servicios" },
  { key: "paquetes", label: "Paquetes" },
  { key: "cotizaciones", label: "Cotizaciones y cobros" },
  { key: "parrilla", label: "Parrilla" },
];

type SP = { tab?: string; ok?: string; error?: string; editar?: string };

function ServiceFields({ sv, rubros }: { sv?: Service; rubros: string[] }) {
  return (
    <>
      {sv && <input type="hidden" name="id" value={sv.id} />}
      <div className="grid sm:grid-cols-[1fr_150px_150px] gap-3">
        <label className="block"><span className="label">Servicio *</span>
          <input name="name" required defaultValue={sv?.name} className="input" placeholder="Ej. Pieza gráfica para redes" /></label>
        <label className="block"><span className="label">Precio (COP)</span>
          <input name="price" type="number" min={0} step={1000} defaultValue={sv?.price ?? ""} className="input" placeholder="80000" /></label>
        <label className="block"><span className="label">Se cobra</span>
          <select name="unit" defaultValue={sv?.unit ?? "proyecto"} className="input">
            {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
      </div>
      <div className="grid sm:grid-cols-[1fr_220px] gap-3">
        <label className="block"><span className="label">Descripción (aparece en la cotización)</span>
          <input name="description" defaultValue={sv?.description ?? ""} className="input" placeholder="Qué incluye" /></label>
        <label className="block"><span className="label">Rubro</span>
          <select name="category" defaultValue={sv?.category ?? rubros[0] ?? ""} className="input">
            <option value="">Sin rubro</option>
            {RUBROS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select></label>
      </div>
    </>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "negocio";
  const { supabase, profile, user } = await requireCreative();
  const rubros = profile.specialties ?? [];
  const settings = withDefaults(profile.settings);
  const [{ data: sd }, { data: pd }] = await Promise.all([
    supabase.from("services").select("*").order("position"),
    supabase.from("packages").select("*").order("position"),
  ]);
  const services = (sd ?? []) as Service[];
  const packages = (pd ?? []) as Package[];
  const have = new Set(services.map((x) => x.name.toLowerCase()));
  const missing = suggestedServices(rubros).filter((x) => !have.has(x.name.toLowerCase()));

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Define cómo trabajas: rubros, servicios, paquetes, precios y valores por defecto." />

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto mb-6">
        <div className="flex gap-1 w-max rounded-full bg-surface p-1">
          {TABS.map((t) => (
            <Link key={t.key} href={`/panel/ajustes?tab=${t.key}`} scroll={false}
              className={cn("btn btn-sm whitespace-nowrap", tab === t.key ? "bg-white shadow-sm text-ink" : "text-muted font-medium")}>
              {t.label}{t.key === "servicios" && services.length ? ` · ${services.length}` : t.key === "paquetes" && packages.length ? ` · ${packages.length}` : ""}
            </Link>
          ))}
        </div>
      </div>

      {sp.ok && <div className="mb-5"><Notice tone="ok">{sp.ok}</Notice></div>}
      {sp.error && <div className="mb-5"><Notice tone="error">{sp.error}</Notice></div>}

      {tab === "negocio" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <form action={saveSpecialties} className="card p-5 sm:p-6">
            <h2 className="h2">¿A qué te dedicas?</h2>
            <p className="text-[14px] text-muted mt-1 mb-4">Adapta tus servicios sugeridos, los formatos de pieza y cómo se llama tu sección de trabajo ({usesSocial(rubros) ? "Parrilla" : "Entregas"}).</p>
            <RubroPicker initial={rubros} compact />
            <div className="mt-4 flex justify-end"><SubmitButton>Guardar rubros</SubmitButton></div>
          </form>
          <aside className="space-y-4">
            <form action={saveMyBrand} className="card p-5">
              <div className="font-semibold">Tu marca en documentos</div>
              <p className="text-[13px] text-muted mt-1 mb-3">Tu logo y color salen en cotizaciones, cuentas de cobro y contratos.</p>
              <MyBrandFields userId={user.id} logo={profile.logo_url} color={profile.brand_color} />
              <SubmitButton className="btn btn-soft btn-sm mt-3">Guardar mi marca</SubmitButton>
            </form>
            <div className="rounded-[22px] bg-azul-t p-5">
              <div className="flex gap-3 items-center"><Lia size={40} mood="smile" /><div className="font-semibold">Recorrido por Freelia</div></div>
              <p className="text-[13px] text-muted mt-2">Vuelve a ver cómo funciona cada sección, explicada por Lia.</p>
              <Link href="/panel?tour=1" className="btn btn-primary btn-sm mt-3">Ver el recorrido</Link>
            </div>
            <div className="card p-5">
              <div className="font-semibold">Datos de tu marca</div>
              <p className="text-[13px] text-muted mt-1">Nombre comercial, NIT o cédula, ciudad y datos bancarios para tus cuentas de cobro.</p>
              <Link href="/panel/perfil" className="btn btn-soft btn-sm mt-3">Editar en Mi perfil</Link>
            </div>
          </aside>
        </div>
      )}

      {tab === "servicios" && (
        <div className="space-y-6">
          {missing.length > 0 && (
            <section className="rounded-[22px] bg-amarillo-t p-5">
              <div className="flex gap-3 items-start">
                <Lia size={38} mood="idea" color="#FFC93C" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Sugeridos para {rubros.map((k) => rubroMap[k]?.short).filter(Boolean).join(", ")}</div>
                  <p className="text-[13px] text-muted">Precios de referencia. Agrégalos y luego ajústalos a tu tarifa.</p>
                </div>
              </div>
              <form action={addSuggested} className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {missing.map((x) => (
                    <label key={x.name} className="inline-flex items-center gap-2 rounded-full bg-white pl-3 pr-3.5 py-1.5 text-[13px] cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-brand">
                      <input type="checkbox" name="names" value={x.name} defaultChecked className="size-3.5 accent-[#3d5bf5]" />
                      {x.name} <span className="text-muted">{money(x.price)}</span>
                    </label>
                  ))}
                </div>
                <SubmitButton className="btn btn-primary btn-sm mt-3">Agregar seleccionados</SubmitButton>
              </form>
            </section>
          )}

          <details className="card p-5 sm:p-6 group" open={services.length === 0 && missing.length === 0}>
            <summary className="cursor-pointer list-none flex items-center justify-between font-semibold">+ Nuevo servicio <span className="text-muted group-open:rotate-45 transition-transform text-[20px] leading-none">+</span></summary>
            <form action={saveService} className="mt-4 grid gap-3">
              <ServiceFields rubros={rubros} />
              <div className="flex justify-end"><SubmitButton>Agregar servicio</SubmitButton></div>
            </form>
          </details>

          {services.length > 0 && (
            <div className="flex flex-col gap-2 stagger">
              {services.map((sv) => sp.editar === sv.id ? (
                <form key={sv.id} action={saveService} className="card p-5 grid gap-3 ring-2 ring-brand">
                  <ServiceFields sv={sv} rubros={rubros} />
                  <div className="flex gap-2 justify-end">
                    <Link href="/panel/ajustes?tab=servicios" className="btn btn-ghost">Cancelar</Link>
                    <SubmitButton>Guardar</SubmitButton>
                  </div>
                </form>
              ) : (
                <div key={sv.id} className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-3">
                  <IconTile name={rubroMap[sv.category ?? ""]?.icon ?? "file"} tint={rubroMap[sv.category ?? ""]?.tint ?? "gris"} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[15px] truncate">{sv.name}</div>
                    <div className="text-[13px] text-muted truncate">{sv.description || rubroMap[sv.category ?? ""]?.label || "Servicio"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{money(sv.price)}</div>
                    <div className="text-[12px] text-muted">{UNITS[sv.unit] ?? sv.unit}</div>
                  </div>
                  <div className="flex shrink-0">
                    <Link href={`/panel/ajustes?tab=servicios&editar=${sv.id}`} scroll={false} className="btn btn-ghost btn-sm !px-2.5" aria-label={`Editar ${sv.name}`}><Icon name="pencil" className="size-4" /></Link>
                    <form action={deleteService}><input type="hidden" name="id" value={sv.id} />
                      <ConfirmSubmit message={`¿Eliminar "${sv.name}"?`} className="btn btn-ghost btn-sm !px-2.5"><Icon name="trash" className="size-4" /></ConfirmSubmit></form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "paquetes" && (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
          <section className="card p-5 sm:p-6">
            <h2 className="h2 mb-1">{sp.editar ? "Editar paquete" : "Nuevo paquete"}</h2>
            <p className="text-[13px] text-muted mb-4">Combina servicios con un precio especial, por ejemplo un plan mensual de redes.</p>
            <PackageForm key={sp.editar ?? "nuevo"} action={savePackage} services={services}
              pkg={packages.find((p) => p.id === sp.editar)} onCancelHref={sp.editar ? "/panel/ajustes?tab=paquetes" : undefined} />
          </section>
          <section className="space-y-3">
            {packages.length === 0 ? (
              <div className="rounded-[22px] bg-surface p-6 text-center">
                <div className="flex justify-center"><Lia size={52} mood="sleep" color="#A98BFF" /></div>
                <p className="mt-3 text-muted text-[14px]">Aún no tienes paquetes. Los paquetes aparecen al cotizar como una sola línea.</p>
              </div>
            ) : packages.map((p) => (
              <div key={p.id} className="rounded-[22px] bg-lila-t p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[16px]">{p.name}</div>
                    {p.description && <p className="text-[13px] text-muted mt-0.5">{p.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-[18px] tracking-tight">{money(p.price)}</div>
                    <div className="text-[12px] text-muted">{p.period === "mensual" ? "al mes" : "pago único"}</div>
                  </div>
                </div>
                <ul className="mt-3 text-[13px] space-y-0.5">{p.items.map((i) => <li key={i.name}>· {i.qty} × {i.name}</li>)}</ul>
                <div className="mt-3 flex gap-1">
                  <Link href={`/panel/ajustes?tab=paquetes&editar=${p.id}`} scroll={false} className="btn btn-sm bg-white text-ink">Editar</Link>
                  <form action={deletePackage}><input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmit message={`¿Eliminar el paquete "${p.name}"?`} className="btn btn-ghost btn-sm">Eliminar</ConfirmSubmit></form>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === "cotizaciones" && (
        <form action={saveSettings} className="card p-5 sm:p-6 grid gap-5 max-w-3xl">
          <input type="hidden" name="tab" value="cotizaciones" />
          <div>
            <h2 className="h2">Cotizaciones</h2>
            <p className="text-[13px] text-muted mt-1">Se llenan solos al crear una cotización nueva.</p>
          </div>
          <label className="block max-w-[220px]"><span className="label">Validez (días)</span>
            <input name="quote_valid_days" type="number" min={1} max={365} defaultValue={settings.quote_valid_days} className="input" /></label>
          <label className="block"><span className="label">Condiciones y notas por defecto</span>
            <textarea name="quote_notes" rows={4} defaultValue={settings.quote_notes} className="input" /></label>
          <div className="border-t border-line pt-5">
            <h2 className="h2">Cuentas de cobro</h2>
          </div>
          <label className="block max-w-[220px]"><span className="label">Plazo de pago (días)</span>
            <input name="invoice_due_days" type="number" min={0} max={365} defaultValue={settings.invoice_due_days} className="input" /></label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <label className="block"><span className="label">IVA por defecto (%)</span>
              <input name="tax_rate" type="number" min={0} max={30} defaultValue={settings.tax_rate} className="input" /></label>
            <label className="block"><span className="label">Retención por defecto (%)</span>
              <input name="withholding_rate" type="number" min={0} max={20} defaultValue={settings.withholding_rate} className="input" /></label>
          </div>
          <label className="block"><span className="label">Nota por defecto</span>
            <textarea name="invoice_notes" rows={3} defaultValue={settings.invoice_notes} className="input" /></label>
          <div className="flex justify-end"><SubmitButton>Guardar preferencias</SubmitButton></div>
        </form>
      )}

      {tab === "parrilla" && (
        <form action={saveSettings} className="card p-5 sm:p-6 grid gap-5 max-w-3xl">
          <input type="hidden" name="tab" value="parrilla" />
          <div>
            <h2 className="h2">Redes y canales que manejas</h2>
            <p className="text-[13px] text-muted mt-1">Aparecen primero al crear una {usesSocial(rubros) ? "pieza" : "entrega"}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(NETWORKS).map(([k, v]) => (
              <label key={k} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[14px] cursor-pointer has-[:checked]:bg-brand has-[:checked]:text-white transition-colors">
                <input type="checkbox" name="networks" value={k} defaultChecked={settings.networks.includes(k)} className="sr-only" />{v}
              </label>
            ))}
          </div>
          <label className="block max-w-[260px]"><span className="label">Rondas de cambios incluidas</span>
            <input name="rounds_included" type="number" min={0} max={10} defaultValue={settings.rounds_included} className="input" />
            <span className="block text-[12px] text-muted mt-1 px-1">Te avisamos cuando una pieza las supere.</span></label>
          <div className="flex justify-end"><SubmitButton>Guardar preferencias</SubmitButton></div>
        </form>
      )}
    </>
  );
}
