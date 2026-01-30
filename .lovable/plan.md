

## Corrigir Configurações e Adicionar Cadastro de Clientes

### Problema Identificado: Configurações Não Aplicadas

As configurações salvas (nome da loja, telefone, endereço) não estão sendo utilizadas em todos os lugares:

| Local | Status Atual |
|-------|--------------|
| Header.tsx | Fixo "CellStore" |
| Sidebar.tsx | Fixo "CellStore" |
| PaymentReceipt.tsx | Usa configurações |
| ReceiptModal.tsx | Usa configurações |

---

### Solução para Configurações

#### 1. Atualizar Header.tsx
- Importar `useLocalStorage` e `AppSettings`
- Buscar configurações do localStorage
- Exibir o nome da loja configurado ao invés de "CellStore" fixo

#### 2. Atualizar Sidebar.tsx
- Importar `useLocalStorage` e `AppSettings`
- Buscar configurações do localStorage
- Exibir o nome da loja configurado no topo do menu

---

### Nova Funcionalidade: Cadastro de Clientes

#### Novo Tipo: Cliente
```typescript
export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  dataCadastro: string;
}
```

#### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/clients/ClientsSection.tsx` | Página principal de clientes |
| `src/components/modals/AddClientModal.tsx` | Modal para adicionar cliente |
| `src/components/modals/EditClientModal.tsx` | Modal para editar cliente |

#### Funcionalidades da Seção de Clientes
- Lista de clientes cadastrados
- Busca por nome ou telefone
- Adicionar novo cliente
- Editar dados do cliente
- Excluir cliente
- Total de clientes cadastrados

---

### Interface do Usuário

**Tela de Clientes:**
```text
┌─────────────────────────────────────────────────────────┐
│  👥 Clientes                    [+ Novo Cliente]        │
├─────────────────────────────────────────────────────────┤
│  🔍 [Buscar por nome ou telefone...               ]     │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 👤 João Silva                                      │ │
│  │    📞 (11) 99999-1234  |  📧 joao@email.com       │ │
│  │    📍 Rua das Flores, 123                         │ │
│  │    📅 Cadastrado em: 29/01/2026                   │ │
│  │                              [✏️] [🗑️]           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 👤 Maria Santos                                    │ │
│  │    📞 (11) 98888-5678  |  📧 maria@email.com      │ │
│  │    📍 Av. Brasil, 456                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  Total: 2 clientes cadastrados                          │
└─────────────────────────────────────────────────────────┘
```

---

### Navegação

Adicionar nova entrada no Sidebar:
- Ícone: `Users` do lucide-react
- Label: "Clientes"
- Posição: Entre "Móveis e Eletros" e "Consertos"

---

### Ordem de Implementação

1. **Corrigir Header.tsx** - Usar nome da loja das configurações
2. **Corrigir Sidebar.tsx** - Usar nome da loja das configurações
3. **Criar tipo Cliente** em `src/types/index.ts`
4. **Criar ClientsSection.tsx** - Lista de clientes
5. **Criar AddClientModal.tsx** - Formulário de cadastro
6. **Criar EditClientModal.tsx** - Formulário de edição
7. **Atualizar Sidebar.tsx** - Adicionar link para Clientes
8. **Atualizar Index.tsx** - Renderizar seção de Clientes

