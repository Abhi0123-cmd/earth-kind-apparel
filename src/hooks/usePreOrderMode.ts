import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePreOrderMode() {
  const { data: isPreOrder = false } = useQuery({
    queryKey: ["site-config", "pre_order_mode"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "pre_order_mode")
        .single();
      return data?.value === true;
    },
    staleTime: 60_000,
  });

  return isPreOrder;
}
