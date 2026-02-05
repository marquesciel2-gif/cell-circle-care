-- Primeiro remover a função antiga
DROP FUNCTION IF EXISTS public.get_clients_for_user();

-- Recriar com novo retorno incluindo tem_debito
CREATE OR REPLACE FUNCTION public.get_clients_for_user()
RETURNS TABLE (
  id uuid,
  nome text,
  telefone text,
  email text,
  endereco text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  tem_debito boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;