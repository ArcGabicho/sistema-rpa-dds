import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact-schema";
import { getApiUrl } from "@/lib/auth";

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
      headers: { "Content-Type": "application/json" },
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
    return NextResponse.json(
      { message: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo." },
      { status: 429 },
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
