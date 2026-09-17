import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";

export async function GET(request: Request) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const pageSize = searchParams.get("pageSize") ?? "10";

  const backendResponse = await fetch(
    `${getApiUrl()}/api/implementaciones?page=${page}&pageSize=${pageSize}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "No se pudieron cargar las implementaciones." }, { status: backendResponse.status });
  }

  return NextResponse.json(await backendResponse.json());
}

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: "No autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Solicitud inválida." }, { status: 400 });

  const backendResponse = await fetch(`${getApiUrl()}/api/implementaciones`, {
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
      { message: data?.message ?? "No se pudo desplegar la implementación." },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(data, { status: backendResponse.status });
}
