"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Logo } from "./brand";
import { Avatar } from "./ui";

/** Íconos de trazo 1.8 de la biblioteca de componentes */
const ICONS: Record<string, React.ReactNode> = {
  home: <path d="M4 11.5l8-7 8 7V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.6-3.6 3.3-5.6 6.5-5.6s5.9 2 6.5 5.6" /><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M18 14.7c1.9.7 3.2 2.5 3.6 5.3" /></>,
  brief: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="4" /><path d="M3.5 10h17M8.5 3v4M15.5 3v4" /></>,
  quote: <><rect x="4.5" y="3" width="15" height="18" rx="3" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>,
  money: <><path d="M5.5 3h13v18l-3.2-2-3.3 2-3.3-2-3.2 2z" /><path d="M9 8.5h6M9 12.5h6" /></>,
  chat: <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.3A8 8 0 1 1 20 11.5z" />,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9" /><path d="M10.3 20.5a1.94 1.94 0 0 0 3.4 0" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  send: <><path d="M20.5 3.5L10 14" /><path d="M20.5 3.5l-6.5 17-4-6.5-6.5-4z" /></>,
  more: <><circle cx="5.5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18.5" cy="12" r="1.3" /></>,
};
export type IconName = keyof typeof ICONS & string;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[22px] shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

export type NavItem = { href: string; label: string; short?: string; icon: IconName; exact?: boolean; tab?: boolean };

export function AppShell({
  nav, userId, userName, unread, notificationsHref, profileHref, children,
}: {
  nav: NavItem[]; userId: string; userName: string; unread: number;
  notificationsHref: string; profileHref: string; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(unread);
  const [more, setMore] = useState(false);

  useEffect(() => setCount(unread), [unread]);
  useEffect(() => setMore(false), [pathname]);

  // Notificaciones en tiempo real
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("notif-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => { setCount((c) => c + 1); router.refresh(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, router]);

  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));
  const tabs = nav.filter((i) => i.tab);
  const rest = nav.filter((i) => !i.tab);
  const restActive = rest.some(isActive);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/ingresar");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Barra lateral (escritorio) */}
      <aside className="no-print hidden lg:flex w-[248px] shrink-0 flex-col px-4 py-7 sticky top-0 h-screen">
        <Link href={nav[0].href} className="px-3 mb-9"><Logo size={28} /></Link>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((i) => (
            <Link key={i.href} href={i.href}
              className={cn("flex items-center gap-3 rounded-full px-4 h-11 text-[14px] transition-colors",
                isActive(i) ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium hover:bg-surface hover:text-ink")}>
              <Icon name={i.icon} className="size-[20px]" />{i.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <Link href={notificationsHref}
            className={cn("flex items-center gap-3 rounded-full px-4 h-11 text-[14px]",
              pathname.startsWith(notificationsHref) ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium hover:bg-surface hover:text-ink")}>
            <Icon name="bell" className="size-[20px]" />Notificaciones
            {count > 0 && <span className="ml-auto min-w-[22px] h-[22px] px-[7px] rounded-full bg-brand text-white text-[12px] font-bold inline-flex items-center justify-center">{count}</span>}
          </Link>
          <div className="mt-2 flex items-center gap-3 rounded-[20px] bg-surface px-3 py-2.5">
            <Link href={profileHref}><Avatar name={userName} size={34} /></Link>
            <div className="min-w-0 flex-1">
              <Link href={profileHref} className="block text-[13px] font-semibold truncate">{userName}</Link>
              <button onClick={logout} className="text-[12px] text-muted hover:text-ink cursor-pointer">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Barra superior (móvil) */}
        <header className="no-print lg:hidden flex items-center justify-between px-4 h-16 sticky top-0 bg-white/90 backdrop-blur z-20">
          <Link href={nav[0].href} className="pl-1"><Logo size={24} /></Link>
          <div className="flex items-center gap-2.5">
            <Link href={notificationsHref} className="icon-btn relative" aria-label="Notificaciones">
              <Icon name="bell" />
              {count > 0 && <span className="absolute top-2 right-2.5 size-2.5 rounded-full bg-brand ring-2 ring-white" />}
            </Link>
            <Link href={profileHref} aria-label="Perfil"><Avatar name={userName} size={40} /></Link>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-clip px-4 sm:px-8 lg:px-10 pt-3 sm:pt-6 lg:pt-10 pb-32 lg:pb-12 max-w-[1080px] w-full mx-auto">{children}</main>

        {/* Pestañas flotantes (móvil) */}
        {more && (
          <div className="no-print lg:hidden fixed inset-x-4 sm:inset-x-auto sm:right-8 sm:w-72 bottom-[98px] anim-pop z-30 rounded-[24px] bg-white shadow-[0_10px_40px_rgba(34,26,58,.16)] border border-line p-2">
            {rest.map((i) => (
              <Link key={i.href} href={i.href}
                className={cn("flex items-center gap-3 rounded-full px-4 h-12 text-[15px]", isActive(i) ? "bg-brand-soft text-brand-dark font-semibold" : "font-medium")}>
                <Icon name={i.icon} />{i.label}
              </Link>
            ))}
          </div>
        )}
        <nav aria-label="Pestañas"
          className="no-print lg:hidden fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[480px] bottom-[max(16px,env(safe-area-inset-bottom))] z-30 h-[62px] rounded-full bg-white/95 backdrop-blur shadow-[0_6px_24px_rgba(34,26,58,.10)] border border-line flex items-center px-[5px] gap-0.5">
          {tabs.map((i) => (
            <Link key={i.href} href={i.href}
              className={cn("flex-1 min-w-0 h-[52px] rounded-full flex flex-col items-center justify-center gap-px text-[11px]",
                isActive(i) ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium")}>
              <Icon name={i.icon} />{i.short ?? i.label}
            </Link>
          ))}
          {rest.length > 0 && (
            <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more}
              className={cn("flex-1 min-w-0 h-[52px] rounded-full flex flex-col items-center justify-center gap-px text-[11px] cursor-pointer",
                restActive || more ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium")}>
              <Icon name="more" />Más
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
