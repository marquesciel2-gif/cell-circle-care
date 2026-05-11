## Objetivo

Tornar todos os módulos do sistema verdadeiramente conectados ao cliente e entre si, eliminando dados soltos e duplicados.

## 1. Cliente em todo lugar (vínculo real, não só nome)

**Onde adicionar o seletor de clientes (`ClientPicker`):**
- ✅ Nova Conta (já feito)
- ✅ Novo Conserto (já feito)
- Editar Conserto (`EditRepairModal`)
- Editar Conta (`EditAccountModal`)
- Modal de venda de estoque (novo — ver seção 3)

**Salvar `client_id` (não só `client_name`):**
- Quando o usuário escolher um cliente do dropdown, gravar o `client_id` em `repairs` e `accounts_receivable`. Hoje o campo existe nas tabelas mas está sendo ignorado.
- Se o usuário digitar um nome novo (sem selecionar), oferecer um checkbox "Cadastrar este cliente" para criar o registro automaticamente e já vincular.

**Ficha do cliente (nova aba na seção Clientes):**
Ao clicar num cliente, abrir um painel/drawer com:
- Dados de contato
- Aba "Consertos" — todos os consertos desse cliente (status, data, valor)
- Aba "Contas" — todas as contas (status, valor pago/pendente)
- Resumo: total já pago, total em aberto, nº de serviços

## 2. Conserto → Conta automática

Ao finalizar um conserto (`FinishRepairModal`):
- Após informar o valor, perguntar **"Como o cliente vai pagar?"** com 3 opções:
  - **À vista (já pago)** → cria a conta com `valor_pago = valor_total`, status `pago`, sem gerar pendência
  - **Cartão** → cria conta paga, forma `cartao`
  - **Promissória/Fiado** → abre data de vencimento + parcelas, cria conta `pendente`
- A conta gerada herda `client_id`, `client_name` do conserto e descrição `"Conserto: {device} – {problem}"`.

## 3. Venda de estoque → Baixa + Conta

Substituir o botão "Vender" atual (que apenas decrementa quantidade silenciosamente) por um modal **"Registrar Venda"**:
- Seleciona cliente (via `ClientPicker`)
- Quantidade vendida (default 1)
- Preço de venda (pré-preenchido com `preco_venda` do item, editável)
- Forma de pagamento (à vista / cartão / promissória)
- Se promissória: vencimento + parcelas

Ao confirmar:
1. Decrementa `quantidade` no estoque
2. Cria conta a receber vinculada (paga ou pendente conforme forma)
3. Toast com link "Ver conta"

## 4. Navegação cruzada (links clicáveis)

- Nos cards de **Contas a Receber**: nome do cliente vira link → abre ficha do cliente
- Nos cards de **Consertos**: nome do cliente vira link → abre ficha do cliente
- Na ficha do cliente: cada conserto/conta linka pra sua seção

## Detalhes técnicos

**Schema (sem alterações estruturais necessárias):**
- `repairs.client_id` e `accounts_receivable.client_id` já existem — só passar a popular.
- Considerar adicionar índices em `client_id` para consultas por cliente.

**Hooks novos/atualizados:**
- `useClientHistory(clientId)` — busca consertos + contas do cliente
- `useRepairs.finishRepair` ganha parâmetro opcional `accountData` e dispara `addAccount` em sequência
- `useInventory.sellItem(id, payload)` substitui `decrementQuantity`, fazendo decremento + criar conta

**Componentes novos:**
- `ClientDetailDrawer` (sheet com tabs)
- `SellInventoryModal`
- `FinishRepairModal` revisado (com seleção de forma de pagamento)

**Componentes atualizados:**
- `EditRepairModal`, `EditAccountModal` → usar `ClientPicker`
- `ClientsSection` → linha clicável abrindo o drawer
- `RepairsSection`, `AccountsReceivable` → cliente clicável

**RLS:** nenhuma mudança — políticas existentes já cobrem inserts cruzados (vendedor cria sua própria conta; admin tudo).

## Fora de escopo

- Não migra dados antigos (registros existentes sem `client_id` continuam apenas com nome)
- Não altera relatórios/recibos nesta etapa
