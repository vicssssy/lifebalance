import type { PlannerRecords } from "@/domain/occurrences";
import type {
  Action,
  Attachment,
  Goal,
  LifeArea,
  Reflection,
  RitualItem,
  Schedule,
} from "@/domain/types";

export interface CloudWorkspacePayload {
  source: PlannerRecords;
  goals: Goal[];
  reflections: Reflection[];
  attachments: Attachment[];
  lifeAreas: LifeArea[];
}

export interface LegacyWorkspaceSnapshot {
  seededFor: string;
  source: PlannerRecords;
  goals: Goal[];
  reflections: Reflection[];
  attachments: Attachment[];
}

export interface CloudActionDraft {
  goalId: string | null;
  newGoal?: { lifeAreaId: string; resultText: string; whyImportant: string | null } | null;
  name: string;
  type: Action["type"];
  description: string | null;
  durationSeconds: number | null;
  whyImportant: string | null;
  helpsWith: string | null;
  startDate: string;
  lifeAreaIds: string[];
  ritualItems: Array<{
    name: string;
    description: string | null;
    durationSeconds?: number | null;
  }>;
  attachments: Array<Pick<Attachment, "type" | "url" | "title">>;
  schedules: Array<
    Pick<
      Schedule,
      "repeat_type" | "scheduled_date" | "weekdays" | "start_time" | "duration_seconds"
    >
  >;
}

export type CloudWorkspaceOperation =
  | {
      type: "createGoal";
      lifeAreaId: string;
      resultText: string;
      whyImportant: string | null;
    }
  | { type: "updateGoal"; goalId: string; resultText: string; whyImportant: string | null }
  | { type: "setGoalStatus"; goalId: string; status: Goal["status"]; closedOn: string }
  | { type: "createAction"; draft: CloudActionDraft }
  | {
      type: "updateAction";
      actionId: string;
      patch: Partial<
        Pick<
          Action,
          | "name"
          | "description"
          | "duration_seconds"
          | "why_important"
          | "helps_with"
          | "start_date"
        >
      >;
    }
  | { type: "addRitualItem"; actionId: string; name: string; sortOrder: number }
  | {
      type: "updateRitualItem";
      itemId: string;
      patch: Partial<Pick<RitualItem, "name" | "description" | "duration_seconds" | "sort_order">>;
    }
  | { type: "reorderRitualItems"; orderedIds: string[] }
  | {
      type: "updateSchedule";
      scheduleId: string;
      patch: Partial<
        Pick<Schedule, "weekdays" | "scheduled_date" | "start_time" | "duration_seconds">
      >;
    }
  | {
      type: "setCompletion";
      actionId: string;
      scheduleId: string;
      date: string;
      status: "completed" | "skipped";
    }
  | { type: "removeCompletion"; scheduleId: string; date: string }
  | {
      type: "setRitualItemCompletion";
      ritualItemId: string;
      scheduleId: string;
      date: string;
      done: boolean;
    }
  | {
      type: "saveReflection";
      month: string;
      answers: Partial<
        Pick<
          Reflection,
          "real_result" | "effective_actions" | "obstacles" | "system_change" | "next_experiment"
        >
      >;
    };
