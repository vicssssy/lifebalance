import { supabase } from "@/integrations/supabase/client";
import type { Completion, RitualItemCompletion } from "@/domain/types";

const COMPLETION_FIELDS =
  "id, action_id, schedule_id, occurrence_date, completed_at, status";

export async function fetchCompletions(range?: { from: string; to: string }): Promise<Completion[]> {
  let query = supabase.from("completions").select(COMPLETION_FIELDS);
  if (range) {
    query = query.gte("occurrence_date", range.from).lte("occurrence_date", range.to);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Completion[];
}

export async function fetchRitualItemCompletions(range?: {
  from: string;
  to: string;
}): Promise<RitualItemCompletion[]> {
  let query = supabase
    .from("ritual_item_completions")
    .select("id, ritual_item_id, schedule_id, occurrence_date");
  if (range) {
    query = query.gte("occurrence_date", range.from).lte("occurrence_date", range.to);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RitualItemCompletion[];
}

/** Отмечает действие выполненным за конкретный день. */
export async function markActionCompleted(input: {
  userId: string;
  actionId: string;
  scheduleId: string;
  date: string;
}): Promise<void> {
  const { error } = await supabase.from("completions").upsert(
    {
      user_id: input.userId,
      action_id: input.actionId,
      schedule_id: input.scheduleId,
      occurrence_date: input.date,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "schedule_id,occurrence_date" },
  );
  if (error) throw error;
}

/** «Продолжу позже» — снимает статус выполнения, прогресс сохраняется. */
export async function unmarkActionCompleted(input: {
  scheduleId: string;
  date: string;
}): Promise<void> {
  const { error } = await supabase
    .from("completions")
    .delete()
    .eq("schedule_id", input.scheduleId)
    .eq("occurrence_date", input.date);
  if (error) throw error;
}

export async function toggleRitualItem(input: {
  userId: string;
  ritualItemId: string;
  scheduleId: string;
  date: string;
  done: boolean;
}): Promise<void> {
  if (input.done) {
    const { error } = await supabase.from("ritual_item_completions").upsert(
      {
        user_id: input.userId,
        ritual_item_id: input.ritualItemId,
        schedule_id: input.scheduleId,
        occurrence_date: input.date,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "ritual_item_id,schedule_id,occurrence_date" },
    );
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("ritual_item_completions")
    .delete()
    .eq("ritual_item_id", input.ritualItemId)
    .eq("schedule_id", input.scheduleId)
    .eq("occurrence_date", input.date);
  if (error) throw error;
}

/** «Пропустить» — появление отмечено как пропущенное, но не выполненное. */
export async function markActionSkipped(input: {
  userId: string;
  actionId: string;
  scheduleId: string;
  date: string;
}): Promise<void> {
  const { error } = await supabase.from("completions").upsert(
    {
      user_id: input.userId,
      action_id: input.actionId,
      schedule_id: input.scheduleId,
      occurrence_date: input.date,
      status: "skipped",
      completed_at: null,
    },
    { onConflict: "schedule_id,occurrence_date" },
  );
  if (error) throw error;
}
