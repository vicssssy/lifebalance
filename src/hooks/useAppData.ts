import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCloudWorkspace } from "@/cloud/client";
import type { OccurrenceSource } from "@/domain/occurrences";

export const queryKeys = {
  workspace: ["cloud_workspace"] as const,
  attachments: ["attachments"] as const,
};

export function useLifeAreas() {
  return useQuery({
    queryKey: queryKeys.workspace,
    queryFn: fetchCloudWorkspace,
    select: (workspace) => workspace.lifeAreas,
    refetchOnWindowFocus: "always",
  });
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.workspace,
    queryFn: fetchCloudWorkspace,
    select: (workspace) => workspace.goals,
    refetchOnWindowFocus: "always",
  });
}

export function useReflections() {
  return useQuery({
    queryKey: queryKeys.workspace,
    queryFn: fetchCloudWorkspace,
    select: (workspace) => workspace.reflections,
    refetchOnWindowFocus: "always",
  });
}

/** Все данные, необходимые для расчёта запланированных действий. */
export function usePlannerSource() {
  const workspace = useQuery({
    queryKey: queryKeys.workspace,
    queryFn: fetchCloudWorkspace,
    refetchOnWindowFocus: "always",
  });
  const source: OccurrenceSource = {
    actions: workspace.data?.source.actions ?? [],
    schedules: workspace.data?.source.schedules ?? [],
    completions: workspace.data?.source.completions ?? [],
    ritualItems: workspace.data?.source.ritualItems ?? [],
    ritualItemCompletions: workspace.data?.source.ritualItemCompletions ?? [],
    actionLifeAreas: workspace.data?.source.actionLifeAreas ?? [],
    goals: workspace.data?.goals ?? [],
  };
  return { source, isLoading: workspace.isLoading };
}

/** Мутация, после которой достаточно обновить единый D1 workspace. */
export function usePlannerMutation<TInput>(fn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments });
    },
  });
}
