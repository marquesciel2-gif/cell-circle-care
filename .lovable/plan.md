## Problemas

**1. "Contas" com ícone (parecendo emoji) em Relatórios**
Na seção Relatórios, a aba aparece apenas como "Contas" acompanhada do ícone FileText — visualmente parece "Contas + emoji". O rótulo correto é "Contas a Receber".

Local: `src/components/reports/ReportsSection.tsx` (linha 32).

**2. Aba "Clientes" trava ao abrir**
Verifiquei a base de dados: existem apenas 3 clientes, então não é volume. O hook `useClients` chama `supabase.rpc("get_clients_for_user")`, que faz uma subconsulta `EXISTS` em `accounts_receivable` para calcular `tem_debito`. Não encontrei erro de runtime nem log capturado (a sessão atual está na tela de login, então não deu para reproduzir o travamento ao vivo).

Causas mais prováveis do "trava":
- Se a chamada RPC falha silenciosamente, o estado `loading` fica `true` para sempre porque o `setLoading(false)` está no `finally` — isso, na prática, não trava, mas se uma exceção é lançada antes, o spinner gira eternamente. Já está protegido.
- A subconsulta `EXISTS` pode demorar caso `accounts_receivable` cresça e não tenha índice em `client_id`.
- O AlertDialog de exclusão é renderizado para cada cliente dentro do `.map`. Com poucos clientes não trava, mas o padrão pode ficar pesado e congelar o input ao abrir/fechar.

## Correções

### Corrigir rótulo da aba (rápido)
Em `src/components/reports/ReportsSection.tsx`, alterar o texto da TabsTrigger de `"Contas"` para `"Contas a Receber"`.

### Endurecer a aba Clientes contra travamento
- Adicionar timeout/abort à chamada RPC em `useClients.ts` para que, se a requisição demorar demais, o `loading` seja resolvido e uma mensagem de erro apareça (em vez de spinner infinito).
- Garantir que o `setLoading(false)` execute mesmo se `user` mudar no meio da chamada.
- Criar índice em `accounts_receivable(client_id, status)` para acelerar a subconsulta `EXISTS` usada no `get_clients_for_user`.
- (Defensivo) Mover o `AlertDialog` de exclusão para um único componente com estado controlado (um cliente alvo por vez) em vez de renderizar um dialog por linha. Isso reduz o custo de render e evita travamentos quando a lista crescer.

## Detalhes Técnicos

**ReportsSection.tsx (linha 30-33)**
```tsx
<TabsTrigger value="contas" className="gap-2">
  <FileText className="h-4 w-4" />
  Contas a Receber
</TabsTrigger>
```

**useClients.ts** — adicionar timeout e log explícito:
```ts
const { data, error } = await Promise.race([
  supabase.rpc("get_clients_for_user"),
  new Promise<never>((_, rej) =>
    setTimeout(() => rej(new Error("Tempo esgotado ao carregar clientes")), 15000)
  ),
]) as any;
```

**Migração SQL** — índice para acelerar `tem_debito`:
```sql
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client_status
  ON public.accounts_receivable (client_id, status);
```

**ClientsSection.tsx** — refatorar para um único `<AlertDialog>` controlado por `deletingClient` em vez de um por item.

## Arquivos afetados
- `src/components/reports/ReportsSection.tsx` (rótulo da aba)
- `src/hooks/useClients.ts` (timeout e tratamento de erro)
- `src/components/clients/ClientsSection.tsx` (AlertDialog único controlado)
- nova migração SQL (índice em `accounts_receivable`)

## Validação
- Abrir Relatórios → conferir aba "Contas a Receber" com ícone correto.
- Abrir aba Clientes → lista carrega ou exibe erro em até 15s; excluir um cliente continua funcionando.
