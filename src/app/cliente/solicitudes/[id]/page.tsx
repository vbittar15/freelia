import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/ui";
import { BriefView } from "@/components/brief-view";
import type { Brief } from "@/lib/types";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { id } = await params;
  const { ok } = await searchParams;
  const { supabase } = await requireClient();
  const { data } = await supabase.from("briefs").select("*").eq("id", id).single();
  if (!data) notFound();
  const b = data as Brief;
  return (
    <>
      <PageHeader back={{ href: "/cliente/solicitudes", label: "Solicitudes" }} title={b.title}
        subtitle={<span className="inline-flex mt-1"><StatusBadge status={b.status} /></span>} />
      {ok && <p className="mb-5 rounded-xl bg-menta text-[#2c7a57] px-4 py-3 text-[13px]">Solicitud enviada. Tu equipo creativo ya fue notificado.</p>}
      <BriefView brief={b} />
    </>
  );
}
