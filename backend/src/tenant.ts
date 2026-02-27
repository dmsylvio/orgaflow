export function getOrgFromHost(host?: string | null, rootDomain?: string | null) {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return null;

  const root = (rootDomain ?? "").toLowerCase().trim();
  if (!root) return null;
  if (h === root || h === `www.${root}`) return null;
  if (!h.endsWith(`.${root}`)) return null;

  const sub = h.slice(0, -1 * (root.length + 1));
  return sub ? sub.split(".")[0] || null : null;
}
