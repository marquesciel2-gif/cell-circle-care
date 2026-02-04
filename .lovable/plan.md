
# Plano: Ajustar Políticas RLS da Tabela Clientes

## Resumo

Vamos corrigir as políticas de segurança (RLS) da tabela `clients` para garantir que técnicos e vendedores possam gerenciar apenas os clientes que eles próprios criaram, enquanto administradores mantêm acesso total.

## Problema Atual

Atualmente as políticas estão incompletas:
- Não existe política de **UPDATE** para funcionários
- Não existe política de **DELETE** para funcionários  
- A política de **SELECT** bloqueia funcionários (eles dependem da função `get_clients_for_user`)

Isso causa erros quando funcionários tentam editar ou excluir clientes.

## Alterações no Banco de Dados

Vamos adicionar as políticas faltantes via migração SQL:

### 1. Política de SELECT para Funcionários
Permitir que técnicos e vendedores vejam apenas seus próprios clientes:

```sql
CREATE POLICY "Staff can select own clients"
ON public.clients FOR SELECT
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);
```

### 2. Política de UPDATE para Funcionários
Permitir atualização apenas dos próprios clientes:

```sql
CREATE POLICY "Staff can update own clients"
ON public.clients FOR UPDATE
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);
```

### 3. Política de DELETE para Funcionários
Permitir exclusão apenas dos próprios clientes:

```sql
CREATE POLICY "Staff can delete own clients"
ON public.clients FOR DELETE
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);
```

## Visão Geral das Políticas Finais

| Operação | Administrador | Técnico/Vendedor |
|----------|---------------|------------------|
| SELECT   | Todos os clientes | Apenas `created_by = auth.uid()` |
| INSERT   | Qualquer cliente | Apenas com `created_by = auth.uid()` |
| UPDATE   | Todos os clientes | Apenas `created_by = auth.uid()` |
| DELETE   | Todos os clientes | Apenas `created_by = auth.uid()` |

## Mascaramento de Dados (já implementado)

O mascaramento de email e endereço para funcionários é tratado pela função `get_clients_for_user()` que já existe e retorna NULL para esses campos quando o usuário não é admin.

## Nenhuma Alteração de Código Necessária

O código em `useClients.ts` já está preparado:
- `fetchClients` usa a função RPC segura
- `addClient`, `updateClient`, `deleteClient` usam operações diretas que serão protegidas pelas novas políticas

## Verificação Pós-Implementação

Após aplicar as políticas:
1. Testar login como técnico/vendedor
2. Criar um novo cliente
3. Editar o cliente criado
4. Excluir o cliente criado
5. Verificar que não é possível ver/editar clientes de outros usuários
