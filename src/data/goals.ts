import { supabase } from "@/integrations/supabase/client";
import type { Goal, GoalStatus } from "@/domain/types";

const GOAL_FIELDS =
  "id, life_area_id, result_text, status, created_at, completed_at, archived_at, closed_on";

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select(GOAL_FIELDS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Goal[];
}

export async function createGoal(input: {
  userId: string;
  lifeAreaId: string;
  resultText: string;
}): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: input.userId,
      life_area_id: input.lifeAreaId,
      result_text: input.resultText,
      closed_on: null,
    })
    .select(GOAL_FIELDS)
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoalResult(goalId: string, resultText: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ result_text: resultText })
    .eq("id", goalId);
  if (error) throw error;
}

export async function setGoalStatus(
  goalId: string,
  status: GoalStatus,
  closedOn: string,
): Promise<void> {
  if (status !== "active" && !/^\d{4}-\d{2}-\d{2}$/.test(closedOn)) {
    throw new Error("Некорректная дата завершения цели.");
  }
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("goals")
    .update({
      status,
      completed_at: status === "completed" ? now : null,
      archived_at: status === "active" ? null : now,
      closed_on: status === "active" ? null : closedOn,
    })
    .eq("id", goalId);
  if (error) throw error;
}
