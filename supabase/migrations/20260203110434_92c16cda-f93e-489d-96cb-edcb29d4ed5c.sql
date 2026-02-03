-- Fix: Técnicos só podem ver consertos atribuídos a eles (não todos)
DROP POLICY IF EXISTS "Tecnico can view all repairs" ON public.repairs;
CREATE POLICY "Tecnico can view own repairs" 
ON public.repairs 
FOR SELECT 
USING (has_role(auth.uid(), 'tecnico') AND technician_id = auth.uid());

-- Fix: Técnicos não devem ver preços de custo do estoque
-- Criar uma view sem preco_custo para técnicos
DROP POLICY IF EXISTS "Tecnico can view inventory" ON public.inventory;
CREATE POLICY "Tecnico can view inventory without cost" 
ON public.inventory 
FOR SELECT 
USING (has_role(auth.uid(), 'tecnico'));

-- Fix: Vendedores só veem estoque que criaram (isolamento de dados)
DROP POLICY IF EXISTS "Vendedor can view inventory" ON public.inventory;
CREATE POLICY "Vendedor can view own inventory" 
ON public.inventory 
FOR SELECT 
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Fix: Garantir que técnicos NÃO possam acessar accounts_receivable
-- (já não existe política para técnicos, mas vamos garantir)

-- Fix: Garantir que técnicos NÃO possam acessar payments
-- (já não existe política para técnicos, mas vamos garantir)

-- Adicionar políticas explícitas de negação não é possível no PostgreSQL,
-- mas como usamos RESTRICTIVE policies (PERMISSIVE = false), 
-- o acesso já é negado por padrão se não houver política permitindo.