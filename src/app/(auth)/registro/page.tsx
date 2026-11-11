import Link from "next/link";
import { signUp } from "../actions";
import { SubmitButton } from "@/components/client-ui";
import { Field } from "@/components/ui";
import { RubroPicker } from "@/components/rubro-picker";

export const metadata = { title: "Crear cuenta" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const isClient = sp.rol === "cliente";
  return (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight">
        {isClient ? "Te invitaron a Freelia" : "Crea tu espacio creativo"}
      </h1>
      <p className="text-muted mt-1">
        {isClient
          ? "Crea tu cuenta para revisar piezas, aprobar contenido y hablar con tu equipo creativo."
          : "Gratis para empezar. Organiza clientes, parrilla, cotizaciones y cobros."}
      </p>

      {sp.error && <p className="mt-6 rounded-[18px] bg-rosa-t text-ink px-4 py-3 text-[14px]">{sp.error}</p>}

      <form action={signUp} className="mt-8 space-y-4">
        <input type="hidden" name="role" value={isClient ? "client" : "creative"} />
        <Field label="Tu nombre">
          <input className="input" name="full_name" required autoComplete="name" />
        </Field>
        <Field label="Correo" hint={isClient ? "Usa el mismo correo con el que te invitaron." : undefined}>
          <input className="input" type="email" name="email" required defaultValue={sp.email} autoComplete="email" />
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" />
        </Field>
        {!isClient && (
          <div>
            <span className="label">¿A qué te dedicas?</span>
            <RubroPicker initial={(sp.rubros ?? "").split(",").filter(Boolean)} />
          </div>
        )}
        <SubmitButton className="btn btn-primary w-full" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>

      <p className="mt-6 text-center text-muted text-[13px]">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="text-brand font-medium">Ingresar</Link>
      </p>
    </>
  );
}
