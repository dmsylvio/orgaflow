# Changelog

> Todas as mudanças notáveis do projeto são documentadas aqui.
> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased] — 2026-03-25

### Adicionado

#### Tabs Notes / Files nos Formulários (Estimates + Invoices)
- Novo componente `src/components/ui/tabs.tsx` — `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (sem Radix, sem dependência extra)
- Seção de Notes substituída por tabs **Notes | Files** em 4 forms:
  - `estimates/create` — Files coleta arquivos pendentes e faz upload ao salvar (pós-criação com o ID retornado)
  - `estimates/edit` — Files faz upload imediato via `/api/upload` e permite deletar arquivos existentes
  - `invoices/create` — mesmo comportamento que estimates/create
  - `invoices/edit` — mesmo comportamento que estimates/edit
- Tab Files exibe badge numérico quando há arquivos anexados
- Upload em edit forms usa `trpc.estimates.listFiles` / `trpc.invoices.listFiles` com invalidação automática de cache

#### Customer Approve / Reject em Estimates (página pública)
- Campo `rejection_reason` (`text`) adicionado à tabela `estimates` e aplicado ao banco
- Novos procedimentos TRPC públicos:
  - `estimates.approvePublic(token)` — atualiza status para `APPROVED`, dispara automações
  - `estimates.rejectPublic({ token, reason })` — atualiza status para `REJECTED`, salva motivo, dispara automações
- `estimates.getPublicByToken` atualizado para retornar `files` (apenas `is_public = true`) e `rejectionReason`
- Página pública `/estimate/[token]` atualizada com:
  - Carrossel de anexos com preview de imagem, iframe de PDF e fallback genérico
  - Botão **Approve** (só aparece quando status é SENT ou VIEWED)
  - Botão **Reject** abre modal com rich text editor para justificativa (opcional)
  - Banners de estado: verde (aprovado) e vermelho (rejeitado com motivo renderizado em rich text)

#### Upload de Anexos em Estimates (página de detalhe interna)
- Procedimentos TRPC adicionados ao router de estimates:
  - `estimates.listFiles({ estimateId })` — lista arquivos do estimate
  - `estimates.deleteFile({ fileId })` — remove do Vercel Blob e do banco
  - `estimates.toggleFileVisibility({ fileId, isPublic })` — controla visibilidade na página pública do cliente
- Ownership check adicionado ao `POST /api/upload` para `resource_type = "estimate"`
- Página de detalhe `/app/estimates/[id]` com seção Attachments: upload, listagem, deleção e toggle "Client visible"

#### Upload de Anexos em Invoices
- Procedimentos TRPC adicionados ao router de invoices:
  - `invoices.listFiles({ invoiceId })` — lista arquivos da invoice
  - `invoices.deleteFile({ fileId })` — remove do Vercel Blob e do banco
- Ownership check adicionado ao `POST /api/upload` para `resource_type = "invoice"`
- Página de detalhe `/app/invoices/[id]` com seção Attachments: upload, listagem e deleção

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
