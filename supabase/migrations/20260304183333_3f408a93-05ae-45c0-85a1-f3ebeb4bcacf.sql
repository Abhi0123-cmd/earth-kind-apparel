
CREATE TABLE public.site_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT 'false'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage site config" ON public.site_config FOR ALL USING (public.is_admin());

INSERT INTO public.site_config (key, value) VALUES ('pre_order_mode', 'true'::jsonb);
