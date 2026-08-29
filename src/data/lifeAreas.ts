import { supabase } from "@/integrations/supabase/client";
import type { LifeArea } from "@/domain/types";

export async function fetchLifeAreas(): Promise<LifeArea[]> {
  const { data, error } = await supabase
    .from("life_areas")
    .select("id, name, question, description, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as LifeArea[];
}
