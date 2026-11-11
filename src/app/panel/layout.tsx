import { AppShell, type NavItem } from "@/components/app-shell";
import { requireCreative } from "@/lib/auth";

const NAV: NavItem[] = [
  { href: "/panel", label: "Inicio", icon: "home", exact: true, tab: true },
  { href: "/panel/clientes", label: "Clientes", icon: "users", tab: true },
  { href: "/panel/parrilla", label: "Parrilla", icon: "calendar", tab: true },
  { href: "/panel/cobros", label: "Cobros", icon: "money", tab: true },
  { href: "/panel/envios", label: "Aprobaciones", icon: "send" },
  { href: "/panel/briefs", label: "Briefs", icon: "brief" },
  { href: "/panel/cotizaciones", label: "Cotizaciones", icon: "quote" },
  { href: "/panel/mensajes", label: "Mensajes", icon: "chat" },
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
