# Orgaflow Backend API

Backend multi-tenant em Elysia + Drizzle com validação em **Zod**.

## OpenAPI

- UI: `GET /openapi`
- JSON: `GET /openapi/json`
- Base path da API: `/api`

## Multi-tenant

A organização ativa é resolvida nesta ordem:

1. Header `x-org-id`
2. Header `x-org-slug`
3. `user.activeOrgId`

> Não há suporte a resolução de tenant por subdomínio.

## Schemas Zod (fonte)

```ts
signupSchema: z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
})

signinSchema: z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

orgCreateSchema: z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
})

orgUpdateSchema: z.object({
  orgId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
})

orgDeleteSchema: z.object({ orgId: z.string().uuid() })
orgSwitchSchema: z.object({ orgId: z.string().uuid() })

listCustomersSchema: z.object({
  q: z.string().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
})

createCustomerSchema: z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

updateCustomerSchema: createCustomerSchema.extend({ id: z.string().uuid() })
customerIdSchema: z.object({ id: z.string().uuid() })
```

## Endpoints

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Usuário
- `GET /api/me`
- `GET /api/me/permissions`

### Organizações
- `GET /api/org`
- `GET /api/org/current`
- `POST /api/org/switch`
- `POST /api/org`
- `PATCH /api/org`
- `DELETE /api/org`

### Customers
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

## Paginação de customers

`GET /api/customers` retorna:

```json
{
  "items": [],
  "nextCursor": "base64url(createdAt|id)"
}
```

Se `nextCursor` vier preenchido, enviar em `cursor` na próxima chamada.
