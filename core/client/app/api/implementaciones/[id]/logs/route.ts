import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const backendResponse = await fetch(`${getApiUrl()}/api/implementaciones/${id}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "No se encontraron logs." }, { status: backendResponse.status });
  }

  return NextResponse.json(await backendResponse.json());
}
