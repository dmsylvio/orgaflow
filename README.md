# orgaflow-backend

API backend standalone com ElysiaJS + JWT.

## Rodar local

```bash
pnpm install
pnpm dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env`.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/orgaflow_backend"
JWT_SECRET="change-me"
API_PORT="4000"
```

## Endpoints principais

- `GET /api/health`
- OpenAPI UI: `GET /openapi`
- OpenAPI JSON: `GET /openapi/json`

## Multi-tenant

A organização é resolvida por `x-org-id`, `x-org-slug` e fallback para `activeOrgId`. Não há suporte a subdomínio.

## Estrutura

- `src/app.ts`: composição da app
- `src/server.ts`: bootstrap do servidor
- `src/routes/*`: rotas por domínio
- `src/modules/*`: autenticação e contexto
- `src/schema.ts`: schema de banco
- `src/db.ts`: conexão com banco
- `src/validation.ts`: schemas Zod
- `docs/API_ELYSIA.md`: documentação da API
