## Por que os relatórios "não funcionam"

Conferi os dados reais da sua conta (admin):

- **Vendas vazio** — o relatório de vendas filtra contas cuja descrição começa com "Venda". Todas as suas contas atuais foram criadas como conserto/venda livre ("Bateria Iphone 7", "TV 32 POL", etc.), então nada aparece. Vou trocar para classificar a origem da conta por um campo real (`origem`: venda / conserto / manual) em vez de adivinhar pelo texto.
- **Despesas falta info** — relatório atual mostra categoria/valor mas não tem filtro por período nem fornecedor.
- **Contas falta info** — falta link clicável pro cliente e o recibo só aparece via ícone discreto.

Não há erro de runtime; é classificação errada + dados antigos sem vínculo.

## O que vou fazer

### 1. Relatórios funcionando de verdade

- Adicionar coluna `origem` em `accounts_receivable` (`venda` | `conserto` | `manual`) e popular automaticamente conforme o ponto de criação. Backfill: contas existentes ficam como `manual`.
- **SalesReport** passa a filtrar por `origem = 'venda'` (não mais por texto "Venda:").
- **AccountsReport** ganha filtro de período (date range) igual ao de vendas, e o nome do cliente vira link pro drawer.
- **ExpensesReport** ganha filtro de período + coluna fornecedor, totais por mês.
- Botão "Recibo" visível e claro (não só ícone) em vendas e contas.

### 2. Despesas com fornecedor

- Adicionar `fornecedor_nome` e `fornecedor_id` (opcional) em `expenses`.
- `AddExpenseModal` ganha um `ClientPicker` (reutilizando o componente — clientes e fornecedores compartilham a mesma tabela `clients`, sem schema novo).
- Coluna "Fornecedor" no relatório de despesas.

### 3. Conserto consome peça do estoque

- No `FinishRepairModal`, novo bloco opcional **"Peças usadas"**: lista pesquisável do estoque + quantidade por peça.
- Ao finalizar:
  - decrementa `quantidade` de cada peça
  - soma o custo das peças no valor sugerido (editável)
  - registra na descrição da conta gerada: `"Conserto: iPhone 7 — Bateria (1x)"`
- Sem tabela nova de movimentação (regra do projeto: não rastrear histórico de estoque).

### 4. Ficha do cliente completa

- O `ClientDetailDrawer` já tem Consertos + Contas. Adicionar:
  - Aba **Vendas** (contas com `origem = 'venda'`)
  - Cartão de resumo: total vendido, total em conserto, total recebido, total em aberto
  - Botão "Gerar recibo" em cada linha

### 5. Recibo em qualquer lugar

- Botão "Recibo" (texto + ícone, não só ícone) em:
  - Cards de Contas a Receber (já existe — só destacar)
  - Cards de Consertos finalizados (novo)
  - Linhas do relatório de vendas (novo)
- Todos abrem o `ReceiptModal` existente.

## De*talhes técnicos*

**Migrações:**

```sql
ALTER TABLE accounts_receivable ADD COLUMN origem text DEFAULT 'manual';
-- backfill: contas que vieram de venda já têm "Venda:" no descricao
UPDATE accounts_receivable SET origem = 'venda' WHERE descricao ILIKE 'venda%';
UPDATE accounts_receivable SET origem = 'conserto' WHERE descricao ILIKE 'conserto%';

ALTER TABLE expenses ADD COLUMN fornecedor_nome text;
ALTER TABLE expenses ADD COLUMN fornecedor_id uuid;
```

**Hooks:** `useAccounts.addAccount` aceita `origem`. `useRepairs.finishRepair` aceita `pecas: {id, quantidade, preco}[]` e decrementa via `useInventory.updateItem`.

**Componentes:** edita `FinishRepairModal`, `AddExpenseModal`, `ExpensesReport`, `AccountsReport`, `SalesReport`, `ClientDetailDrawer`, `RepairsSection`.

## Fora de escopo

- Edição em massa de origem das contas antigas (ficam como `manual` exceto as que o backfill conseguir identificar pelo texto).
- Histórico de movimentação de estoque (proibido por regra do projeto).
- Pagamento de fornecedor a prazo (despesas continuam sendo só `pago`/`pendente` simples).  
  
q