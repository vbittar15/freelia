import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ClientForm, ErrorNote } from "../../../_forms";
import type { Client } from "@/lib/types";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireCreative();
  const { data } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!data) notFound();
  const client = data as Client;
  return (
    <>
      <PageHeader title="Editar cliente" back={{ href: `/panel/clientes/${id}`, label: client.company || client.name }} />
      <ErrorNote error={error} />
      <ClientForm client={client} />
    </>
  );
}
