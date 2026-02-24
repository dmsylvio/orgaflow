// src/components/layout/nav.types.ts
import type { ComponentType } from "react";

// Ícone deve ser um componente React (ex.: lucide-react)
export type IconType = ComponentType<{ className?: string }>;

/**
 * Item de navegação individual
 */
export type MenuItem = {
  /** Chave de tradução i18n (ex.: "navigation.dashboard") */
  tKey?: string;
  /** Rótulo visível no menu (fallback quando tKey não é usado) */
  name: string;
  /** Link absoluto dentro do app (ex.: "/app", "/app/customers") */
  href: string;
  /** Ícone obrigatório (componente) */
  icon: IconType;

  /**
   * Se true, apenas owners veem este item.
   * A verificação de owner é feita no resolveMenu.
   */
  ownerOnly?: boolean;

  /**
   * Ability necessária para usuários que NÃO são owners.
   * Para owners, ability é ignorada (desde que passe no ownerOnly).
   */
  ability?: string;

  /**
   * Chave para contador no badge (ex.: "invoicesDue")
   */
  counterKey?: string;

  /**
   * Flags de recurso necessárias para exibir o item para qualquer usuário.
   * Se alguma flag listada for false, o item não aparece nem para owners.
   */
  features?: string[];
};

/**
 * Agrupador de itens (ex.: "Sales", "Setup", etc.)
 * `group` é apenas um identificador numérico/ordem usado na UI se desejar
 */
export type MenuSection = {
  /** Identificador ou ordem do grupo na UI */
  group: number | string;
  /** Chave de tradução do título do grupo (ex.: "navigation.group.general") */
  title?: string;
  /** Itens pertencentes a esse grupo */
  items: MenuItem[];
};

/**
 * Configuração completa do menu (main e settings)
 */
export type MenuConfig = {
  main: MenuSection[];
  settings: MenuSection[];
};

/**
 * Estrutura resultante após aplicar regras de visibilidade (owner, ability, features)
 */
export type ResolvedMenu = {
  main: MenuSection[];
  settings: MenuSection[];
};

/**
 * Parâmetros de resolução usados pelo resolveMenu
 * (mantido aqui para referência de tipos compartilhados)
 */
export type ResolveMenuInput = {
  config: MenuConfig;
  isOwner: boolean;
  permissions: Set<string>;
  /** Flags de recurso ativas no tenant/usuário (ex.: { reports: true }) */
  features?: Record<string, boolean>;
};
