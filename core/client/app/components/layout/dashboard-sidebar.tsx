"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { LogoutButton } from "@/components/sections/logout-button";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { SITE } from "@/lib/site-config";
import type { SessionUser } from "@/lib/session";

function getInitials(name: string | undefined) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "AD";
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function DashboardSidebar({
  user,
  onNavigate,
  onClose,
}: {
  user: SessionUser | null;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const visibleNav = DASHBOARD_NAV.filter((item) => !item.adminOnly || user?.role === "Admin");

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-ink-950 px-5 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-paper">{SITE.name}</p>
            <p className="text-[11px] text-paper-dim">Panel de administración</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-paper-dim transition-colors hover:bg-paper/10 hover:text-paper"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-8 h-px bg-ink-800" />

      <nav className="mt-6 flex flex-col gap-1">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-paper-dim/70">
          Principal
        </p>
        {visibleNav.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-brass-400 bg-paper/10 font-medium text-paper"
                  : "border-transparent text-paper-dim hover:bg-paper/5 hover:text-paper"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-brass-300" : ""}`}
                strokeWidth={1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-ink-800 pt-5">
        <div className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass-500 text-xs font-semibold text-paper">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-paper">
                {user?.name || "Administrador"}
              </p>
              {user?.role && (
                <span className="shrink-0 rounded-full bg-paper/10 px-1.5 py-0.5 text-[10px] font-medium text-paper-dim">
                  {user.role}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-paper-dim">{user?.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
