

## Sistema de Relatórios e Comprovantes

### Resumo
Implementar um sistema completo de relatórios e comprovantes para a loja de celulares, incluindo:
- **Relatório de Vendas**: Lista de vendas com filtros por período
- **Relatório de Novas Contas**: Contas criadas com detalhes
- **Comprovantes para Promissórias**: Geração de comprovante para cada parcela
- **Comprovantes À Vista**: Comprovante único para pagamentos à vista

---

### Funcionalidades

#### 1. Nova Seção "Relatórios" na Navegação
- Adicionar nova opção "Relatórios" no menu lateral (Sidebar)
- Página dedicada com tabs para cada tipo de relatório

#### 2. Relatório de Vendas
- Lista todas as vendas realizadas (itens com status "vendido" ou quantidade reduzida)
- Filtros por data (período)
- Totais por categoria (Novos, Usados, Acessórios)
- Botão para imprimir/exportar

#### 3. Relatório de Contas a Receber
- Lista todas as contas com status e valores
- Resumo: total pendente, atrasado, recebido
- Filtros por forma de pagamento (Promissória, À Vista, Cartão)

#### 4. Comprovantes de Pagamento

**Para Promissórias (Parcelado):**
- Gera um comprovante individual para cada parcela
- Cada comprovante contém:
  - Dados da loja (nome, telefone, endereço)
  - Dados do cliente (nome, telefone)
  - Número da parcela (ex: "Parcela 1 de 3")
  - Valor da parcela
  - Data de vencimento
  - Descrição do produto/serviço
- Opção de imprimir ou baixar PDF

**Para Pagamentos À Vista:**
- Comprovante único com valor total
- Mesmo layout dos dados da loja e cliente
- Indicação "Pagamento À Vista"

---

### Estrutura de Arquivos

```
src/
├── components/
│   ├── reports/
│   │   ├── ReportsSection.tsx         # Página principal de relatórios
│   │   ├── SalesReport.tsx            # Relatório de vendas
│   │   ├── AccountsReport.tsx         # Relatório de contas
│   │   └── PaymentReceipt.tsx         # Componente de comprovante
│   └── modals/
│       └── ReceiptModal.tsx           # Modal para visualizar/imprimir comprovante
```

---

### Interface do Usuário

**Tela de Relatórios:**
```
┌─────────────────────────────────────────────────────────┐
│  📊 Relatórios                                          │
├─────────────────────────────────────────────────────────┤
│  [Vendas]  [Contas]  [Comprovantes]                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filtros: [Período ▼]  [Categoria ▼]  🔍 Buscar        │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Produto         │ Cliente │ Valor   │ Data        │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ iPhone 15 Pro   │ João    │ R$ 6999 │ 28/01/2026  │ │
│  │ Galaxy S24      │ Maria   │ R$ 7499 │ 27/01/2026  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Total: R$ 14.498,00                    [🖨️ Imprimir]  │
└─────────────────────────────────────────────────────────┘
```

**Comprovante de Promissória:**
```
┌─────────────────────────────────────────────────────────┐
│                    COMPROVANTE DE PAGAMENTO             │
│                    ═══════════════════════              │
│                                                         │
│  📱 CellStore                                           │
│  📞 (11) 99999-0000                                     │
│  📍 Rua das Flores, 123                                 │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Cliente: João Silva                                    │
│  Telefone: (11) 99999-1234                              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Descrição: iPhone 12 - Conserto de tela               │
│  Forma de Pagamento: PROMISSÓRIA                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │           PARCELA 1 DE 3                          │ │
│  │           Valor: R$ 150,00                        │ │
│  │           Vencimento: 20/01/2025                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Valor Total: R$ 450,00                                │
│                                                         │
│  Data de Emissão: 29/01/2026                           │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Assinatura: _________________________                  │
└─────────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

**1. Novo tipo para registrar vendas (src/types/index.ts):**
```typescript
export interface Sale {
  id: number;
  itemId: number;
  itemNome: string;
  tipo: "novos" | "usados" | "acessorios";
  preco: number;
  dataVenda: string;
  cliente?: string;
}
```

**2. Hook para histórico de vendas:**
- Criar `useLocalStorage` para armazenar vendas quando o botão "Vender" for clicado
- Registrar: produto, preço, data, categoria

**3. Componente de Comprovante:**
- Usa CSS `@media print` para formatação de impressão
- Função `window.print()` para impressão direta
- Layout responsivo que funciona tanto em tela quanto impresso

**4. Geração de Parcelas:**
- Para promissórias com N parcelas:
  - Divide valor total por N parcelas
  - Gera vencimentos mensais a partir da data de criação
  - Permite gerar comprovante individual por parcela

**5. Botão "Gerar Comprovante" na lista de Contas:**
- Adicionar ícone de impressora em cada conta
- Abre modal com preview do comprovante
- Opções: Imprimir Tudo / Imprimir Parcela X

---

### Ordem de Implementação

1. **Criar tipos** (`Sale` para histórico de vendas)
2. **Atualizar InventoryTable** para registrar vendas no localStorage
3. **Criar componente PaymentReceipt** (comprovante)
4. **Criar modal ReceiptModal** para visualização
5. **Criar ReportsSection** com tabs
6. **Criar SalesReport** (relatório de vendas)
7. **Criar AccountsReport** (relatório de contas)
8. **Atualizar Sidebar** com link para Relatórios
9. **Atualizar AccountsReceivable** com botão de comprovante
10. **Atualizar Index.tsx** com nova seção

