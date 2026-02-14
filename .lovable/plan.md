

# Corrigir Edge Function de Criar Colaboradores

## Problema
A funcao backend de criar colaboradores retorna "non-2xx status code" porque:
1. A configuracao JWT nao esta definida no arquivo de configuracao, causando falhas de autenticacao
2. O frontend nao extrai corretamente a mensagem de erro do corpo da resposta quando o backend retorna erro

## Solucao

### 1. Configurar `verify_jwt = false` no config.toml
Adicionar a configuracao para que a validacao do JWT seja feita no codigo da funcao (que ja faz isso corretamente) em vez de ser feita automaticamente pelo sistema, que pode falhar com signing-keys.

### 2. Corrigir tratamento de erros no frontend (TeamSection.tsx)
Quando `supabase.functions.invoke` recebe um status non-2xx, ele coloca o erro em `response.error` como um objeto `FunctionsHttpError`. O corpo da resposta com a mensagem detalhada precisa ser extraido via `response.error.context.json()`.

Atualizar o `handleAddMember` para:
- Extrair a mensagem de erro real do corpo da resposta
- Exibir mensagens detalhadas vindas do backend

### Detalhes Tecnicos

**config.toml** - Adicionar:
```toml
[functions.create-collaborator]
verify_jwt = false
```

**TeamSection.tsx** - Corrigir o bloco de tratamento de erro:
```typescript
if (response.error) {
  let errorMsg = "Erro ao cadastrar colaborador";
  try {
    const errorBody = await response.error.context?.json();
    if (errorBody?.error) errorMsg = errorBody.error;
  } catch {
    errorMsg = response.error.message || errorMsg;
  }
  throw new Error(errorMsg);
}
```

