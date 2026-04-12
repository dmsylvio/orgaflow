/**
 * URL base pública da aplicação (absoluta), para links de email, Stripe redirect, etc.
 * Preferir `NEXT_PUBLIC_APP_URL`; fallback `AUTH_URL`/`NEXTAUTH_URL`; último recurso localhost.
 * Em produção, garante sempre HTTPS independentemente do valor configurado na env var.
 */
export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  if (process.env.NODE_ENV === "production") {
    return url.replace(/^http:\/\//, "https://");
  }

  return url;
}
