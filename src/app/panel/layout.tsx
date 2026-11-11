import { AppShell, type NavItem } from "@/components/app-shell";
import { requireCreative } from "@/lib/auth";
import { workLabel } from "@/lib/rubros";
import { Tour } from "@/components/tour";

const nav = (work: string): NavItem[] => [
  { href: "/panel", label: "Inicio", icon: "home", exact: true, tab: true },
  { href: "/panel/clientes", label: "Clientes", icon: "users", tab: true },
  { href: "/panel/parrilla", label: work, icon: "calendar", tab: true },
  { href: "/panel/cobros", label: "Cobros", icon: "money", tab: true },
  { href: "/panel/briefs", label: "Solicitudes", icon: "brief" },
  { href: "/panel/envios", label: "Revisiones", icon: "send" },
  { href: "/panel/cotizaciones", label: "Cotizaciones", icon: "quote" },
  { href: "/panel/mensajes", label: "Mensajes", icon: "chat" },
  { href: "/panel/ajustes", label: "Ajustes", icon: "settings" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireCreative();
  const { count } = await supabase
    .from("notifications").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).is("read_at", null);

  return (
    <AppShell nav={nav(workLabel(profile.specialties ?? []))} userId={user.id} userName={profile.full_name ?? profile.email} unread={count ?? 0}
      notificationsHref="/panel/notificaciones" profileHref="/panel/perfil">
      {children}
      <Tour specialties={profile.specialties ?? []} name={(profile.full_name ?? "").split(" ")[0]} />
    </AppShell>
  );
}
