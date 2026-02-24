export function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  // Explícito: APP_URL ou NEXTAUTH_URL (EasyPanel, Docker, etc.)
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;
  if (appUrl) return appUrl.replace(/\/$/, "");
  // Vercel (auto)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // dev
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
