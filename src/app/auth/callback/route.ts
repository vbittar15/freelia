import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recibe el enlace de confirmación de correo de Supabase
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      return NextResponse.redirect(`${origin}${p?.role === "client" ? "/cliente" : "/panel"}`);
    }
  }
  return NextResponse.redirect(`${origin}/ingresar?error=${encodeURIComponent("El enlace no es válido o ya expiró")}`);
}
