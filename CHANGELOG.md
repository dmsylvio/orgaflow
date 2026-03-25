# Changelog

> Todas as mudanças notáveis do projeto são documentadas aqui.
> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — 2026-03-25

### Adicionado

#### Upload de Anexos / Recibos (Expenses)
- Instalado `@vercel/blob` para armazenamento de arquivos
- Nova tabela `document_files` no banco com enum `document_resource_type` (`expense` | `estimate` | `invoice`)
  - Campos: `id`, `organization_id`, `resource_type`, `resource_id`, `file_name`, `storage_key`, `mime_type`, `file_size`, `is_public`, `uploaded_by_id`, `created_at`
- API route `POST /api/upload` com:
  - Validação de autenticação (next-auth)
  - Validação de membership na organização
  - Validação de tipo de arquivo (PDF, PNG, JPG, GIF, SVG, WEBP, DOCX, ZIP)
  - Limite de 25 MB por arquivo
  - Verificação de ownership do resource
- Novos procedimentos TRPC em `expenses`:
  - `expenses.listFiles(expenseId)` — lista arquivos de uma despesa
  - `expenses.deleteFile(fileId)` — remove arquivo do Blob e do banco
  - `expenses.create` agora retorna `{ ok, id }` para permitir upload pós-criação
  - `expenses.getById` — busca expense com joins (categoria, cliente, modo de pagamento, moeda) e arquivos
- Componentes de upload:
  - `PendingReceiptField` — coleta arquivos antes da criação da despesa
  - `FullReceiptField` — gerencia arquivos de despesas existentes (upload/delete)
- `EditExpenseDialog` extraído para `edit-dialog.tsx` para reuso entre list e detalhe

#### Página de Detalhe de Despesa (`/app/expenses/[id]`)
- Nova rota de detalhe com:
  - Valor em destaque
  - Cards de informação: Data, Categoria, Cliente, Modo de Pagamento
  - Seção de Notes com renderização HTML (rich text)
  - Seção de Receipts & Attachments com download e delete
  - Botão Edit abre dialog inline
- Linhas da tabela de expenses agora linkam para a página de detalhe

#### Layout de Formulário de Despesas
- Grid responsivo: 1 coluna em telas pequenas, 3 colunas em telas grandes
- Campo de Currency removido do formulário (usa o default da organização)
- Notes e Receipt ocupam largura total (`sm:col-span-3`)

### Alterado
- `expenses.delete` agora remove os arquivos do Vercel Blob antes de deletar a despesa
- `ROADMAP.md` atualizado com status de conclusão

### Ambiente
- Adicionado `BLOB_READ_WRITE_TOKEN` ao `.env.example`

---

## Versões anteriores

> O histórico de versões anteriores pode ser consultado via `git log`.
