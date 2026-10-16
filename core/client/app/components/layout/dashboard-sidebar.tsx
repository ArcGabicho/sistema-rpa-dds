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
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-white px-3 py-5">
      <div className="flex items-center justify-between gap-3 px-2">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={onNavigate}>
          <Image src="/assets/icon.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-semibold text-ink-950">{SITE.name}</p>
            <p className="text-[11px] text-ink-500">Panel de administración</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-brand-50 hover:text-ink-950"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-8 flex flex-col gap-0.5">
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
              aria-current={isActive ? "page" : undefined}
              className={`relative flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
                isActive
                  ? "bg-brand-100 font-semibold text-brand-700 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-700"
                  : "text-ink-700 hover:bg-brand-50 hover:text-ink-950"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-line px-2 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-ink-950">
                {user?.name || "Administrador"}
              </p>
              {user?.role && (
                <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                  {user.role}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
