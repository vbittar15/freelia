import { AppShell, type NavItem } from "@/components/app-shell";
import { requireClient } from "@/lib/auth";

const NAV: NavItem[] = [
  { href: "/cliente", label: "Inicio", icon: "home", exact: true },
  { href: "/cliente/aprobaciones", label: "Aprobaciones", short: "Aprobar", icon: "check" },
  { href: "/cliente/solicitudes", label: "Solicitudes", short: "Pedidos", icon: "brief" },
  { href: "/cliente/cotizaciones", label: "Cotizaciones", short: "Cotizar", icon: "quote" },
  { href: "/cliente/cobros", label: "Cobros", icon: "money" },
  { href: "/cliente/mensajes", label: "Mensajes", short: "Chat", icon: "chat" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).is("read_at", null);
  return (
    <AppShell nav={NAV} userId={user.id} userName={profile.full_name ?? profile.email} unread={count ?? 0}
      notificationsHref="/cliente/notificaciones" profileHref="/cliente/perfil">
      {children}
    </AppShell>
  );
}
