ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
UPDATE public.tenants SET onboarded = true WHERE created_at < now();