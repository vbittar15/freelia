import { requireClient } from "@/lib/auth";
import { Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { updateClientProfile } from "../actions";
import { signOut } from "@/app/(auth)/actions";

export const metadata = { title: "Mi perfil" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { profile } = await requireClient();
  return (
    <>
      <PageHeader title="Mi perfil" />
      {ok && <p className="mb-5 rounded-xl bg-menta text-[#2c7a57] px-4 py-3 text-[13px] max-w-xl">Perfil actualizado.</p>}
      <form action={updateClientProfile} className="card p-6 grid gap-4 max-w-xl">
        <Field label="Nombre"><input name="full_name" className="input" defaultValue={profile.full_name ?? ""} /></Field>
        <Field label="Teléfono"><input name="phone" className="input" defaultValue={profile.phone ?? ""} /></Field>
        <Field label="Correo"><input className="input bg-surface" value={profile.email} disabled /></Field>
        <div className="flex justify-end"><SubmitButton>Guardar</SubmitButton></div>
      </form>
      <form action={signOut} className="mt-6"><button className="btn btn-ghost btn-sm">Cerrar sesión</button></form>
    </>
  );
}
