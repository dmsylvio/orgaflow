# Orgaflow — Roadmap de Pendências

> Última atualização: 2026-03-25 (sessão 2)

---

## ✅ Concluído

### 1. Upload de Anexos / Recibos
- Implementado upload via Vercel Blob (`@vercel/blob`)
- Tabela `document_files` criada (resource_type: expense | estimate | invoice)
- API route `POST /api/upload` com validação de auth, org, tipo e tamanho
- UI de upload nas páginas de Expenses (criar e editar)
- Página de detalhe do expense (`/app/expenses/[id]`) com visualização e deleção de arquivos
- Página de detalhe do estimate (`/app/estimates/[id]`) com upload, deleção e toggle "client visible"
- **Escopo atual**: Expenses ✅ | Estimates ✅ | Invoices (pendente)

### 2. Customer Approve / Reject em Estimates
- Campo `rejection_reason` adicionado à tabela `estimates`
- Procedures `approvePublic` e `rejectPublic` (publicProcedure) com automações
- `getPublicByToken` retorna arquivos públicos (`is_public = true`) e `rejectionReason`
- Página pública (`/estimate/[token]`) atualizada com:
  - Carrossel de anexos (imagem, PDF, arquivo genérico)
  - Toggle "client visible" no admin para controlar quais arquivos aparecem
  - Botões Approve / Reject (apenas quando status é SENT ou VIEWED)
  - Modal de rejeição com rich text editor para justificativa
  - Banners de estado (já aprovado / já rejeitado com motivo)

---

## Prioridade Alta — Funcionalidades incompletas/stub

### 3. Upload de Anexos em Invoices ✅
- Procedures `listFiles` e `deleteFile` adicionados ao router de invoices
- Ownership check no `POST /api/upload` para resource_type `invoice`
- Seção de attachments na página de detalhe de invoice (`/app/invoices/[id]`) com upload, listagem e deleção

### 4. Tabs Notes / Files nos Formulários de Create e Edit ✅
- Novo componente `src/components/ui/tabs.tsx` (sem Radix, leve)
- Seção de Notes substituída por tabs **Notes | Files** em 4 forms:
  - `estimates/create` — tab Files coleta arquivos pendentes, faz upload ao salvar
  - `estimates/edit` — tab Files faz upload imediato e permite deletar arquivos existentes
  - `invoices/create` — mesmo comportamento que estimates/create
  - `invoices/edit` — mesmo comportamento que estimates/edit
- Tab Files exibe badge com contagem quando há arquivos anexados

### 5. Página de Settings com roteamento dinâmico
- **Onde**: `src/app/(private)/app/(home)/settings/[section]/page.tsx` — renderiza `<MockAppPage>` (stub)
- **O que falta**: Completar o roteamento dinâmico para todas as seções de settings

### 6. Configurações de Notificações
- Tabela `notification_settings` existe no banco mas não está conectada à UI
- **O que falta**: Wiring completo entre preferências salvas e envio de emails

---

## Prioridade Alta — Features anunciadas mas não implementadas

### 7. Exportação de PDF
- Landing page e docs mencionam "PDF export" mas nenhum código de geração foi encontrado
- **Escopo**: Estimates e Invoices devem ter botão de download em PDF (tanto na UI interna quanto na página pública do cliente)

### 8. Relatórios / Analytics
- Landing page anuncia a feature "Reports" mas zero páginas ou routers existem
- **Escopo sugerido**:
  - Receita por período
  - Estimativas aprovadas vs rejeitadas
  - Despesas por categoria
  - Lucratividade por cliente

---

## Prioridade Média

### 9. Stripe Connect — Cobrança Online do Cliente
- Arquitetura menciona Stripe Connect para receber pagamentos
- Hoje o sistema só **registra** pagamentos manualmente
- **O que falta**: Gerar link de pagamento Stripe para o cliente pagar a invoice diretamente (previsto no plano Scale)

### 10. Multi-Currency com Conversão Real
- Schema suporta múltiplas moedas e campo `exchange_rate`
- **O que falta**: Busca automática de cotação e lógica de conversão entre moedas

### 11. Busca Avançada / Filtros
- Filtros básicos existem (ALL / DRAFT / SENT / DUE)
- **O que falta**: Busca por texto livre, filtro por data, filtro por cliente, filtro por valor

---

## Prioridade Média-Baixa

### 12. Log de Atividade / Auditoria
- Timestamps `created_at` / `updated_at` existem nas tabelas mas não há timeline visível
- **O que falta**: Rastrear quem fez o quê (aprovações, envios, edições) e exibir no histórico do documento

### 13. Operações em Lote (Bulk Actions)
- Nenhum bulk edit, bulk delete ou mudança de status em massa implementado
- **Escopo**: Estimates e Invoices (ex: marcar várias como SENT, deletar em lote)

### 14. Templates de Documentos / Personalização de Branding
- Estimates e invoices têm layout fixo sem personalização
- **O que falta**: Upload de logo, personalização de cores, cabeçalho e rodapé customizáveis

### 15. Invoices Recorrentes
- Nenhum mecanismo de recorrência implementado
- **O que falta**: Configurar invoice para ser gerada automaticamente em intervalo definido (ex: contrato mensal)

---

## Resumo

| # | Feature | Status | Prioridade | Esforço |
|---|---------|--------|------------|---------|
| 1 | Upload de anexos/recibos (Expenses + Estimates) | ✅ Concluído | Alta | Médio |
| 2 | Customer approve/reject em estimates | ✅ Concluído | Alta | Médio |
| 3 | Upload de anexos em Invoices | ✅ Concluído | Alta | Baixo |
| 4 | Tabs Notes/Files nos forms create/edit | ✅ Concluído | Alta | Baixo |
| 5 | Settings routing dinâmico | 🔲 Pendente | Alta | Baixo |
| 6 | Notificações conectadas | 🔲 Pendente | Alta | Baixo |
| 7 | Exportação PDF | 🔲 Pendente | Alta | Médio |
| 8 | Relatórios / Analytics | 🔲 Pendente | Alta | Alto |
| 9 | Stripe Connect (pagamento online) | 🔲 Pendente | Média | Alto |
| 10 | Multi-currency com cotação | 🔲 Pendente | Média | Médio |
| 11 | Busca e filtros avançados | 🔲 Pendente | Média | Médio |
| 12 | Log de atividade / auditoria | 🔲 Pendente | Média-baixa | Médio |
| 13 | Operações em lote | 🔲 Pendente | Média-baixa | Baixo |
| 14 | Templates/branding de documentos | 🔲 Pendente | Média-baixa | Alto |
| 15 | Invoices recorrentes | 🔲 Pendente | Baixa | Alto |
