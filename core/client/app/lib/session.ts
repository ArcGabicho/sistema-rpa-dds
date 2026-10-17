import { cache } from "react";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, getApiUrl, getJwtSecretKey } from "@/lib/auth";
import type { Me } from "@/lib/permisos";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return {
      id: typeof payload.sub === "string" ? Number(payload.sub) : 0,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      role: typeof payload.role === "string" ? payload.role : "",
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: SessionUser | null) {
  return user?.role === "Admin";
}

// Raw JWT for server components that need to call authenticated backend
// endpoints directly (e.g. dashboard modules fetching their own data).
export async function getSessionToken(): Promise<string | null> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
}

// The signed-in user's effective permissions, from the API rather than the
// token, so an admin's changes (or a deactivation) apply right away. Once
// per request. `sesionInvalida`: the API rejected the session (the user was
// deactivated or deleted); `me` is null too when the API can't be reached.
export const getMe = cache(async (): Promise<{ me: Me | null; sesionInvalida: boolean }> => {
  const token = await getSessionToken();
  if (!token) return { me: null, sesionInvalida: true };
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (response.status === 401) return { me: null, sesionInvalida: true };
    if (!response.ok) return { me: null, sesionInvalida: false };
    return { me: (await response.json()) as Me, sesionInvalida: false };
  } catch {
    return { me: null, sesionInvalida: false };
  }
});
