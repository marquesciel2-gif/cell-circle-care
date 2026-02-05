-- Adicionar políticas RLS para funcionários na tabela clients

-- 1. Política de SELECT para funcionários (técnicos e vendedores)
CREATE POLICY "Staff can select own clients"
ON public.clients FOR SELECT
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);

-- 2. Política de UPDATE para funcionários
CREATE POLICY "Staff can update own clients"
ON public.clients FOR UPDATE
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);

-- 3. Política de DELETE para funcionários
CREATE POLICY "Staff can delete own clients"
ON public.clients FOR DELETE
USING (
  (has_role(auth.uid(), 'tecnico') OR has_role(auth.uid(), 'vendedor'))
  AND created_by = auth.uid()
);