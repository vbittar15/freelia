import Link from "next/link";
import { signIn } from "../actions";
import { SubmitButton } from "@/components/client-ui";
import { Field } from "@/components/ui";

export const metadata = { title: "Ingresar" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">Hola de nuevo</h1>
      <p className="text-muted mt-1">Ingresa a tu espacio en Freelia.</p>

      {sp.error && <p className="mt-6 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{sp.error}</p>}
      {sp.aviso && <p className="mt-6 rounded-[18px] bg-verde-t text-ink px-4 py-3 text-[14px]">{sp.aviso}</p>}

      <form action={signIn} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <Field label="Correo">
          <input className="input" type="email" name="email" required defaultValue={sp.email} autoComplete="email" />
        </Field>
        <Field label="Contraseña">
          <input className="input" type="password" name="password" required autoComplete="current-password" />
        </Field>
        <SubmitButton className="btn btn-primary w-full" pendingText="Ingresando…">Ingresar</SubmitButton>
      </form>

      <p className="mt-6 text-center text-muted text-[13px]">
        ¿No tienes cuenta? <Link href="/registro" className="text-brand font-medium">Crear cuenta</Link>
      </p>
    </>
  );
}
