import { requireClient } from "@/lib/auth";
import { NotifyCard } from "@/components/pwa";
import { Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { updateClientProfile } from "../actions";
import { deleteAccount, signOut } from "@/app/(auth)/actions";
import { DeleteAccount } from "@/components/delete-account";
import { BackupCard } from "@/components/backup-card";

export const metadata = { title: "Mi perfil" };

export default async function Page({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const { profile } = await requireClient();
  return (
    <>
      <PageHeader title="Mi perfil" />
      {ok && <p className="mb-5 rounded-[18px] bg-verde-t text-ink px-4 py-3 text-[14px] max-w-xl">Perfil actualizado.</p>}
      <form action={updateClientProfile} className="card p-6 grid gap-4 max-w-xl">
        <Field label="Nombre"><input name="full_name" className="input" defaultValue={profile.full_name ?? ""} /></Field>
        <Field label="Teléfono"><input name="phone" className="input" defaultValue={profile.phone ?? ""} /></Field>
        <Field label="Correo"><input className="input bg-surface" value={profile.email} disabled /></Field>
        <div className="flex justify-end"><SubmitButton>Guardar</SubmitButton></div>
      </form>
      <div className="mt-6 max-w-3xl"><NotifyCard /></div>
      <BackupCard role="client" />
      <form action={signOut} className="mt-6"><button className="btn btn-ghost btn-sm">Cerrar sesión</button></form>
      <DeleteAccount action={deleteAccount} back="/cliente/perfil" role="client" error={error} />
    </>
  );
}
