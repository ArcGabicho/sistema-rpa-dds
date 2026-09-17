import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, getJwtSecretKey } from "@/lib/auth";

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
