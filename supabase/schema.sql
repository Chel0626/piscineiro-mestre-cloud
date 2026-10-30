-- =============================================================================
-- Piscineiro - Schema consolidado do Supabase (PostgreSQL)
-- =============================================================================
-- Este arquivo e a unica fonte de verdade versionada do banco de dados.
-- Consolidou os antigos scripts dispersos (SUPABASE_*.sql, FIX_*.sql, etc.).
--
-- Ordem de aplicacao:
--   1. ENUMS e tabelas base (multi-tenant)
--   2. Tabelas de dominio (clients, visits, invoices, ...)
--   3. Views e funcoes/triggers
--   4. Row Level Security (RLS) e politicas de acesso
--
-- Execucao: cole no SQL Editor do Supabase ou rode via `supabase db` / psql.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- =============================================================================


-- =============================================================================
-- 1. ENUMS
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
        CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visit_status') THEN
        CREATE TYPE public.visit_status AS ENUM ('pending_review', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('owner', 'worker', 'solo', 'superadmin');
    END IF;
END $$;


-- =============================================================================
-- 2. TABELAS BASE (MULTI-TENANT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'business',
    logo_url TEXT,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    account_type TEXT,
    company_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);


-- =============================================================================
-- 3. TABELAS DE DOMINIO
-- =============================================================================

-- 3.1 Clientes (mensalistas)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id), -- Referencia legada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS service_value NUMERIC DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS visit_frequency TEXT DEFAULT 'weekly';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS visit_day TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS visit_days TEXT[];
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'residential';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pool_volume NUMERIC DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS filter_model TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS filter_sand_kg NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_sand_change DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS next_sand_change DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS coordinates JSONB;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS payment_due_date INTEGER DEFAULT 10;

-- 3.2 Clientes avulsos (servicos esporadicos)
CREATE TABLE IF NOT EXISTS public.ad_hoc_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    phone TEXT,
    address TEXT,
    service_type TEXT,
    service_value NUMERIC DEFAULT 0,
    service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month TEXT, -- YYYY-MM
    ph NUMERIC,
    chlorine NUMERIC,
    alkalinity NUMERIC,
    service_description TEXT,
    details JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.3 Visitas (historico de manutencao)
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS water_condition TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS ph NUMERIC;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS chlorine NUMERIC;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS alkalinity NUMERIC;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS chlorine_type TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS days_until_next INTEGER;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS products_used TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS checklist TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS products_to_request TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS departure_time TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS status public.visit_status DEFAULT 'pending_review';
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- 3.4 Faturas / financeiro
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ad_hoc_client_id UUID REFERENCES public.ad_hoc_clients(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    status public.invoice_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    period_start DATE,
    period_end DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 Pedidos de produtos
CREATE TABLE IF NOT EXISTS public.product_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT,
    client_phone TEXT,
    user_id UUID REFERENCES auth.users(id),
    products TEXT[],
    status TEXT DEFAULT 'pending',
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 3.6 Reagendamentos temporarios
CREATE TABLE IF NOT EXISTS public.temporary_reschedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    original_day TEXT,
    new_day TEXT
);


-- =============================================================================
-- 4. VIEWS
-- =============================================================================
DROP VIEW IF EXISTS public.client_visits;
CREATE OR REPLACE VIEW public.client_visits
WITH (security_invoker = true)
AS
SELECT
    v.id,
    v.client_id,
    c.name AS client_name,
    c.phone AS client_phone,
    v.user_id AS worker_id,
    v.tenant_id,
    v.date,
    v.description AS notes,
    v.water_condition,
    v.ph,
    v.chlorine,
    v.alkalinity,
    v.chlorine_type,
    v.days_until_next,
    v.products_used,
    v.checklist,
    v.products_to_request,
    v.image_url,
    v.photo_url,
    v.status,
    v.review_notes,
    v.reviewed_at,
    v.reviewed_by,
    v.created_at
FROM public.visits v
LEFT JOIN public.clients c ON v.client_id = c.id;


-- =============================================================================
-- 5. FUNCOES E TRIGGERS
-- =============================================================================

-- 5.1 Atualiza status de pagamento do cliente quando uma fatura e paga
CREATE OR REPLACE FUNCTION public.handle_invoice_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'paid' AND OLD.status != 'paid') THEN
        IF NEW.client_id IS NOT NULL THEN
            UPDATE public.clients
            SET last_payment_date = NEW.paid_at::date,
                payment_status = 'paid'
            WHERE id = NEW.client_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_client_payment ON public.invoices;
CREATE TRIGGER trigger_update_client_payment
AFTER UPDATE ON public.invoices
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
EXECUTE FUNCTION public.handle_invoice_payment();

-- 5.2 Criacao automatica de perfil e tenant ao registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  user_role TEXT;
  acc_type TEXT;
  company_name TEXT;
  display_name TEXT;
