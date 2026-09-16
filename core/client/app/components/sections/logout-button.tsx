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
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-800 px-4 py-2.5 text-sm font-medium text-paper-dim transition-colors hover:border-brass-400 hover:text-paper disabled:opacity-60"
    >
      {loading ? "Saliendo..." : "Cerrar sesión"}
      <LogOut className="h-4 w-4" />
    </button>
  );
}
