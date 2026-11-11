import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Lia, Logo, Trazo } from "@/components/brand";
import { Field, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/client-ui";
import { acceptInvite, signUp } from "@/app/(auth)/actions";

export const metadata = { title: "Invitación" };

type Info = { client_name: string; company: string | null; creative_name: string | null; linked: boolean };

export default async function Page({ params, searchParams }:
  { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; email?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const valid = /^[0-9a-f-]{36}$/i.test(token);
  const { data } = valid ? await supabase.rpc("invite_info", { p_token: token }) : { data: null };
  const info = (data as Info[] | null)?.[0];
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col">
      <Link href="/" className="px-2"><Logo size={26} /></Link>
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md">
          {!info ? (
            <div className="card px-6 py-12 text-center flex flex-col items-center">
              <Lia size={80} mood="worry" color="#FF7EB6" />
              <h1 className="h1 mt-5">Este enlace no funciona</h1>
              <p className="text-muted mt-2">Puede que lo hayan cambiado por uno nuevo. Pídele a tu equipo creativo que te lo envíe otra vez.</p>
            </div>
          ) : info.linked && !user ? (
            <div className="card px-6 py-12 text-center flex flex-col items-center">
              <Lia size={80} mood="happy" color="#2FBF7A" />
              <h1 className="h1 mt-5">Ya tienes tu portal</h1>
              <p className="text-muted mt-2">Esta invitación ya se usó. Ingresa con tu cuenta.</p>
              <Link href="/ingresar?next=/cliente" className="btn btn-primary btn-lg mt-6">Ingresar</Link>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[32px] bg-azul-t px-6 pt-7 pb-8 mb-6">
                <div className="absolute -right-6 -bottom-8"><Lia size={110} mood="peek" /></div>
                <div className="relative pr-20">
                  <div className="text-[13px] font-medium text-muted">{info.creative_name} te invita</div>
                  <h1 className="h1 mt-1">Hola, {info.client_name.split(" ")[0]}.</h1>
                  <p className="text-[16px] leading-[25px] mt-1.5">Este es <Trazo>tu portal</Trazo> para aprobar piezas, ver cobros y hablar con tu equipo.</p>
                </div>
              </div>

              {sp.error && <Notice tone="error">{sp.error}</Notice>}

              {user ? (
                <form action={acceptInvite} className="card p-6 text-center">
                  <input type="hidden" name="token" value={token} />
                  <p className="text-[15px]">Estás en Freelia como <b>{user.email}</b>.</p>
                  <SubmitButton className="btn btn-primary btn-lg w-full mt-5" pendingText="Conectando…">Conectar a mi portal</SubmitButton>
                </form>
              ) : (
                <form action={signUp} className="card p-6 space-y-4">
                  <input type="hidden" name="invite" value={token} />
                  <h2 className="h2">Crea tu cuenta</h2>
                  <Field label="Tu nombre"><input className="input" name="full_name" required defaultValue={info.client_name} autoComplete="name" /></Field>
                  <Field label="Correo"><input className="input" type="email" name="email" required defaultValue={sp.email} autoComplete="email" /></Field>
                  <Field label="Contraseña" hint="Mínimo 8 caracteres."><input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" /></Field>
                  <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Creando tu portal…">Entrar a mi portal</SubmitButton>
                  <p className="text-center text-[13px] text-muted">
                    ¿Ya tienes cuenta en Freelia? <Link href={`/ingresar?next=/invitacion/${token}`} className="text-brand-dark font-semibold">Ingresa</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
