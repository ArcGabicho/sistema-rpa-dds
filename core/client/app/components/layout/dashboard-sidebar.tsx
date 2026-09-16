"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/sections/logout-button";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { SITE } from "@/lib/site-config";
import type { SessionUser } from "@/lib/session";

export function DashboardSidebar({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-ink-950 px-5 py-6">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
        <span className="font-display text-sm font-bold text-paper">{SITE.name}</span>
      </Link>

      <nav className="mt-10 flex flex-col gap-1">
        {DASHBOARD_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-paper/10 font-medium text-paper"
                  : "text-paper-dim hover:bg-paper/5 hover:text-paper"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-ink-800 pt-5">
        <div className="px-2">
          <p className="truncate text-sm font-medium text-paper">
            {user?.name || "Administrador"}
          </p>
          <p className="truncate text-xs text-paper-dim">{user?.email}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
