-- Tabela de Clientes
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "Admins can do everything on clients"
ON public.clients FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vendedor vê/edita os próprios clientes
CREATE POLICY "Vendedor can manage own clients"
ON public.clients FOR ALL
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Técnico pode cadastrar cliente (para conserto)
CREATE POLICY "Tecnico can insert clients"
ON public.clients FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tecnico') AND created_by = auth.uid());

-- Técnico pode ver os clientes que cadastrou
CREATE POLICY "Tecnico can view own clients"
ON public.clients FOR SELECT
USING (has_role(auth.uid(), 'tecnico') AND created_by = auth.uid());

-- Tabela de Consertos
CREATE TABLE public.repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    device TEXT NOT NULL,
    problem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    value DECIMAL(10,2),
    technician_id UUID,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "Admins can do everything on repairs"
ON public.repairs FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Técnico pode ver todos os consertos (leitura)
CREATE POLICY "Tecnico can view all repairs"
ON public.repairs FOR SELECT
USING (has_role(auth.uid(), 'tecnico'));

-- Técnico pode inserir consertos (se atribuído a ele)
CREATE POLICY "Tecnico can insert repairs"
ON public.repairs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'tecnico') AND technician_id = auth.uid());

-- Técnico pode editar consertos atribuídos a ele
CREATE POLICY "Tecnico can update own repairs"
ON public.repairs FOR UPDATE
USING (has_role(auth.uid(), 'tecnico') AND technician_id = auth.uid());

-- Tabela de Inventário
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    quantidade INTEGER NOT NULL DEFAULT 0,
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    categoria TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "Admins can do everything on inventory"
ON public.inventory FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vendedor pode consultar e cadastrar itens
CREATE POLICY "Vendedor can view inventory"
ON public.inventory FOR SELECT
USING (has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Vendedor can insert inventory"
ON public.inventory FOR INSERT
WITH CHECK (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

CREATE POLICY "Vendedor can update own inventory"
ON public.inventory FOR UPDATE
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Técnico pode consultar inventário
CREATE POLICY "Tecnico can view inventory"
ON public.inventory FOR SELECT
USING (has_role(auth.uid(), 'tecnico'));

-- Tabela de Contas a Receber
CREATE TABLE public.accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0,
    parcelas INTEGER NOT NULL DEFAULT 1,
    forma_pagamento TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    vencimento DATE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "Admins can do everything on accounts"
ON public.accounts_receivable FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vendedor gerencia contas próprias
CREATE POLICY "Vendedor can manage own accounts"
ON public.accounts_receivable FOR ALL
USING (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'vendedor') AND created_by = auth.uid());

-- Tabela de Pagamentos (parcelas recebidas)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts_receivable(id) ON DELETE CASCADE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    forma_pagamento TEXT NOT NULL,
    received_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "Admins can do everything on payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Vendedor pode registrar e ver pagamentos de suas contas
CREATE POLICY "Vendedor can insert payments"
ON public.payments FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'vendedor') AND 
    EXISTS (
        SELECT 1 FROM public.accounts_receivable 
        WHERE id = account_id AND created_by = auth.uid()
    )
);

CREATE POLICY "Vendedor can view own payments"
ON public.payments FOR SELECT
USING (
    has_role(auth.uid(), 'vendedor') AND 
    EXISTS (
        SELECT 1 FROM public.accounts_receivable 
        WHERE id = account_id AND created_by = auth.uid()
    )
);

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at
BEFORE UPDATE ON public.repairs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at
BEFORE UPDATE ON public.accounts_receivable
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();