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
ROOT_DOMAIN="example.com"
API_PORT="4000"
```

## Estrutura

- `src/app.ts`: composição da app
- `src/server.ts`: bootstrap do servidor
- `src/routes/*`: rotas por domínio
- `src/modules/*`: autenticação e contexto
- `src/schema.ts`: schema de banco
- `src/db.ts`: conexão com banco
- `docs/API_ELYSIA.md`: documentação da API
