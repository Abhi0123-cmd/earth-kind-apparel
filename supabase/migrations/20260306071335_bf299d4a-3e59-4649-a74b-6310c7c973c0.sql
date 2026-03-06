
CREATE TABLE public.customer_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  story text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own stories"
  ON public.customer_stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own stories"
  ON public.customer_stories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage stories"
  ON public.customer_stories FOR ALL
  TO authenticated
  USING (public.is_admin());
