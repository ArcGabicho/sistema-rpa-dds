import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth-schema";
import { AUTH_COOKIE_NAME, getApiUrl } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Correo o contraseña inválidos." },
      { status: 400 },
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getApiUrl()}/api/auth/login`, {
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
      { message: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
      { status: 429 },
    );
  }

  if (!backendResponse.ok) {
    const data = await backendResponse.json().catch(() => null);
    return NextResponse.json(
      { message: data?.message ?? "Correo o contraseña incorrectos." },
      { status: backendResponse.status },
    );
  }

  const data: {
    token: string;
    expiresInSeconds: number;
    user: { id: number; email: string; fullName: string };
  } = await backendResponse.json();

  const isHttps =
    request.headers.get("x-forwarded-proto") === "https" ||
    new URL(request.url).protocol === "https:";

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(AUTH_COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: data.expiresInSeconds,
  });

  return response;
}
