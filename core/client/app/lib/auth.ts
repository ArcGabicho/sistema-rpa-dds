export const AUTH_COOKIE_NAME = "dds_session";

export function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno JWT_SECRET.");
  }
  return new TextEncoder().encode(secret);
}

export function getApiUrl() {
  return process.env.API_URL ?? "http://localhost:8080";
}
