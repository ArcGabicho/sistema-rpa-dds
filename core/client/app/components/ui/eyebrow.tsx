import type { ReactNode } from "react";

// Small uppercase label above a section heading, as on azure.com.
export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const color = tone === "dark" ? "text-glow-300" : "text-ink-700";
  return (
    <p className={`text-xs font-semibold tracking-[0.08em] uppercase ${color} ${className}`}>
      {children}
    </p>
  );
}
