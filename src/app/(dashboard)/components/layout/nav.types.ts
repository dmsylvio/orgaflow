import type { LucideIcon } from "lucide-react";
import type { AbilityKey } from "@/server/iam/permissions/catalog";

export type NavItem = {
  tKey?: string; // i18n key opcional
  name: string; // fallback
  href: string;
  icon?: LucideIcon;
  ability?: AbilityKey; // perm necessária
  ownerOnly?: boolean; // só owner da org
  features?: string[]; // flags de produto (ex: ["reports"])
  group?: number | string; // seção/ordem
  counterKey?: string; // contador opcional
  children?: NavItem[];
};

export type NavSection = {
  title?: string;
  group: number | string;
  items: NavItem[];
};

export type MenuConfig = {
  main: NavSection[];
  settings: NavSection[];
};
