import { AppShell, type NavItem } from "@/components/app-shell";
import { requireCreative } from "@/lib/auth";

const NAV: NavItem[] = [
  { href: "/panel", label: "Inicio", icon: "home", exact: true },
  { href: "/panel/clientes", label: "Clientes", icon: "users" },
  { href: "/panel/briefs", label: "Briefs", icon: "brief" },
  { href: "/panel/parrilla", label: "Parrilla", icon: "calendar" },
  { href: "/panel/cotizaciones", label: "Cotizaciones", short: "Cotizar", icon: "quote" },
  { href: "/panel/cobros", label: "Cobros", icon: "money" },
  { href: "/panel/mensajes", label: "Mensajes", short: "Chat", icon: "chat" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireCreative();
  const { count } = await supabase
    .from("notifications").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).is("read_at", null);

  return (
    <AppShell nav={NAV} userId={user.id} userName={profile.full_name ?? profile.email} unread={count ?? 0}
      notificationsHref="/panel/notificaciones" profileHref="/panel/perfil">
      {children}
    </AppShell>
  );
}
