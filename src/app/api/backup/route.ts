import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "clients", "briefs", "posts", "post_comments", "review_requests",
  "quotes", "quote_items", "invoices", "invoice_items", "messages",
] as const;

/** Copia de seguridad: todos los datos que el usuario puede ver (según RLS) */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const out: Record<string, unknown[]> = {};
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  out.perfil = profile ? [profile] : [];
  for (const t of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(t).select("*").range(from, from + 999);
      if (error || !data?.length) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    out[t] = rows;
  }
  return NextResponse.json({ app: "Freelia", version: 1, exported_at: new Date().toISOString(), user: user.email, data: out },
    { headers: { "Cache-Control": "no-store" } });
}
