import { PageHeader } from "@/components/ui";
import { ClientForm, ErrorNote } from "../../_forms";

export const metadata = { title: "Nuevo cliente" };

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Nuevo cliente" back={{ href: "/panel/clientes", label: "Clientes" }} />
      <ErrorNote error={error} />
      <ClientForm />
    </>
  );
}
