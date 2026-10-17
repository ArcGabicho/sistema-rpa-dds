import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/auth";
import { clientIpHeaders } from "@/lib/client-ip";
import { getSessionToken } from "@/lib/session";

// Authenticated pass-through to the API for the panel's client components:
// /api/panel/empresas/12/contactos -> {API_URL}/api/empresas/12/contactos,
// with the session's JWT attached. Only the modules listed here go through,
// plus a couple of single routes (signing in stays on its own route).
const MODULES = new Set(["empresas", "contactos", "oportunidades", "clients", "boveda", "diagnosticos", "procesos", "propuestas", "proyectos", "bots", "incidencias", "vencimientos", "users", "dashboard"]);
const RUTAS = new Set(["auth/me", "auth/clave"]);

// Nothing from the panel's API (vault values least of all) may be cached.
const NO_STORE = { "Cache-Control": "no-store" };

// Drafting a PDD with AI can take a while.
export const maxDuration = 60;

type Context = { params: Promise<{ path: string[] }> };

// The API answers with { message } for its own errors and with a validation
// ProblemDetails ({ errors: { field: [msg] } }) for model binding errors.
function errorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const body = data as { message?: unknown; errors?: Record<string, unknown> };
  if (typeof body.message === "string") return body.message;

  const first = body.errors && Object.values(body.errors).flat()[0];
  return typeof first === "string" ? first : null;
}

async function forward(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const { path } = await params;
  if (!MODULES.has(path[0] ?? "") && !RUTAS.has(path.join("/"))) return NextResponse.json({ message: "No encontrado." }, { status: 404 });

  const { search } = new URL(request.url);
  const hasBody = request.method !== "GET" && request.method !== "DELETE";

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getApiUrl()}/api/${path.map(encodeURIComponent).join("/")}${search}`, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody && { "Content-Type": "application/json" }),
        // For the vault's access log, which records where each reveal came from.
        ...clientIpHeaders(request),
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "No se pudo conectar con el servidor." }, { status: 502 });
  }

  if (backendResponse.status === 204) return new NextResponse(null, { status: 204, headers: NO_STORE });

  const data = await backendResponse.json().catch(() => null);
  if (!backendResponse.ok) {
    const fallback =
      backendResponse.status === 403 ? "No tienes permiso para esta acción." : "No se pudo completar la acción.";
    return NextResponse.json(
      { ...(data && typeof data === "object" ? data : {}), message: errorMessage(data) ?? fallback },
      { status: backendResponse.status, headers: NO_STORE },
    );
  }

  return NextResponse.json(data, { status: backendResponse.status, headers: NO_STORE });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