BEGIN
  acc_type := COALESCE(new.raw_user_meta_data->>'account_type', 'company');
  company_name := new.raw_user_meta_data->>'company_name';
  display_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  IF acc_type = 'solo' THEN
    user_role := 'solo';
  ELSIF acc_type = 'worker' THEN
    user_role := 'worker';
  ELSE
    user_role := 'owner';
  END IF;

  -- 1. Criar perfil
  INSERT INTO public.profiles (id, email, name, account_type, company_name)
  VALUES (new.id, new.email, display_name, acc_type, company_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    account_type = EXCLUDED.account_type,
    company_name = EXCLUDED.company_name;

  -- 2. Criar tenant (workers entram em tenants existentes, nao criam novos)
  IF acc_type != 'worker' THEN
    IF NOT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = new.id) THEN
      INSERT INTO public.tenants (name, slug, type)
      VALUES (
        COALESCE(company_name, display_name || ' Workspace'),
        lower(regexp_replace(COALESCE(company_name, display_name), '\s+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6),
        CASE WHEN acc_type = 'solo' THEN 'personal' ELSE 'business' END
      )
      RETURNING id INTO new_tenant_id;

      -- 3. Vincular usuario ao tenant
      INSERT INTO public.tenant_members (tenant_id, user_id, role)
      VALUES (new_tenant_id, new.id, user_role::public.app_role);
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- 6.1 Funcoes auxiliares (evitam recursao nas policies)
CREATE OR REPLACE FUNCTION public.is_owner_of_tenant(check_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = check_tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'solo', 'superadmin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_tenant(check_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = check_tenant_id
        AND user_id = auth.uid()
    );
END;
$$;

-- 6.2 Ativar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_hoc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_reschedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- 6.3 Policies: clients
DROP POLICY IF EXISTS "Owners can view all clients" ON public.clients;
CREATE POLICY "Owners can view all clients" ON public.clients
    FOR SELECT USING (public.is_owner_of_tenant(tenant_id));

DROP POLICY IF EXISTS "Workers can view assigned clients" ON public.clients;
CREATE POLICY "Workers can view assigned clients" ON public.clients
    FOR SELECT USING (public.is_member_of_tenant(tenant_id) AND (worker_id = auth.uid() OR type = 'ad-hoc'));

DROP POLICY IF EXISTS "Owners can manage clients" ON public.clients;
CREATE POLICY "Owners can manage clients" ON public.clients
    FOR ALL USING (public.is_owner_of_tenant(tenant_id));

DROP POLICY IF EXISTS "Members can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Members can insert ad-hoc clients" ON public.clients;
CREATE POLICY "Members can insert ad-hoc clients" ON public.clients
    FOR INSERT WITH CHECK (
        public.is_member_of_tenant(tenant_id) AND
        (public.is_owner_of_tenant(tenant_id) OR type = 'ad-hoc')
    );

DROP POLICY IF EXISTS "Workers can update assigned clients" ON public.clients;
CREATE POLICY "Workers can update assigned clients" ON public.clients
    FOR UPDATE USING (worker_id = auth.uid());

-- 6.4 Policies: ad_hoc_clients
DROP POLICY IF EXISTS "Owners can manage ad_hoc_clients" ON public.ad_hoc_clients;
DROP POLICY IF EXISTS "Members can manage ad_hoc_clients" ON public.ad_hoc_clients;
CREATE POLICY "Members can manage ad_hoc_clients" ON public.ad_hoc_clients
    FOR ALL USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    )
    WITH CHECK (public.is_member_of_tenant(tenant_id));

DROP POLICY IF EXISTS "Members can view ad_hoc_clients" ON public.ad_hoc_clients;
CREATE POLICY "Members can view ad_hoc_clients" ON public.ad_hoc_clients
    FOR SELECT USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    );

-- 6.5 Policies: visits
DROP POLICY IF EXISTS "Members can view visits" ON public.visits;
CREATE POLICY "Members can view visits" ON public.visits
    FOR SELECT USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members can manage visits" ON public.visits;
CREATE POLICY "Members can manage visits" ON public.visits
    FOR ALL USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    )
    WITH CHECK (public.is_member_of_tenant(tenant_id));

-- 6.6 Policies: invoices
DROP POLICY IF EXISTS "Owners can manage invoices" ON public.invoices;
CREATE POLICY "Owners can manage invoices" ON public.invoices
    FOR ALL USING (public.is_owner_of_tenant(tenant_id));

DROP POLICY IF EXISTS "Members can view invoices" ON public.invoices;
CREATE POLICY "Members can view invoices" ON public.invoices
    FOR SELECT USING (public.is_member_of_tenant(tenant_id));

-- 6.7 Policies: product_requests
DROP POLICY IF EXISTS "Members can manage product_requests" ON public.product_requests;
CREATE POLICY "Members can manage product_requests" ON public.product_requests
    FOR ALL USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    )
    WITH CHECK (public.is_member_of_tenant(tenant_id));

-- 6.8 Policies: temporary_reschedules
DROP POLICY IF EXISTS "Members can view reschedules" ON public.temporary_reschedules;
CREATE POLICY "Members can view reschedules" ON public.temporary_reschedules
    FOR SELECT USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    );

DROP POLICY IF EXISTS "Members can manage reschedules" ON public.temporary_reschedules;
CREATE POLICY "Members can manage reschedules" ON public.temporary_reschedules
    FOR ALL USING (
        public.is_owner_of_tenant(tenant_id) OR
        user_id = auth.uid() OR
        client_id IN (SELECT id FROM public.clients WHERE worker_id = auth.uid())
    )
    WITH CHECK (public.is_member_of_tenant(tenant_id));

-- 6.9 Policies: tenants
DROP POLICY IF EXISTS "Members can view their tenant" ON public.tenants;
CREATE POLICY "Members can view their tenant" ON public.tenants
    FOR SELECT USING (public.is_member_of_tenant(id));

DROP POLICY IF EXISTS "Owners can update their tenant" ON public.tenants;
CREATE POLICY "Owners can update their tenant" ON public.tenants
    FOR UPDATE USING (public.is_owner_of_tenant(id));

-- 6.10 Policies: profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- 6.11 Policies: tenant_members
DROP POLICY IF EXISTS "Users can view own memberships" ON public.tenant_members;
CREATE POLICY "Users can view own memberships" ON public.tenant_members
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage members" ON public.tenant_members;
CREATE POLICY "Owners can manage members" ON public.tenant_members
    FOR ALL USING (public.is_owner_of_tenant(tenant_id));
