import { notFound } from "next/navigation";
import { requireCreative } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ClientForm, ErrorNote } from "../../../_forms";
import type { Client, ClientService, Package, Service } from "@/lib/types";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireCreative();
  const [{ data }, { data: sd }, { data: pd }, { data: ld }, { count }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("services").select("*").eq("active", true).order("position"),
    supabase.from("packages").select("*").eq("active", true).order("position"),
    supabase.from("client_services").select("*").eq("client_id", id).order("position"),
    supabase.from("contracts").select("id", { count: "exact", head: true }).eq("client_id", id).eq("status", "borrador"),
  ]);
  if (!data) notFound();
  const client = data as Client;
  return (
    <>
      <PageHeader title="Editar cliente" back={{ href: `/panel/clientes/${id}`, label: client.company || client.name }} />
      <ErrorNote error={error} />
      <ClientForm client={client} services={(sd ?? []) as Service[]} packages={(pd ?? []) as Package[]}
        lines={(ld ?? []) as ClientService[]} hasDraft={!!count} />
    </>
  );
}
