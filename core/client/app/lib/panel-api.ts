// For client components: call the API through the authenticated proxy in
// app/api/panel. Never throws; `message` is ready to show in a toast.
export type PanelResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

export async function panelFetch<T = unknown>(
  path: string,
  init?: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown },
): Promise<PanelResult<T>> {
  try {
    const response = await fetch(`/api/panel/${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, status: response.status, message: data?.message ?? "Intenta de nuevo." };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, message: "Ocurrió un error de conexión." };
  }
}
