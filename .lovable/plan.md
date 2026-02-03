
# Plano: Recuperar Contas a Receber

## Diagnóstico

Os dados **não foram apagados**. Eles ainda estão no localStorage do seu navegador com a chave `"accounts"`. O problema é que:

1. O sistema antigo salvava em **localStorage** (dados locais no navegador)
2. Mudei o Dashboard para buscar do **banco de dados** (Supabase)
3. O banco de dados está vazio porque nunca recebeu esses dados

## Solução

Vou criar um mecanismo de migração automática que:

1. Verifica se existem contas no localStorage
2. Se existirem, migra automaticamente para o banco de dados
3. Após migração bem-sucedida, limpa o localStorage antigo

### Alterações

**Arquivo: `src/hooks/useAccounts.ts`**
- Adicionar função `migrateFromLocalStorage()` que:
  - Busca dados do localStorage com a chave `"accounts"`
  - Converte para o formato do banco de dados
  - Insere no Supabase
  - Remove do localStorage após sucesso

**Arquivo: `src/pages/Index.tsx` (ou componente raiz)**
- Executar migração automaticamente uma vez ao carregar a aplicação

## Resumo Técnico

```typescript
// Em useAccounts.ts - nova função
const migrateFromLocalStorage = async () => {
  const localAccounts = localStorage.getItem("accounts");
  if (!localAccounts || !user) return;
  
  const accounts = JSON.parse(localAccounts);
  if (accounts.length === 0) return;
  
  // Converter formato antigo para novo e inserir
  for (const account of accounts) {
    await supabase.from("accounts_receivable").insert({
      client_name: account.cliente,
      descricao: account.descricao,
      valor_total: account.valor,
      valor_pago: account.valorPago || 0,
      parcelas: account.numeroParcelas || 1,
      forma_pagamento: account.formaPagamento,
      status: account.status,
      vencimento: account.dataVencimento || null,
      created_by: user.id,
    });
  }
  
  // Limpar localStorage após migração
  localStorage.removeItem("accounts");
  toast({ title: "Contas migradas com sucesso!" });
};
```

Esta solução preserva todos os seus dados existentes e migra automaticamente para o banco de dados.
