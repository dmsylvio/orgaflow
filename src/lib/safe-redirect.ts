export function getSafeRedirectPath(
  input: string | null | undefined,
  fallback: string,
): string {
  if (!input) return fallback;

  const candidate = input.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(candidate, "http://localhost");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
