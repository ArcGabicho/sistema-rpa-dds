import { createHmac } from "node:crypto";

// Forwards the visitor's IP to the API, which rate-limits the login and the
// contact form by it: from the API's side every request comes from this
// server. Signed with the shared JWT secret so the API can tell it apart from
// a forged header (see core/server/Services/ClientIp.cs).
//
// On Vercel, x-forwarded-for / x-real-ip are set by its edge and can't be
// spoofed; anywhere else, put a proxy in front that sets them.
export function clientIpHeaders(request: Request): Record<string, string> {
  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const secret = process.env.JWT_SECRET;
  if (!ip || !secret) return {};

  return {
    "X-Client-Ip": ip,
    "X-Client-Ip-Signature": createHmac("sha256", secret).update(`client-ip:${ip}`).digest("hex"),
  };
}

// The API's 429 body, passed on so the form can say how long to wait.
export async function tooManyRequests(backendResponse: Response) {
  const data = await backendResponse.json().catch(() => null);
  const retryAfterSeconds = Number(data?.retryAfterSeconds ?? backendResponse.headers.get("retry-after")) || 60;
  return {
    message: data?.message ?? "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
    retryAfterSeconds,
  };
}
