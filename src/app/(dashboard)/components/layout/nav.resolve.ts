import type { MenuConfig, NavItem, NavSection } from "./nav.types";

type ResolveInput = {
  config: MenuConfig;
  isOwner: boolean;
  permissions: Set<string>; // do ctx.getPermissions()
  features?: Record<string, boolean>; // ex: { reports: true }
  counters?: Record<string, number>; // ex: { invoicesDue: 3 }
};

function allowItem(
  item: NavItem,
  isOwner: boolean,
  permissions: Set<string>,
  features?: Record<string, boolean>,
) {
  if (item.ownerOnly && !isOwner) return false;
  if (item.ability && !permissions.has(item.ability)) return false;
  if (item.features?.length) {
    for (const f of item.features) if (!features?.[f]) return false;
  }
  return true;
}

function mapCounters(item: NavItem, counters?: Record<string, number>) {
  const _count = item.counterKey ? (counters?.[item.counterKey] ?? 0) : 0;
  return { ...item, _count } as NavItem & { _count?: number };
}

export function resolveMenu(input: ResolveInput) {
  const { config, isOwner, permissions, features, counters } = input;

  const mapSection = (section: NavSection) => {
    const items = (section.items || [])
      .filter((it) => allowItem(it, isOwner, permissions, features))
      .map((it) => {
        const mapped = mapCounters(it, counters);
        if (mapped.children?.length) {
          mapped.children = mapped.children.filter((c) =>
            allowItem(c, isOwner, permissions, features),
          );
        }
        return mapped;
      });
    return { ...section, items };
  };

  return {
    main: config.main.map(mapSection).filter((s) => s.items.length),
    settings: config.settings.map(mapSection).filter((s) => s.items.length),
  };
}
