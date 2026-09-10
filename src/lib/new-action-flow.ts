export interface NewActionGoalDraft {
  id: string;
  lifeAreaId: string;
  resultText: string;
  whyImportant: string | null;
}

export interface NewActionFlowLocationState {
  newActionGoalDraft?: NewActionGoalDraft | undefined;
  newActionStep?: "goal" | "format" | undefined;
}

declare module "@tanstack/history" {
  interface HistoryState {
    newActionGoalDraft?: NewActionGoalDraft | undefined;
    newActionStep?: "goal" | "format" | undefined;
  }
}

export function readNewActionFlowLocationState(value: unknown): NewActionFlowLocationState {
  if (!value || typeof value !== "object") return {};
  const state = value as Record<string, unknown>;
  const draft = state["newActionGoalDraft"];
  if (
    !draft ||
    typeof draft !== "object" ||
    typeof (draft as Record<string, unknown>)["id"] !== "string" ||
    typeof (draft as Record<string, unknown>)["lifeAreaId"] !== "string" ||
    typeof (draft as Record<string, unknown>)["resultText"] !== "string" ||
    !(
      typeof (draft as Record<string, unknown>)["whyImportant"] === "string" ||
      (draft as Record<string, unknown>)["whyImportant"] === null
    )
  ) {
    return {};
  }

  return {
    newActionGoalDraft: draft as NewActionGoalDraft,
    newActionStep:
      state["newActionStep"] === "goal" || state["newActionStep"] === "format"
        ? state["newActionStep"]
        : undefined,
  };
}
