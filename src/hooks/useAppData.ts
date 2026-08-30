import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLifeAreas } from "@/data/lifeAreas";
import { fetchActionLifeAreas, fetchActions, fetchAllRitualItems } from "@/data/actions";
import { fetchSchedules } from "@/data/schedules";
import { fetchCompletions, fetchRitualItemCompletions } from "@/data/completions";
import { fetchGoals } from "@/data/goals";
import { fetchReflections } from "@/data/reflections";
import type { OccurrenceSource, PlannerRecords } from "@/domain/occurrences";
import type { Goal, Reflection } from "@/domain/types";
import { todayKey } from "@/domain/schedule";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";
import { createLocalPreviewSource } from "@/lib/local-preview-demo";
import {
  LOCAL_PREVIEW_CHANGE_EVENT,
  LOCAL_PREVIEW_STORAGE_KEY,
  readLocalPreviewGoals,
  readLocalPreviewReflections,
  readLocalPreviewSource,
} from "@/lib/local-preview-store";

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
  localPreviewPlanner: ["local_preview_planner"] as const,
};

function useLocalPreviewPlannerSync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.localPreviewPlanner });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.reflections });
    };
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_PREVIEW_STORAGE_KEY) refresh();
    };

    window.addEventListener(LOCAL_PREVIEW_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refreshFromStorage);
    return () => {
      window.removeEventListener(LOCAL_PREVIEW_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refreshFromStorage);
    };
  }, [enabled, queryClient]);
}

export function useLifeAreas() {
  return useQuery({ queryKey: queryKeys.lifeAreas, queryFn: fetchLifeAreas, staleTime: Infinity });
}

export function useGoals() {
  const localPreview = isLocalPreviewAuthBypassEnabled();
  return useQuery<Goal[]>({
    queryKey: localPreview ? ([...queryKeys.goals, "local-preview"] as const) : queryKeys.goals,
    queryFn: localPreview ? () => Promise.resolve(readLocalPreviewGoals(todayKey())) : fetchGoals,
    staleTime: localPreview ? Infinity : 0,
    refetchOnWindowFocus: localPreview ? "always" : true,
  });
}

export function useReflections() {
  const localPreview = isLocalPreviewAuthBypassEnabled();
  return useQuery<Reflection[]>({
    queryKey: localPreview
      ? ([...queryKeys.reflections, "local-preview"] as const)
      : queryKeys.reflections,
    queryFn: localPreview
      ? () => Promise.resolve(readLocalPreviewReflections(todayKey()))
      : fetchReflections,
    staleTime: localPreview ? Infinity : 0,
    refetchOnWindowFocus: localPreview ? "always" : true,
  });
}

/** Все данные, необходимые для расчёта запланированных действий. */
export function usePlannerSource() {
  const localPreview = isLocalPreviewAuthBypassEnabled();
  const previewSeedDate = todayKey();
  useLocalPreviewPlannerSync(localPreview);
  const goals = useGoals();
  const preview = useQuery<PlannerRecords>({
    queryKey: [...queryKeys.localPreviewPlanner, previewSeedDate],
    queryFn: () => Promise.resolve(readLocalPreviewSource(previewSeedDate)),
    enabled: localPreview,
    staleTime: 0,
    gcTime: Infinity,
    refetchOnWindowFocus: "always",
  });
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

  const records: PlannerRecords = localPreview
    ? (preview.data ?? createLocalPreviewSource(previewSeedDate))
    : {
        actions: actions.data ?? [],
        schedules: schedules.data ?? [],
        completions: completions.data ?? [],
        ritualItems: ritualItems.data ?? [],
        ritualItemCompletions: ritualItemCompletions.data ?? [],
        actionLifeAreas: actionLifeAreas.data ?? [],
      };
  const source: OccurrenceSource = {
    ...records,
    goals: goals.data ?? (localPreview ? readLocalPreviewGoals(previewSeedDate) : []),
  };

  const isLoading = localPreview
    ? false
    : actions.isLoading ||
      schedules.isLoading ||
      completions.isLoading ||
      ritualItems.isLoading ||
      ritualItemCompletions.isLoading ||
      actionLifeAreas.isLoading ||
      goals.isLoading;

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
      queryClient.invalidateQueries({ queryKey: queryKeys.reflections });
      queryClient.invalidateQueries({ queryKey: queryKeys.localPreviewPlanner });
    },
  });
}
