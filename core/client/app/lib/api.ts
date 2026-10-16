import { getApiUrl } from "@/lib/auth";
import { getSessionToken } from "@/lib/session";

// For server components: GET an authenticated API endpoint with the session's
// JWT. Returns null when there's no session, the API is down or the response
// isn't OK, so each page decides how to show the missing data.
export async function apiGet<T>(path: string): Promise<T | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await fetch(`${getApiUrl()}/api/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
