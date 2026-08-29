import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLifeAreas } from "@/data/lifeAreas";
import { fetchActionLifeAreas, fetchActions, fetchAllRitualItems } from "@/data/actions";
import { fetchSchedules } from "@/data/schedules";
import { fetchCompletions, fetchRitualItemCompletions } from "@/data/completions";
import { fetchGoals } from "@/data/goals";
import { fetchReflections } from "@/data/reflections";
import type { OccurrenceSource } from "@/domain/occurrences";
import type { Goal } from "@/domain/types";
import { todayKey } from "@/domain/schedule";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";
import { createLocalPreviewGoals, createLocalPreviewSource } from "@/lib/local-preview-demo";

export const queryKeys = {
  lifeAreas: ["life_areas"] as const,
  actions: ["actions"] as const,
  actionLifeAreas: ["action_life_areas"] as const,
  ritualItems: ["ritual_items"] as const,
  schedules: ["schedules"] as const,
  completions: ["completions"] as const,
  ritualItemCompletions: ["ritual_item_completions"] as const,
  goals: ["goals"] as const,
  reflections: ["reflections"] as const,
};

export function useLifeAreas() {
  return useQuery({ queryKey: queryKeys.lifeAreas, queryFn: fetchLifeAreas, staleTime: Infinity });
}

export function useGoals() {
  const localPreview = isLocalPreviewAuthBypassEnabled();
  return useQuery<Goal[]>({
    queryKey: localPreview ? ([...queryKeys.goals, "local-preview"] as const) : queryKeys.goals,
    queryFn: localPreview ? () => Promise.resolve(createLocalPreviewGoals(todayKey())) : fetchGoals,
    staleTime: localPreview ? Infinity : 0,
  });
}

export function useReflections() {
  return useQuery({ queryKey: queryKeys.reflections, queryFn: fetchReflections });
}

/** Все данные, необходимые для расчёта запланированных действий. */
export function usePlannerSource() {
  const localPreview = isLocalPreviewAuthBypassEnabled();
  const previewSource = useMemo(() => createLocalPreviewSource(todayKey()), []);
  const actions = useQuery({
    queryKey: queryKeys.actions,
    queryFn: fetchActions,
    enabled: !localPreview,
  });
  const schedules = useQuery({
    queryKey: queryKeys.schedules,
    queryFn: fetchSchedules,
    enabled: !localPreview,
  });
  const completions = useQuery({
    queryKey: queryKeys.completions,
    queryFn: () => fetchCompletions(),
    enabled: !localPreview,
  });
  const ritualItems = useQuery({
    queryKey: queryKeys.ritualItems,
    queryFn: fetchAllRitualItems,
    enabled: !localPreview,
  });
  const ritualItemCompletions = useQuery({
    queryKey: queryKeys.ritualItemCompletions,
    queryFn: () => fetchRitualItemCompletions(),
    enabled: !localPreview,
  });
  const actionLifeAreas = useQuery({
    queryKey: queryKeys.actionLifeAreas,
    queryFn: fetchActionLifeAreas,
    enabled: !localPreview,
  });

  const source: OccurrenceSource = localPreview
    ? previewSource
    : {
        actions: actions.data ?? [],
        schedules: schedules.data ?? [],
        completions: completions.data ?? [],
        ritualItems: ritualItems.data ?? [],
        ritualItemCompletions: ritualItemCompletions.data ?? [],
        actionLifeAreas: actionLifeAreas.data ?? [],
      };

  const isLoading = localPreview
    ? false
    : actions.isLoading ||
      schedules.isLoading ||
      completions.isLoading ||
      ritualItems.isLoading ||
      ritualItemCompletions.isLoading ||
      actionLifeAreas.isLoading;

  return { source, isLoading };
}

/** Мутация, после которой достаточно обновить все планировочные данные. */
export function usePlannerMutation<TInput>(fn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.completions });
      queryClient.invalidateQueries({ queryKey: queryKeys.ritualItemCompletions });
      queryClient.invalidateQueries({ queryKey: queryKeys.actions });
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      queryClient.invalidateQueries({ queryKey: queryKeys.ritualItems });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionLifeAreas });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}
