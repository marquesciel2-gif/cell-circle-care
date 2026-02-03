
# Plano: Adicionar "Lembrar Usuário" na Página de Login

## Resumo

A página de login já está habilitada e funcional. Vou adicionar uma opção "Lembrar-me" que salva o e-mail do usuário para facilitar o próximo acesso.

## O que será feito

### Funcionalidade "Lembrar-me"
- Adicionar um checkbox "Lembrar-me" abaixo do campo de senha
- Quando marcado, o e-mail será salvo no navegador
- Na próxima visita, o campo de e-mail será preenchido automaticamente
- Se desmarcado, o e-mail salvo será removido

## Experiência do Usuário

1. **Primeiro acesso**: Usuário digita e-mail e senha, marca "Lembrar-me"
2. **Próximo acesso**: O campo de e-mail já vem preenchido, basta digitar a senha
3. **Desmarcar**: Se o usuário desmarcar a opção, o e-mail salvo é apagado

---

## Detalhes Técnicos

### Arquivo: `src/pages/Login.tsx`

**Alterações:**
1. Importar o componente `Checkbox` do UI
2. Adicionar estado `rememberMe` para controlar o checkbox
3. Usar `useEffect` para carregar e-mail salvo do localStorage ao montar
4. No submit, salvar ou remover o e-mail do localStorage conforme o checkbox
5. Adicionar o checkbox entre o campo de senha e o botão de login

```tsx
// Novos imports
import { Checkbox } from "@/components/ui/checkbox";

// Novos estados
const [rememberMe, setRememberMe] = useState(false);

// useEffect para carregar e-mail salvo
useEffect(() => {
  const savedEmail = localStorage.getItem("rememberedEmail");
  if (savedEmail) {
    setEmail(savedEmail);
    setRememberMe(true);
  }
}, []);

// No handleSubmit, antes do signIn:
if (rememberMe) {
  localStorage.setItem("rememberedEmail", email);
} else {
  localStorage.removeItem("rememberedEmail");
}

// Novo elemento no formulário (após campo de senha):
<div className="flex items-center space-x-2">
  <Checkbox 
    id="remember" 
    checked={rememberMe}
    onCheckedChange={(checked) => setRememberMe(checked === true)}
  />
  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
    Lembrar meu e-mail
  </Label>
</div>
```

### Segurança
- Apenas o e-mail é salvo (nunca a senha)
- Os dados ficam no navegador do usuário (localStorage)
- A sessão de autenticação já é gerenciada pelo sistema de forma segura
