import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";
import { getApiUrl } from "@/lib/auth";
import { clientIpHeaders, tooManyRequests } from "@/lib/client-ip";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revisa los datos del formulario e intenta de nuevo." },
      { status: 400 },
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getApiUrl()}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...clientIpHeaders(request) },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "No se pudo conectar con el servidor. Intenta de nuevo." },
      { status: 502 },
    );
  }

  if (backendResponse.status === 429) {
    const body = await tooManyRequests(backendResponse);
    return NextResponse.json(
      { ...body, message: "Ya recibimos varias solicitudes desde tu conexión. Espera unos minutos e intenta de nuevo." },
      { status: 429, headers: { "Retry-After": String(body.retryAfterSeconds) } },
    );
  }

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "No se pudo enviar tu solicitud. Intenta de nuevo." },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
