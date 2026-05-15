ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'manual';
UPDATE public.accounts_receivable SET origem = 'venda' WHERE descricao ILIKE 'venda%' AND origem = 'manual';
UPDATE public.accounts_receivable SET origem = 'conserto' WHERE descricao ILIKE 'conserto%' AND origem = 'manual';
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_origem ON public.accounts_receivable(origem);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client_id ON public.accounts_receivable(client_id);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS fornecedor_nome text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS fornecedor_id uuid;
CREATE INDEX IF NOT EXISTS idx_expenses_fornecedor_id ON public.expenses(fornecedor_id);