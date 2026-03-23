/**
 * Rotas da área autenticada (prefixo `/app/*`).
 * Alinhado a `docs/orgaflow-ui-architecture.md` §6.2 e IAM (`/app`, `/app/settings`).
 */
export const appPaths = {
  workspace: "/app/workspace",
  /** Raiz da app autenticada (requer organização ativa). */
  home: "/app",
} as const;
