## Problema

Ao clicar em "Adicionar Conta" no modal de Nova Conta a Receber, o cadastro falha silenciosamente (toast "Erro ao registrar conta").

## Causa raiz

No `AddAccountModal.tsx`, a data de vencimento é convertida com `formatDate()` para o formato brasileiro `dd/MM/yyyy` antes de enviar ao backend. A coluna `vencimento` em `accounts_receivable` é do tipo `date` no Postgres e exige formato ISO `YYYY-MM-DD`. O Supabase rejeita o INSERT por formato de data inválido.

```ts
// AddAccountModal.tsx (linha 44)
dataVencimento: formatDate(dataVencimento), // vira "04/05/2026" → INSERT falha
```

## Correção

1. Em `src/components/modals/AddAccountModal.tsx`: enviar `dataVencimento` no formato ISO original do `<input type="date">` (`YYYY-MM-DD`), removendo a chamada `formatDate()`. A função `formatDate` pode ser removida pois não é mais usada.

2. Em `src/hooks/useAccounts.ts`: melhorar a mensagem de erro do toast incluindo o `error.message` retornado pelo Supabase, para facilitar diagnóstico futuro.

## Arquivos afetados

- `src/components/modals/AddAccountModal.tsx`
- `src/hooks/useAccounts.ts`

## Validação

- Cadastrar uma nova conta a receber → toast "Conta registrada!" e a conta aparece na lista.
