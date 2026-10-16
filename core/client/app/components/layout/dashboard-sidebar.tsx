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
    <aside className="flex h-full w-72 shrink-0 flex-col px-5 py-7">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
            <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-sm font-semibold text-white">{SITE.name}</p>
            <p className="text-[11px] text-white/60">Panel de administración</p>
          </div>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-10 flex flex-col gap-1">
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
              className={`flex h-10 items-center gap-3 rounded-full px-4 text-sm transition-colors ${
                isActive
                  ? "bg-white font-medium text-neutral-950"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-950">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Administrador"}
              </p>
              {user?.role && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
                  {user.role}
                </span>
              )}
            </div>
            <p className="truncate text-xs text-white/60">{user?.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
