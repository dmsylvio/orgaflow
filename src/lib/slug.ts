export function toSlug(value: string, fallback = "slug"): string {
  const base = (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || fallback;
}

export async function ensureUniqueSlug(
  value: string,
  exists: (slug: string) => Promise<boolean>,
  fallback = "slug",
): Promise<string> {
  const base = toSlug(value, fallback) || fallback;
  let slug = base;
  for (let i = 2; await exists(slug); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}
