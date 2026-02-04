-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  data_despesa DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything on expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vendedor can manage own expenses
CREATE POLICY "Vendedor can manage own expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Block anonymous access
CREATE POLICY "Deny anon access to expenses"
ON public.expenses
FOR ALL
USING (false)
WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();