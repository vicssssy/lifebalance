import { supabase } from "@/integrations/supabase/client";
import type { Reflection } from "@/domain/types";

const FIELDS =
  "id, month, real_result, effective_actions, obstacles, system_change, next_experiment";

export async function fetchReflections(): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from("reflections")
    .select(FIELDS)
    .order("month", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Reflection[];
}

export async function saveReflection(input: {
  userId: string;
  month: string;
  answers: Partial<Record<
    "real_result" | "effective_actions" | "obstacles" | "system_change" | "next_experiment",
    string | null
  >>;
}): Promise<void> {
  const { error } = await supabase.from("reflections").upsert(
    {
      user_id: input.userId,
      month: input.month,
      ...input.answers,
    },
    { onConflict: "user_id,month" },
  );
  if (error) throw error;
}
