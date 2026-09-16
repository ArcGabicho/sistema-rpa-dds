import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, getJwtSecretKey } from "@/lib/auth";

export type SessionUser = {
  email: string;
  name: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return {
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
