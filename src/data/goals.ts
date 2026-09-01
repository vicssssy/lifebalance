import { fetchCloudWorkspace, mutateCloudWorkspace } from "@/cloud/client";
import type { Goal, GoalStatus } from "@/domain/types";

export async function fetchGoals(): Promise<Goal[]> {
  return (await fetchCloudWorkspace()).goals;
}

export async function createGoal(input: {
  userId?: string;
  lifeAreaId: string;
  resultText: string;
  whyImportant: string | null;
}): Promise<Goal> {
  return mutateCloudWorkspace<Goal>({
    type: "createGoal",
    lifeAreaId: input.lifeAreaId,
    resultText: input.resultText,
    whyImportant: input.whyImportant,
  });
}

export async function updateGoal(
  goalId: string,
  resultText: string,
  whyImportant: string | null,
): Promise<void> {
  await mutateCloudWorkspace({ type: "updateGoal", goalId, resultText, whyImportant });
}

export async function setGoalStatus(
  goalId: string,
  status: GoalStatus,
  closedOn: string,
): Promise<void> {
  await mutateCloudWorkspace({ type: "setGoalStatus", goalId, status, closedOn });
}
