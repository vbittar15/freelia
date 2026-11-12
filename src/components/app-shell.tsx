"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Logo } from "./brand";
import { Avatar } from "./ui";

export { Icon, type IconName } from "./icons";
import { Icon, type IconName } from "./icons";

export type NavItem = { href: string; label: string; short?: string; icon: IconName; exact?: boolean; tab?: boolean };

export function AppShell({
  nav, userId, userName, unread, notificationsHref, profileHref, children, brand,
}: {
  nav: NavItem[]; userId: string; userName: string; unread: number;
  notificationsHref: string; profileHref: string; children: React.ReactNode;
  brand?: { logo?: string | null; name?: string; vars?: Record<string, string>; font?: string | null };
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
    <div className="min-h-screen flex" style={{ ...(brand?.vars ?? {}), ...(brand?.font ? { fontFamily: `"${brand.font}", var(--font-sans)` } : {}) } as React.CSSProperties}>
      {brand?.font && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(brand.font)}:wght@400;500;600;700;800&display=swap`} />}
      {/* Barra lateral (escritorio) */}
      <aside className="no-print hidden lg:flex w-[248px] shrink-0 flex-col px-4 py-7 sticky top-0 h-screen">
        <Link href={nav[0].href} className="px-3 mb-9 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {brand?.logo ? <><img src={brand.logo} alt={brand.name ?? "Logo"} className="h-10 max-w-[180px] object-contain" /><span className="mt-2 flex items-center gap-1.5 text-[11px] text-faint">con <Logo size={12} /></span></> : <Logo size={28} />}
        </Link>
        <nav className="flex flex-col gap-1 flex-1">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} data-tour={i.href}
              className={cn("flex items-center gap-3 rounded-full px-4 h-11 text-[14px] transition-colors",
                isActive(i) ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium hover:bg-surface hover:text-ink")}>
              <Icon name={i.icon} className="size-[20px]" />{i.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <Link href={notificationsHref} data-tour="notificaciones"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href={nav[0].href} className="pl-1">{brand?.logo ? <img src={brand.logo} alt={brand.name ?? "Logo"} className="h-8 max-w-[140px] object-contain" /> : <Logo size={24} />}</Link>
          <div className="flex items-center gap-2.5">
            <Link href={notificationsHref} data-tour="notificaciones" className="icon-btn relative" aria-label="Notificaciones">
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
            <Link key={i.href} href={i.href} data-tour={i.href}
              className={cn("flex-1 min-w-0 h-[52px] rounded-full flex flex-col items-center justify-center gap-px text-[11px]",
                isActive(i) ? "bg-brand-soft text-brand-dark font-semibold" : "text-muted font-medium")}>
              <Icon name={i.icon} />{i.short ?? i.label}
            </Link>
          ))}
          {rest.length > 0 && (
            <button type="button" data-tour="more" onClick={() => setMore((m) => !m)} aria-expanded={more}
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
