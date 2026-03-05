
CREATE TABLE public.pre_order_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'India',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pre_order_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own pre_order_signups"
  ON public.pre_order_signups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own pre_order_signups"
  ON public.pre_order_signups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage pre_order_signups"
  ON public.pre_order_signups FOR ALL
  TO authenticated
  USING (public.is_admin());
