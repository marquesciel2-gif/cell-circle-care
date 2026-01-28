
## Correção das Ações do Dashboard

### Problema Identificado
O componente `QuickActions` espera receber uma função `onNavigate` para navegar entre as seções do app, mas o `Dashboard` não está passando essa prop. Por isso, quando você clica nos botões de ação rápida, nada acontece.

### Solução

**1. Atualizar `Dashboard.tsx`**
- Adicionar uma prop `onNavigate` ao componente Dashboard
- Passar essa prop para o componente `QuickActions`

**2. Atualizar `Index.tsx`**
- Passar a função `setActiveSection` como prop `onNavigate` para o Dashboard

### Mudanças Técnicas

**src/components/dashboard/Dashboard.tsx:**
```tsx
interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  // ... código existente ...
  
  <QuickActions onNavigate={onNavigate} />
}
```

**src/pages/Index.tsx:**
```tsx
case "dashboard":
  return <Dashboard onNavigate={setActiveSection} />;
```

### Resultado
Após essa correção, ao clicar em "Novo Aparelho" no Dashboard, você será direcionado para a seção de Aparelhos Novos, e assim por diante para todas as ações rápidas.
