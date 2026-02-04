

## Adicionar Aba de Despesas aos Relatórios

### Objetivo
Criar uma nova aba "Despesas" na seção de Relatórios para permitir o registro e visualização de despesas do negócio (contas de luz, aluguel, fornecedores, etc.).

### Arquitetura da Solução

```text
+-------------------+     +------------------+     +-------------------+
|  ReportsSection   |---->|  ExpensesReport  |---->|   useExpenses     |
|  (adicionar aba)  |     |  (novo componente)|     |   (novo hook)     |
+-------------------+     +------------------+     +-------------------+
                                                            |
                                                            v
                                                   +-------------------+
                                                   |  Tabela expenses  |
                                                   |  (novo no banco)  |
                                                   +-------------------+
```

### Implementacao

#### 1. Criar Tabela no Banco de Dados
Criar a tabela `expenses` com as seguintes colunas:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Identificador unico |
| descricao | TEXT | Descricao da despesa |
| valor | NUMERIC | Valor da despesa |
| categoria | TEXT | Categoria (aluguel, luz, fornecedor, etc.) |
| data_despesa | DATE | Data em que a despesa ocorreu |
| forma_pagamento | TEXT | Forma de pagamento |
| status | TEXT | pago, pendente |
| created_by | UUID | Usuario que registrou |
| created_at | TIMESTAMP | Data de criacao |
| updated_at | TIMESTAMP | Data de atualizacao |

Politicas RLS:
- Admins: acesso total (SELECT, INSERT, UPDATE, DELETE)
- Vendedores: podem inserir e ver apenas suas proprias despesas
- Bloquear acesso anonimo

#### 2. Criar Hook useExpenses
Novo arquivo: `src/hooks/useExpenses.ts`

Funcionalidades:
- `fetchExpenses()` - Buscar despesas
- `addExpense()` - Adicionar nova despesa
- `updateExpense()` - Atualizar despesa
- `deleteExpense()` - Remover despesa
- Calculos de totais por categoria e periodo

#### 3. Criar Componente ExpensesReport
Novo arquivo: `src/components/reports/ExpensesReport.tsx`

Elementos:
- Cards de resumo por categoria (Aluguel, Energia, Fornecedores, Outros)
- Filtros por data, categoria e status
- Tabela listando despesas
- Botao para adicionar nova despesa
- Botao de impressao

#### 4. Criar Modal AddExpenseModal
Novo arquivo: `src/components/modals/AddExpenseModal.tsx`

Campos do formulario:
- Descricao
- Valor
- Categoria (select com opcoes predefinidas)
- Data da despesa (date picker)
- Forma de pagamento
- Status (pago/pendente)

#### 5. Atualizar ReportsSection
Modificar: `src/components/reports/ReportsSection.tsx`

Alteracoes:
- Adicionar nova aba "Despesas" ao TabsList
- Importar e renderizar ExpensesReport no TabsContent
- Atualizar grid-cols de 2 para 3

---

### Detalhes Tecnicos

**Arquivos a criar:**
1. Migracao SQL para tabela `expenses`
2. `src/hooks/useExpenses.ts`
3. `src/components/reports/ExpensesReport.tsx`
4. `src/components/modals/AddExpenseModal.tsx`

**Arquivos a modificar:**
1. `src/components/reports/ReportsSection.tsx`
2. `src/types/index.ts` (adicionar tipo Expense)

**Categorias de despesas sugeridas:**
- aluguel (Aluguel)
- energia (Energia/Luz)
- agua (Agua)
- internet (Internet/Telefone)
- fornecedor (Fornecedores)
- manutencao (Manutencao)
- salarios (Salarios)
- impostos (Impostos)
- outros (Outros)

**Controle de acesso:**
- Apenas admins e vendedores terao acesso a aba de despesas
- Segue o mesmo padrao de RLS das outras tabelas financeiras

