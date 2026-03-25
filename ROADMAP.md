# Orgaflow — Roadmap de Pendências

> Última atualização: 2026-03-25

---

## ✅ Concluído

### 1. Upload de Anexos / Recibos
- Implementado upload via Vercel Blob (`@vercel/blob`)
- Tabela `document_files` criada (resource_type: expense | estimate | invoice)
- API route `POST /api/upload` com validação de auth, org, tipo e tamanho
- UI de upload nas páginas de Expenses (criar e editar)
- Página de detalhe do expense (`/app/expenses/[id]`) com visualização de arquivos
- **Escopo atual**: Expenses ✅ | Estimates (em progresso) | Invoices (pendente)

---

## Prioridade Alta — Funcionalidades incompletas/stub

### 2. Página de Settings com roteamento dinâmico
- **Onde**: `src/app/(private)/app/(home)/settings/[section]/page.tsx` — renderiza `<MockAppPage>` (stub)
- **O que falta**: Completar o roteamento dinâmico para todas as seções de settings

### 3. Configurações de Notificações
- Tabela `notification_settings` existe no banco mas não está conectada à UI
- **O que falta**: Wiring completo entre preferências salvas e envio de emails

---

## Prioridade Alta — Features anunciadas mas não implementadas

### 4. Exportação de PDF
- Landing page e docs mencionam "PDF export" mas nenhum código de geração foi encontrado
- **Escopo**: Estimates e Invoices devem ter botão de download em PDF (tanto na UI interna quanto na página pública do cliente)

### 5. Relatórios / Analytics
- Landing page anuncia a feature "Reports" mas zero páginas ou routers existem
- **Escopo sugerido**:
  - Receita por período
  - Estimativas aprovadas vs rejeitadas
  - Despesas por categoria
  - Lucratividade por cliente

---

## Prioridade Média

### 6. Stripe Connect — Cobrança Online do Cliente
- Arquitetura menciona Stripe Connect para receber pagamentos
- Hoje o sistema só **registra** pagamentos manualmente
- **O que falta**: Gerar link de pagamento Stripe para o cliente pagar a invoice diretamente (previsto no plano Scale)

### 7. Multi-Currency com Conversão Real
- Schema suporta múltiplas moedas e campo `exchange_rate`
- **O que falta**: Busca automática de cotação e lógica de conversão entre moedas

### 8. Busca Avançada / Filtros
- Filtros básicos existem (ALL / DRAFT / SENT / DUE)
- **O que falta**: Busca por texto livre, filtro por data, filtro por cliente, filtro por valor

---

## Prioridade Média-Baixa

### 9. Log de Atividade / Auditoria
- Timestamps `created_at` / `updated_at` existem nas tabelas mas não há timeline visível
- **O que falta**: Rastrear quem fez o quê (aprovações, envios, edições) e exibir no histórico do documento

### 10. Operações em Lote (Bulk Actions)
- Nenhum bulk edit, bulk delete ou mudança de status em massa implementado
- **Escopo**: Estimates e Invoices (ex: marcar várias como SENT, deletar em lote)

### 11. Templates de Documentos / Personalização de Branding
- Estimates e invoices têm layout fixo sem personalização
- **O que falta**: Upload de logo, personalização de cores, cabeçalho e rodapé customizáveis

### 12. Invoices Recorrentes
- Nenhum mecanismo de recorrência implementado
- **O que falta**: Configurar invoice para ser gerada automaticamente em intervalo definido (ex: contrato mensal)

---

## Resumo

| # | Feature | Status | Prioridade | Esforço |
|---|---------|--------|------------|---------|
| 1 | Upload de anexos/recibos | ✅ Concluído | Alta | Médio |
| 2 | Settings routing dinâmico | 🔲 Pendente | Alta | Baixo |
| 3 | Notificações conectadas | 🔲 Pendente | Alta | Baixo |
| 4 | Exportação PDF | 🔲 Pendente | Alta | Médio |
| 5 | Relatórios / Analytics | 🔲 Pendente | Alta | Alto |
| 6 | Stripe Connect (pagamento online) | 🔲 Pendente | Média | Alto |
| 7 | Multi-currency com cotação | 🔲 Pendente | Média | Médio |
| 8 | Busca e filtros avançados | 🔲 Pendente | Média | Médio |
| 9 | Log de atividade / auditoria | 🔲 Pendente | Média-baixa | Médio |
| 10 | Operações em lote | 🔲 Pendente | Média-baixa | Baixo |
| 11 | Templates/branding de documentos | 🔲 Pendente | Média-baixa | Alto |
| 12 | Invoices recorrentes | 🔲 Pendente | Baixa | Alto |
