"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SITE } from "@/lib/site-config";
import type { SessionUser } from "@/lib/session";

// Azure portal-style shell: a white sidebar against a pale workspace, where
// each page lays its content out in white Fluent cards. The workspace
// scrolls on its own so the sidebar stays put. When printing (a diagnosis
// report, say), only the page's content is printed, on white.
export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-brand-50 print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="hidden lg:flex print:hidden">
        <DashboardSidebar user={user} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 shadow-flyout">
            <DashboardSidebar
              user={user}
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 lg:hidden print:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/assets/icon.png" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-display text-sm font-semibold text-ink-950">{SITE.shortName}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-1.5 text-ink-700 transition-colors hover:bg-brand-50 hover:text-ink-950"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
