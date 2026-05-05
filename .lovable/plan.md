## Objetivo

Na aba "Entregues" de Consertos, exibir a **data em que o aparelho foi entregue ao cliente** em vez da data de entrada/previsão.

## Mudanças

### 1. Banco de dados
Adicionar coluna `delivered_at` (timestamp) na tabela `repairs`. Não dá para reaproveitar `finished_at` porque esse já marca o momento em que o conserto fica "pronto" (antes da entrega).

### 2. `src/hooks/useRepairs.ts`
- Incluir `delivered_at` na interface `Repair`.
- Em `deliverRepair`, gravar `delivered_at: new Date().toISOString()` junto com `status: "entregue"`.

### 3. `src/components/repairs/RepairsSection.tsx`
No `RepairCard`, na linha de data:
- Se `status === "entregue"` e existir `delivered_at` → mostrar `Entregue em: dd/MM/yyyy`.
- Caso contrário → manter `Entrada: dd/MM/yyyy` como hoje.

## Observação
Consertos já entregues antes desta mudança não terão `delivered_at` preenchido — para esses, será exibida a data de entrada como fallback.
