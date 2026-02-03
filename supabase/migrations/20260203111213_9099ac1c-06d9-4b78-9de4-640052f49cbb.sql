-- Remover view que não tem RLS (views não suportam RLS diretamente)
DROP VIEW IF EXISTS public.clients_limited;

-- A função get_clients_for_user já é SECURITY DEFINER e faz o controle de acesso
-- Não precisamos da view, a função já resolve o problema de forma segura