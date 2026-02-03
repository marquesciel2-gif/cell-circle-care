

## Adicionar Seleção de Data de Recebimento nas Contas a Receber

### Objetivo
Permitir que o usuário selecione a data em que um pagamento foi recebido, em vez de usar automaticamente a data atual.

### Análise da Situação Atual
- O modal `ReceivePaymentModal` permite apenas inserir o valor a receber
- A função `receivePayment` no hook `useAccounts` apenas atualiza o `valor_pago` na conta
- Existe uma tabela `payments` no banco de dados que não está sendo utilizada
- A tabela `payments` tem as colunas: `id`, `account_id`, `valor`, `forma_pagamento`, `received_by`, `created_at`

### Plano de Implementação

#### 1. Atualizar a Tabela de Pagamentos
Adicionar uma coluna `data_recebimento` na tabela `payments` para armazenar a data escolhida pelo usuário.

```sql
ALTER TABLE payments ADD COLUMN data_recebimento DATE DEFAULT CURRENT_DATE;
```

#### 2. Atualizar o Modal de Recebimento
Modificar `src/components/modals/ReceivePaymentModal.tsx` para incluir:
- Campo de seleção de data usando o componente `Popover` + `Calendar`
- Data padrão como a data atual
- Passar a data selecionada para a função de recebimento

#### 3. Atualizar o Hook useAccounts
Modificar a função `receivePayment` em `src/hooks/useAccounts.ts` para:
- Aceitar a data de recebimento como parâmetro
- Registrar o pagamento na tabela `payments` com a data selecionada
- Continuar atualizando o `valor_pago` na conta

#### 4. Atualizar a Interface
Ajustar `src/components/accounts/AccountsReceivable.tsx` para passar a data de recebimento ao chamar a função.

---

### Detalhes Técnicos

**Alterações nos arquivos:**

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | Adicionar coluna `data_recebimento` na tabela `payments` |
| `ReceivePaymentModal.tsx` | Adicionar DatePicker com Popover e Calendar |
| `useAccounts.ts` | Modificar `receivePayment` para registrar na tabela `payments` |
| `AccountsReceivable.tsx` | Atualizar chamada de `handleReceivePayment` |

**Componentes necessários (já existem no projeto):**
- `Calendar` (src/components/ui/calendar.tsx)
- `Popover` (src/components/ui/popover.tsx)
- `Button` (src/components/ui/button.tsx)

**Dependências utilizadas:**
- `date-fns` para formatação de datas
- `react-day-picker` já instalado

