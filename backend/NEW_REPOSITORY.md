# Migrar `backend/` para um novo repositório GitHub

Este projeto foi preparado para ser separado em um repositório próprio de backend.

## Opção recomendada (mantendo histórico do diretório `backend/`)

No repositório atual:

```bash
git checkout backend
git subtree split --prefix=backend -b backend-standalone
```

Crie o novo repositório no GitHub (ex.: `orgaflow-backend`) e publique:

```bash
git push git@github.com:<sua-org-ou-user>/orgaflow-backend.git backend-standalone:main
```

## Opção alternativa (sem histórico)

```bash
mkdir ../orgaflow-backend
rsync -av --exclude='.git' backend/ ../orgaflow-backend/
cd ../orgaflow-backend
git init
git add .
git commit -m "chore: initial backend import"
git branch -M main
git remote add origin git@github.com:<sua-org-ou-user>/orgaflow-backend.git
git push -u origin main
```

## Depois da separação

1. Atualize CI/CD do backend no novo repo.
2. Configure variáveis (`DATABASE_URL`, `JWT_SECRET`, `ROOT_DOMAIN`, `API_PORT`).
3. Ajuste CORS/hosts para front e backend no mesmo root domain.
