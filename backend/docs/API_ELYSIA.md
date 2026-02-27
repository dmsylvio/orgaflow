# Orgaflow Backend API (Projeto novo)

Este backend é **novo e independente** do front legado.
Não reutiliza `appRouter`/tRPC do projeto antigo.

## Stack
- ElysiaJS
- PostgreSQL + Drizzle ORM
- JWT (HS256)
- bcryptjs (rounds 12)

## Regras de domínio
- Multi-tenant por subdomínio: `{slug}.seu-dominio.com`
- Sem suporte a domínio custom por tenant
- Front e backend em projetos separados, mas no mesmo root domain

## Endpoints implementados

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Usuário
- `GET /api/me`
- `GET /api/me/permissions`

### Organização
- `GET /api/org`
- `GET /api/org/current`
- `POST /api/org/switch`
- `POST /api/org`
- `PATCH /api/org`
- `DELETE /api/org`

### Clientes
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

## Registro
`POST /api/auth/register`

```json
{
  "name": "Owner",
  "email": "owner@acme.com",
  "password": "Passw0rd!",
  "orgName": "Acme Inc",
  "slug": "acme"
}
```

## Login
`POST /api/auth/login`

```json
{
  "email": "owner@acme.com",
  "password": "Passw0rd!"
}
```

## Ambiente

```env
DATABASE_URL=postgresql://...
JWT_SECRET=super-secret
ROOT_DOMAIN=example.com
API_PORT=4000
```
