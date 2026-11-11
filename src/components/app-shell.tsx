"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Logo } from "./brand";
import { Avatar } from "./ui";

export type NavItem = { href: string; label: string; short?: string; icon: keyof typeof ICONS; exact?: boolean };

const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.75",
  brief: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  calendar: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1",
  quote: "M4 4h16v16H4zM8 9h8M8 13h8M8 17h5",
  money: "M12 3v18M17 7.5C17 5.6 14.8 5 12 5S7 6 7 8s2 2.7 5 3.3 5 1.4 5 3.5-2.2 3.2-5 3.2-5-.9-5-2.8",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  check: "M20 6 9 17l-5-5",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
};

export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[18px]", className)} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

export function AppShell({
  nav, userId, userName, unread, notificationsHref, profileHref, children,
}: {
  nav: NavItem[]; userId: string; userName: string; unread: number;
  notificationsHref: string; profileHref: string; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState(unread);

  useEffect(() => setCount(unread), [unread]);

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

  async function logout() {
    await createClient().auth.signOut();
    router.push("/ingresar");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Barra lateral (escritorio) */}
      <aside className="no-print hidden md:flex w-60 shrink-0 flex-col border-r border-line px-4 py-6 sticky top-0 h-screen">
        <Link href={nav[0].href} className="px-2 mb-8"><Logo /></Link>
        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map((i) => (
            <Link key={i.href} href={i.href}
              className={cn("flex items-center gap-3 rounded-xl px-3 h-10 text-[13px] transition-colors",
                isActive(i) ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-surface hover:text-ink")}>
              <Icon name={i.icon} />{i.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line pt-4 flex flex-col gap-0.5">
          <Link href={notificationsHref}
            className={cn("flex items-center gap-3 rounded-xl px-3 h-10 text-[13px]",
              pathname.startsWith(notificationsHref) ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-surface hover:text-ink")}>
            <Icon name="bell" />Notificaciones
            {count > 0 && <span className="ml-auto badge bg-brand text-white">{count}</span>}
          </Link>
          <Link href={profileHref} className="flex items-center gap-3 rounded-xl px-3 h-12 hover:bg-surface">
            <Avatar name={userName} size={28} />
            <span className="text-[13px] truncate">{userName}</span>
          </Link>
          <button onClick={logout} className="text-left px-3 py-2 text-[12px] text-muted hover:text-ink cursor-pointer">Cerrar sesión</button>
        </div>
      </aside>

      {/* Barra superior + navegación inferior (móvil) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print md:hidden flex items-center justify-between px-5 h-14 border-b border-line sticky top-0 bg-white/90 backdrop-blur z-20">
          <Logo size={20} />
          <div className="flex items-center gap-1">
            <Link href={notificationsHref} className="relative btn-ghost btn btn-sm px-2" aria-label="Notificaciones">
              <Icon name="bell" />
              {count > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-brand" />}
            </Link>
            <Link href={profileHref} aria-label="Perfil"><Avatar name={userName} size={28} /></Link>
          </div>
        </header>
        <main className="flex-1 px-5 md:px-10 py-7 md:py-10 pb-28 md:pb-10 max-w-6xl w-full mx-auto">{children}</main>
        <nav className="no-print md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line flex z-20 pb-[env(safe-area-inset-bottom)]">
          {nav.map((i) => (
            <Link key={i.href} href={i.href}
              className={cn("flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 text-[10px] truncate",
                isActive(i) ? "text-brand" : "text-muted")}>
              <Icon name={i.icon} />{i.short ?? i.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
