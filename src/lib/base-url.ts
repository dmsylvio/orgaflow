/**
 * URL base pública da aplicação (absoluta), para links de email, Stripe redirect, etc.
 * Preferir `NEXT_PUBLIC_APP_URL`; fallback `AUTH_URL`; último recurso localhost.
 */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
