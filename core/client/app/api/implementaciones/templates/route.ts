import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const backendResponse = await fetch(`${getApiUrl()}/api/implementaciones/templates`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "No se pudieron cargar las plantillas." }, { status: backendResponse.status });
  }

  return NextResponse.json(await backendResponse.json());
}
