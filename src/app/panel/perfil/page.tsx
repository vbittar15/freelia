import { requireCreative } from "@/lib/auth";
import { NotifyCard } from "@/components/pwa";
import { Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { updateProfile } from "../actions";
import { signOut } from "@/app/(auth)/actions";

export const metadata = { title: "Mi perfil" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { profile } = await requireCreative();
  return (
    <>
      <PageHeader title="Mi perfil" subtitle="Estos datos aparecen en tus cotizaciones y cuentas de cobro." />
      {ok && <p className="mb-5 rounded-[18px] bg-verde-t text-ink px-4 py-3 text-[14px] max-w-3xl">Perfil actualizado.</p>}
      <form action={updateProfile} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
        <Field label="Nombre completo"><input name="full_name" className="input" defaultValue={profile.full_name ?? ""} /></Field>
        <Field label="Nombre comercial / marca"><input name="business_name" className="input" defaultValue={profile.business_name ?? ""} /></Field>
        <Field label="Cédula o NIT"><input name="document_id" className="input" defaultValue={profile.document_id ?? ""} /></Field>
        <Field label="Ciudad"><input name="city" className="input" defaultValue={profile.city ?? ""} placeholder="Barranquilla" /></Field>
        <Field label="Teléfono"><input name="phone" className="input" defaultValue={profile.phone ?? ""} /></Field>
        <Field label="Correo"><input className="input bg-surface" value={profile.email} disabled /></Field>
        <Field label="Datos bancarios" className="sm:col-span-2" hint="Aparecen en tus cuentas de cobro.">
          <textarea name="bank_info" rows={3} className="input" defaultValue={profile.bank_info ?? ""} placeholder={"Bancolombia · Ahorros\nN.º 000-000000-00\nA nombre de …"} />
        </Field>
        <div className="sm:col-span-2 flex justify-end"><SubmitButton>Guardar</SubmitButton></div>
      </form>
      <div className="mt-6 max-w-3xl"><NotifyCard /></div>
      <form action={signOut} className="mt-6"><button className="btn btn-ghost btn-sm">Cerrar sesión</button></form>
    </>
  );
}
