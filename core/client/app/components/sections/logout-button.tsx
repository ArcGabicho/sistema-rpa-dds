"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { sileo } from "sileo";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      sileo.success({ title: "Sesión cerrada" });
      router.push("/ingresar");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-ink-950 disabled:opacity-60"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
      <LogOut className="h-4 w-4" />
    </button>
  );
}
