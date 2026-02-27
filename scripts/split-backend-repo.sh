#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erro: execute dentro de um repositório git."
  exit 1
fi

REMOTE_URL="${1:-}"
SPLIT_BRANCH="backend-standalone"
SOURCE_BRANCH="${2:-backend}"

if [[ -z "$REMOTE_URL" ]]; then
  echo "Uso: $0 <remote-url-do-novo-repo> [branch-origem]"
  echo "Exemplo: $0 git@github.com:minha-org/orgaflow-backend.git backend"
  exit 1
fi

echo "[1/3] Checkout da branch de origem: $SOURCE_BRANCH"
git checkout "$SOURCE_BRANCH"

echo "[2/3] Gerando branch split com histórico de backend/"
git subtree split --prefix=backend -b "$SPLIT_BRANCH"

echo "[3/3] Publicando no novo repositório"
git push "$REMOTE_URL" "$SPLIT_BRANCH":main

echo "Concluído. Backend publicado em: $REMOTE_URL (branch main)"
