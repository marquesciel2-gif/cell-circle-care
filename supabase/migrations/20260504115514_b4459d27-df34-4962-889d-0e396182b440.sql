CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client_status
  ON public.accounts_receivable (client_id, status);