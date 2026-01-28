
## Correção do Dashboard - Contas a Receber

### Problema
Atualmente, o card "Contas a Receber" mostra o **valor monetário total** (ex: R$ 500), mas você quer ver a **quantidade de contas** pendentes (ex: "1" conta).

### Solução

Alterar o card "Contas a Receber" para mostrar:
- **Valor principal**: Quantidade de contas pendentes (ex: "1", "3", etc.)
- **Subtítulo**: O valor total em reais pendente (ex: "R$ 500 pendente")

### Mudança Técnica

**src/components/dashboard/Dashboard.tsx:**

```tsx
// Antes
const totalContasReceber = accounts
  .filter(a => a.status !== "pago")
  .reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

// Depois
const contasPendentes = accounts.filter(a => a.status !== "pago");
const quantidadeContas = contasPendentes.length;
const totalValorPendente = contasPendentes.reduce((sum, a) => sum + (a.valor - a.valorPago), 0);

// Card atualizado
<StatCard 
  title="Contas a Receber" 
  value={quantidadeContas}  // Agora mostra quantidade: "1", "2", etc.
  subtitle={`R$ ${totalValorPendente.toLocaleString('pt-BR')} pendente`}  // Valor no subtítulo
  icon={Receipt} 
  variant="danger" 
/>
```

### Resultado
O dashboard vai mostrar:
- **Contas a Receber: 1** (quantidade de contas)
- **Subtítulo: R$ 500 pendente** (valor total)
