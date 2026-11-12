import { AppShell, type NavItem } from "@/components/app-shell";
import { requireClient } from "@/lib/auth";
import type { Client, ModuleKey } from "@/lib/types";
import { brandShades } from "@/lib/utils";

const NAV: (NavItem & { mod?: ModuleKey })[] = [
  { href: "/cliente", label: "Inicio", icon: "home", exact: true, tab: true },
  { href: "/cliente/aprobaciones", label: "Por revisar", short: "Revisar", icon: "check", tab: true },
  { href: "/cliente/parrilla", label: "Parrilla", icon: "calendar", mod: "parrilla" },
  { href: "/cliente/solicitudes", label: "Solicitudes", short: "Pedir", icon: "brief", tab: true, mod: "solicitudes" },
  { href: "/cliente/mensajes", label: "Mensajes", short: "Chat", icon: "chat", tab: true, mod: "chat" },
  { href: "/cliente/cobros", label: "Cuentas de cobro", icon: "money", mod: "cobros" },
  { href: "/cliente/cotizaciones", label: "Cotizaciones", icon: "quote", mod: "cotizaciones" },
  { href: "/cliente/contratos", label: "Contratos", icon: "pen", mod: "contratos" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).is("read_at", null);
  const { data: ws } = await supabase.from("clients").select("company, name, logo_url, brand, modules").eq("client_user_id", user.id);
  const list = (ws ?? []) as Pick<Client, "company" | "name" | "logo_url" | "brand" | "modules">[];
  const on = (k: ModuleKey) => !list.length || list.some((c) => c.modules?.[k] !== false);
  const nav = NAV.filter((i) => !i.mod || on(i.mod));
  // Si solo trabaja con un equipo, el portal toma la marca del cliente
  const mine = list.length === 1 ? list[0] : null;
  const sh = mine?.brand?.primary ? brandShades(mine.brand.primary) : null;
  const brand = mine ? {
    logo: mine.logo_url, name: mine.company || mine.name, font: mine.brand?.font && mine.brand.font !== "Otra" ? mine.brand.font : null,
    vars: sh ? { "--color-brand": sh.brand, "--color-brand-dark": sh.dark, "--color-brand-soft": sh.soft, "--color-azul-t": sh.tint } : undefined,
  } : undefined;
  return (
    <AppShell nav={nav} brand={brand} userId={user.id} userName={profile.full_name ?? profile.email} unread={count ?? 0}
      notificationsHref="/cliente/notificaciones" profileHref="/cliente/perfil">
      {children}
    </AppShell>
  );
}
