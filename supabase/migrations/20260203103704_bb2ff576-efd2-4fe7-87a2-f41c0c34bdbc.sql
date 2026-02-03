-- Adicionar política de delete para admin em clients
CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Adicionar política de delete para admin em inventory
CREATE POLICY "Admins can delete inventory"
ON public.inventory FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Adicionar política de delete para admin em repairs
CREATE POLICY "Admins can delete repairs"
ON public.repairs FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Adicionar política de delete para admin em accounts_receivable
CREATE POLICY "Admins can delete accounts"
ON public.accounts_receivable FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Adicionar política de delete para vendedor em seus próprios clientes
CREATE POLICY "Vendedor can delete own clients"
ON public.clients FOR DELETE
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Adicionar política de delete para vendedor em seu próprio inventário
CREATE POLICY "Vendedor can delete own inventory"
ON public.inventory FOR DELETE
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Adicionar política de delete para técnico em seus próprios consertos
CREATE POLICY "Tecnico can delete own repairs"
ON public.repairs FOR DELETE
USING (has_role(auth.uid(), 'tecnico') AND technician_id = auth.uid());