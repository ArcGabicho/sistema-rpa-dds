"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { FacadeBackdrop } from "@/components/layout/facade-backdrop";
import { SITE } from "@/lib/site-config";
import type { SessionUser } from "@/lib/session";

// Same composition as /ingresar: the sidebar sits on the dark glass facade
// and the page content lives in a floating white panel that scrolls on its
// own, so the frame stays put.
export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-ink-950">
      <FacadeBackdrop />

      <div className="relative hidden lg:flex">
        <DashboardSidebar user={user} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 bg-ink-950">
            <DashboardSidebar
              user={user}
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col p-3 sm:p-4 lg:pl-0">
        <header className="flex items-center justify-between px-1 pb-3 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Image src="/assets/icon.png" alt="" width={20} height={20} className="h-5 w-5" />
            </span>
            <span className="font-display text-sm font-semibold text-white">{SITE.shortName}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto rounded-[20px] bg-white px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
