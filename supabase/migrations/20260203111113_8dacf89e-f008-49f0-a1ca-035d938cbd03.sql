-- 1. Remover políticas antigas de clientes
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can do everything on clients" ON public.clients;
DROP POLICY IF EXISTS "Tecnico can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Tecnico can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Vendedor can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Vendedor can manage own clients" ON public.clients;

-- 2. Criar novas políticas para tabela clients (acesso total só para admin)
CREATE POLICY "Admins full access to clients"
ON public.clients FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Técnicos e vendedores podem inserir clientes
CREATE POLICY "Staff can insert clients"
ON public.clients FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);

-- Negar SELECT direto na tabela clients para não-admins
-- (forçar uso da view)
CREATE POLICY "Non-admins cannot select clients directly"
ON public.clients FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 3. Criar view com dados limitados para colaboradores
CREATE OR REPLACE VIEW public.clients_limited
WITH (security_invoker=on) AS
SELECT 
  id,
  nome,
  telefone,
  created_by,
  created_at,
  updated_at
FROM public.clients;
-- email e endereco são excluídos

-- 4. Criar função para obter clientes baseado no papel do usuário
CREATE OR REPLACE FUNCTION public.get_clients_for_user()
RETURNS TABLE (
  id uuid,
  nome text,
  telefone text,
  email text,
  endereco text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin vê tudo
  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY SELECT c.id, c.nome, c.telefone, c.email, c.endereco, c.created_by, c.created_at, c.updated_at
    FROM clients c
    ORDER BY c.created_at DESC;
  -- Técnicos e vendedores veem só nome e telefone dos clientes que criaram
  ELSIF has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor') THEN
    RETURN QUERY SELECT c.id, c.nome, c.telefone, NULL::text as email, NULL::text as endereco, c.created_by, c.created_at, c.updated_at
    FROM clients c
    WHERE c.created_by = auth.uid()
    ORDER BY c.created_at DESC;
  END IF;
END;
$$;

-- 5. Proteger preços - remover view antiga e criar nova
DROP VIEW IF EXISTS public.inventory_public;

-- Criar função para obter inventário baseado no papel
CREATE OR REPLACE FUNCTION public.get_inventory_for_user()
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  categoria text,
  quantidade int,
  preco_custo numeric,
  preco_venda numeric,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin vê tudo incluindo preço de custo
  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, i.preco_custo, i.preco_venda, i.created_by, i.created_at, i.updated_at
    FROM inventory i
    ORDER BY i.created_at DESC;
  -- Vendedores veem seus itens com preços
  ELSIF has_role(auth.uid(), 'vendedor') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, i.preco_custo, i.preco_venda, i.created_by, i.created_at, i.updated_at
    FROM inventory i
    WHERE i.created_by = auth.uid()
    ORDER BY i.created_at DESC;
  -- Técnicos veem inventário sem preços
  ELSIF has_role(auth.uid(), 'tecnico') THEN
    RETURN QUERY SELECT i.id, i.nome, i.descricao, i.categoria, i.quantidade, NULL::numeric as preco_custo, NULL::numeric as preco_venda, i.created_by, i.created_at, i.updated_at
    FROM inventory i
    ORDER BY i.created_at DESC;
  END IF;
END;
$$;