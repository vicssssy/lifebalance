import type { ActionType } from "./constants";

export interface LifeArea {
  id: string;
  name: string;
  question: string;
  description: string;
  sort_order: number;
}

export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: string;
  life_area_id: string;
  result_text: string;
  status: GoalStatus;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
  /** Последний день, когда связанные действия остаются частью исторического плана. */
  closed_on: string | null;
}

export interface Action {
  id: string;
  goal_id: string | null;
  name: string;
  type: ActionType;
  description: string | null;
  duration_seconds: number | null;
  why_important: string | null;
  helps_with: string | null;
  /** Дата начала: раньше этой даты действие не появляется в приложении. */
  start_date: string;
  archived_at: string | null;
  created_at: string;
}

export interface RitualItem {
  id: string;
  ritual_action_id: string;
  name: string;
  description: string | null;
  duration_seconds: number | null;
  sort_order: number;
}

export interface Schedule {
  id: string;
  action_id: string;
  repeat_type: "once" | "weekly";
  scheduled_date: string | null;
  weekdays: number[];
  start_time: string | null;
  duration_seconds: number | null;
  status: "planned" | "cancelled";
}

export interface Completion {
  id: string;
  action_id: string;
  schedule_id: string | null;
  occurrence_date: string;
  completed_at: string | null;
  status: "completed" | "in_progress" | "skipped";
}

export interface RitualItemCompletion {
  id: string;
  ritual_item_id: string;
  schedule_id: string | null;
  occurrence_date: string;
}

export interface Attachment {
  id: string;
  action_id: string;
  type: "video" | "audio" | "link";
  url: string;
  title: string | null;
}

export interface Reflection {
  id: string;
  month: string;
  real_result: string | null;
  effective_actions: string | null;
  obstacles: string | null;
  system_change: string | null;
  next_experiment: string | null;
}

/** Одно запланированное появление действия в конкретный день. */
export interface Occurrence {
  key: string;
  action: Action;
  /** Можно ли менять действие и его текущее планирование. */
  actionActive: boolean;
  schedule: Schedule;
  date: string;
  startTime: string | null;
  durationSeconds: number | null;
  completed: boolean;
  skipped: boolean;
  ritualProgress: { done: number; total: number } | null;
  lifeAreaIds: string[];
}
