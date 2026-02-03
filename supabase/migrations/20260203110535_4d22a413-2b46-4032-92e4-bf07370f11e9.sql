-- Criar view de inventário sem preço de custo para técnicos
CREATE OR REPLACE VIEW public.inventory_public
WITH (security_invoker=on) AS
  SELECT id, nome, descricao, categoria, quantidade, preco_venda, created_at, updated_at, created_by
  FROM public.inventory;
-- Nota: preco_custo é excluído da view

-- Criar view de clientes para uso geral (sem dados sensíveis expostos em logs)
-- Mantemos os dados na tabela original protegidos por RLS

-- Nota sobre proteção contra senhas vazadas:
-- Esta configuração precisa ser ativada no painel do Supabase Auth Settings
-- Infelizmente não é possível ativar via SQL migration