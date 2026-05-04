CREATE OR REPLACE FUNCTION public.get_inventory_for_user()
 RETURNS TABLE(id uuid, nome text, descricao text, categoria text, quantidade integer, preco_custo numeric, preco_venda numeric, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.get_clients_for_user()
 RETURNS TABLE(id uuid, nome text, telefone text, email text, endereco text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, tem_debito boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Require authenticated user
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Caller must have at least one of the recognized roles
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor')) THEN
    RETURN;
  END IF;

  -- Admin vê todos os dados completos
  IF has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT 
      c.id,
      c.nome,
      c.telefone,
      c.email,
      c.endereco,
      c.created_by,
      c.created_at,
      c.updated_at,
      EXISTS (
        SELECT 1 FROM accounts_receivable ar 
        WHERE ar.client_id = c.id 
        AND ar.status = 'pendente'
      ) as tem_debito
    FROM clients c
    ORDER BY c.nome;
  ELSE
    -- Técnicos e vendedores: veem todos os clientes, mas só nome, telefone e débito
    RETURN QUERY
    SELECT 
      c.id,
      c.nome,
      c.telefone,
      NULL::text as email,
      NULL::text as endereco,
      c.created_by,
      c.created_at,
      c.updated_at,
      EXISTS (
        SELECT 1 FROM accounts_receivable ar 
        WHERE ar.client_id = c.id 
        AND ar.status = 'pendente'
      ) as tem_debito
    FROM clients c
    ORDER BY c.nome;
  END IF;
END;
$function$;