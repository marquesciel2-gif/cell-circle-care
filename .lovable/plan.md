

## Migrar Autenticação de CPF para Email (Limpeza Completa)

### Resumo
Remover completamente o sistema de CPF e migrar para autenticação por email, apagando todos os dados existentes.

---

### Dados a Serem Removidos

**Tabela `profiles`:**
| user_id | cpf | nome |
|---------|-----|------|
| 91d0ad14-... | 07425086336 | Francisco Jaciel Silva |

Este registro será removido junto com a conta de autenticação associada.

---

### Etapas de Implementação

#### 1. Limpeza do Banco de Dados
Executar migração SQL para:
- Apagar todos os registros da tabela `profiles`
- Renomear coluna `cpf` para `email`

```sql
-- Apagar todos os perfis existentes
DELETE FROM profiles;

-- Renomear coluna cpf para email
ALTER TABLE profiles RENAME COLUMN cpf TO email;
```

**Nota:** Os usuários na tabela `auth.users` do Supabase também precisarão ser removidos. Isso será feito automaticamente quando você fizer logout, pois sem o perfil associado, a conta ficará órfã.

#### 2. Atualizar Hook de Autenticação
**Arquivo:** `src/hooks/useAuth.ts`
- Remover conversão de CPF para pseudo-email
- Usar email diretamente nas funções `signUp` e `signIn`
- Salvar email no perfil ao invés de CPF

#### 3. Atualizar Página de Login
**Arquivo:** `src/pages/Login.tsx`
- Trocar campo de CPF por Email
- Remover máscara/formatação de CPF
- Atualizar validação para formato de email
- Atualizar textos (labels, placeholders, mensagens)

#### 4. Atualizar Página de Cadastro
**Arquivo:** `src/pages/Cadastro.tsx`
- Trocar campo de CPF por Email
- Remover máscara/formatação de CPF
- Atualizar validação para formato de email
- Atualizar textos

---

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `profiles` (banco) | Apagar dados + renomear coluna |
| `src/hooks/useAuth.ts` | Simplificar para email direto |
| `src/pages/Login.tsx` | Campo email + validação |
| `src/pages/Cadastro.tsx` | Campo email + validação |

---

### Resultado Final

**Antes (CPF):**
- Login: `074.250.863-36` + senha
- Internamente: `07425086336@cpf.local`

**Depois (Email):**
- Login: `usuario@email.com` + senha
- Internamente: `usuario@email.com` (direto)

---

### Ordem de Execução

1. Migração SQL (apagar dados + renomear coluna)
2. Atualizar `useAuth.ts`
3. Atualizar `Login.tsx`
4. Atualizar `Cadastro.tsx`
5. Testar novo fluxo de cadastro e login

