import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });

  const backendResponse = await fetch(`${getApiUrl()}/api/clients/${id}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: data?.message ?? "No se pudo agregar la nota." },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(data, { status: backendResponse.status });
}
