import { requireCreative } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import type { Package, Service } from "@/lib/types";
import { ClientForm, ErrorNote } from "../../_forms";

export const metadata = { title: "Nuevo cliente" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireCreative();
  const [{ data: sd }, { data: pd }] = await Promise.all([
    supabase.from("services").select("*").eq("active", true).order("position"),
    supabase.from("packages").select("*").eq("active", true).order("position"),
  ]);
  return (
    <>
      <PageHeader title="Nuevo cliente" back={{ href: "/panel/clientes", label: "Clientes" }} />
      <ErrorNote error={error} />
      <ClientForm services={(sd ?? []) as Service[]} packages={(pd ?? []) as Package[]} />
    </>
  );
}
