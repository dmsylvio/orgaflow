# Orgaflow IAM — Technical Implementation (redirect)

**This document is superseded by the English canonical guide:**

**[`iam-architecture-technical.md`](./iam-architecture-technical.md)**

It describes the same IAM model (self vs owner vs role-based access, `appMenu` / `settingsMenu`, permissions, ability, tRPC integration, and database mapping) in the **authoritative** form aligned with the current codebase.

The older Portuguese long-form draft was consolidated here to avoid maintaining two copies. Use **`iam-architecture-technical.md`** for implementation details.

---

## Related

- **[`orgaflow-server-architecture.md`](./orgaflow-server-architecture.md)** — `src/server` layout, imports, IAM, features, Kanban, payments.
- **[`orgaflow-domains-iam-features-architecture.md`](./orgaflow-domains-iam-features-architecture.md)** — Product architecture: domains, IAM, features, quotas, Kanban, payments.
