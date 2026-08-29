import type { OccurrenceSource } from "@/domain/occurrences";
import type { Action, Completion, RitualItem, Schedule } from "@/domain/types";
import { createLocalPreviewSource } from "@/lib/local-preview-demo";

const SCHEMA_VERSION = 1;
const FIXTURE_VERSION = 1;
const SEEDED_ACTION_IDS = new Set([
  "demo-ritual-morning",
  "demo-regular-evening",
  "demo-task-health-check",
  "demo-time-slot-focus",
  "demo-preparation-home",
]);
const SEEDED_SCHEDULE_IDS = new Set([
  "demo-schedule-ritual",
  "demo-schedule-regular",
  "demo-schedule-task",
  "demo-schedule-focus",
  "demo-schedule-preparation",
]);

export const LOCAL_PREVIEW_STORAGE_KEY = "lifebalance:demo-planner:v1";
export const LOCAL_PREVIEW_CHANGE_EVENT = "lifebalance:demo-planner-change";

interface LocalPreviewPlannerState {
  schemaVersion: typeof SCHEMA_VERSION;
  fixtureVersion: typeof FIXTURE_VERSION;
  seededFor: string;
  updatedAt: string;
  source: OccurrenceSource;
}

export type LocalPreviewActionPatch = Partial<
  Pick<
    Action,
    "name" | "description" | "duration_seconds" | "why_important" | "helps_with" | "start_date"
  >
>;

export type LocalPreviewSchedulePatch = Partial<
  Pick<Schedule, "weekdays" | "scheduled_date" | "start_time" | "duration_seconds">
>;

export type LocalPreviewRitualItemPatch = Partial<
  Pick<RitualItem, "name" | "description" | "duration_seconds" | "sort_order">
>;

let memoryFallback: LocalPreviewPlannerState | null = null;
let preferMemoryFallback = false;

function createState(seedDate: string): LocalPreviewPlannerState {
  return {
    schemaVersion: SCHEMA_VERSION,
    fixtureVersion: FIXTURE_VERSION,
    seededFor: seedDate,
    updatedAt: new Date().toISOString(),
    source: createLocalPreviewSource(seedDate),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isAction(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    isNullableString(value["goal_id"]) &&
    typeof value["name"] === "string" &&
    ["ritual", "regular_action", "task", "time_slot", "preparation"].includes(
      String(value["type"]),
    ) &&
    isNullableString(value["description"]) &&
    isNullableNumber(value["duration_seconds"]) &&
    isNullableString(value["why_important"]) &&
    isNullableString(value["helps_with"]) &&
    typeof value["start_date"] === "string" &&
    isNullableString(value["archived_at"]) &&
    typeof value["created_at"] === "string"
  );
}

function isSchedule(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["action_id"] === "string" &&
    (value["repeat_type"] === "once" || value["repeat_type"] === "weekly") &&
    isNullableString(value["scheduled_date"]) &&
    Array.isArray(value["weekdays"]) &&
    value["weekdays"].every(
      (weekday) => Number.isInteger(weekday) && weekday >= 1 && weekday <= 7,
    ) &&
    isNullableString(value["start_time"]) &&
    isNullableNumber(value["duration_seconds"]) &&
    (value["status"] === "planned" || value["status"] === "cancelled")
  );
}

function isCompletion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["action_id"] === "string" &&
    isNullableString(value["schedule_id"]) &&
    typeof value["occurrence_date"] === "string" &&
    isNullableString(value["completed_at"]) &&
    ["completed", "in_progress", "skipped"].includes(String(value["status"]))
  );
}

function isRitualItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["ritual_action_id"] === "string" &&
    typeof value["name"] === "string" &&
    isNullableString(value["description"]) &&
    isNullableNumber(value["duration_seconds"]) &&
    typeof value["sort_order"] === "number" &&
    Number.isFinite(value["sort_order"])
  );
}

function isRitualItemCompletion(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["ritual_item_id"] === "string" &&
    isNullableString(value["schedule_id"]) &&
    typeof value["occurrence_date"] === "string"
  );
}

function isActionLifeArea(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value["action_id"] === "string" &&
    typeof value["life_area_id"] === "string"
  );
}

function isOccurrenceSource(value: unknown): value is OccurrenceSource {
  if (!value || typeof value !== "object") return false;
  const source = value as Partial<OccurrenceSource>;
  return (
    Array.isArray(source.actions) &&
    source.actions.every(isAction) &&
    Array.isArray(source.schedules) &&
    source.schedules.every(isSchedule) &&
    Array.isArray(source.completions) &&
    source.completions.every(isCompletion) &&
    Array.isArray(source.ritualItems) &&
    source.ritualItems.every(isRitualItem) &&
    Array.isArray(source.ritualItemCompletions) &&
    source.ritualItemCompletions.every(isRitualItemCompletion) &&
    Array.isArray(source.actionLifeAreas) &&
    source.actionLifeAreas.every(isActionLifeArea)
  );
}

function isStoredState(value: unknown): value is LocalPreviewPlannerState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<LocalPreviewPlannerState>;
  return (
    state.schemaVersion === SCHEMA_VERSION &&
    state.fixtureVersion === FIXTURE_VERSION &&
    typeof state.seededFor === "string" &&
    typeof state.updatedAt === "string" &&
    isOccurrenceSource(state.source)
  );
}

function migrateStateToDate(
  state: LocalPreviewPlannerState,
  seedDate: string,
): LocalPreviewPlannerState {
  if (state.seededFor === seedDate) return state;
  const previousDate = state.seededFor;

  return {
    ...state,
    seededFor: seedDate,
    updatedAt: new Date().toISOString(),
    source: {
      ...state.source,
      actions: state.source.actions.map((action) =>
        SEEDED_ACTION_IDS.has(action.id) && action.start_date === previousDate
          ? { ...action, start_date: seedDate }
          : action,
      ),
      schedules: state.source.schedules.map((schedule) =>
        SEEDED_SCHEDULE_IDS.has(schedule.id) && schedule.scheduled_date === previousDate
          ? { ...schedule, scheduled_date: seedDate }
          : schedule,
      ),
      completions: state.source.completions.map((completion) =>
        completion.schedule_id &&
        SEEDED_SCHEDULE_IDS.has(completion.schedule_id) &&
        completion.occurrence_date === previousDate
          ? {
              ...completion,
              occurrence_date: seedDate,
              completed_at: completion.completed_at?.startsWith(previousDate)
                ? `${seedDate}${completion.completed_at.slice(previousDate.length)}`
                : completion.completed_at,
            }
          : completion,
      ),
      ritualItemCompletions: state.source.ritualItemCompletions.map((completion) =>
        completion.schedule_id &&
        SEEDED_SCHEDULE_IDS.has(completion.schedule_id) &&
        completion.occurrence_date === previousDate
          ? { ...completion, occurrence_date: seedDate }
          : completion,
      ),
    },
  };
}

function loadState(seedDate: string): LocalPreviewPlannerState {
  if (typeof window === "undefined") return createState(seedDate);
  if (preferMemoryFallback && memoryFallback) return memoryFallback;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(LOCAL_PREVIEW_STORAGE_KEY);
  } catch {
    return memoryFallback ?? createState(seedDate);
  }

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStoredState(parsed)) {
        const migrated = migrateStateToDate(parsed, seedDate);
        memoryFallback = migrated;
        if (migrated !== parsed) {
          try {
            window.localStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, JSON.stringify(migrated));
            preferMemoryFallback = false;
          } catch {
            preferMemoryFallback = true;
          }
        }
        return migrated;
      }
    } catch {
      // Invalid JSON is treated like a version mismatch and reseeded below.
    }
    try {
      window.localStorage.removeItem(LOCAL_PREVIEW_STORAGE_KEY);
    } catch {
      // A rejected value is ignored even when storage cleanup is blocked.
    }
  }

  const fresh = createState(seedDate);
  memoryFallback = fresh;
  return fresh;
}

function saveState(state: LocalPreviewPlannerState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  memoryFallback = next;

  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, JSON.stringify(next));
    preferMemoryFallback = false;
  } catch {
    // Keep the in-memory fallback when storage is unavailable or full.
    preferMemoryFallback = true;
  }
  window.dispatchEvent(new Event(LOCAL_PREVIEW_CHANGE_EVENT));
}

function updateSource(
  seedDate: string,
  updater: (source: OccurrenceSource) => OccurrenceSource,
): void {
  const current = loadState(seedDate);
  saveState({ ...current, source: updater(current.source) });
}

export function readLocalPreviewSource(seedDate: string): OccurrenceSource {
  return loadState(seedDate).source;
}

export async function updateLocalPreviewAction(
  seedDate: string,
  actionId: string,
  patch: LocalPreviewActionPatch,
): Promise<void> {
  updateSource(seedDate, (source) => ({
    ...source,
    actions: source.actions.map((action) =>
      action.id === actionId ? { ...action, ...patch } : action,
    ),
  }));
}

export async function updateLocalPreviewSchedule(
  seedDate: string,
  scheduleId: string,
  patch: LocalPreviewSchedulePatch,
): Promise<void> {
  updateSource(seedDate, (source) => ({
    ...source,
    schedules: source.schedules.map((schedule) =>
      schedule.id === scheduleId ? { ...schedule, ...patch } : schedule,
    ),
  }));
}

export async function rescheduleLocalPreviewAction(
  seedDate: string,
  input: {
    scheduleId: string;
    repeatType: "once" | "weekly";
    date: string;
    startTime: string | null;
    durationSeconds: number | null;
  },
): Promise<void> {
  const weekday = ((new Date(`${input.date}T00:00:00`).getDay() + 6) % 7) + 1;
  await updateLocalPreviewSchedule(seedDate, input.scheduleId, {
    ...(input.repeatType === "once" ? { scheduled_date: input.date } : { weekdays: [weekday] }),
    start_time: input.startTime,
    duration_seconds: input.durationSeconds,
  });
}

function completionFor(
  input: { actionId: string; scheduleId: string; date: string },
  status: Completion["status"],
): Completion {
  return {
    id: `demo-local-completion-${input.scheduleId}-${input.date}`,
    action_id: input.actionId,
    schedule_id: input.scheduleId,
    occurrence_date: input.date,
    completed_at: status === "completed" ? new Date().toISOString() : null,
    status,
  };
}

export async function setLocalPreviewActionStatus(
  seedDate: string,
  input: { actionId: string; scheduleId: string; date: string },
  status: "completed" | "skipped",
): Promise<void> {
  updateSource(seedDate, (source) => ({
    ...source,
    completions: [
      ...source.completions.filter(
        (completion) =>
          completion.schedule_id !== input.scheduleId || completion.occurrence_date !== input.date,
      ),
      completionFor(input, status),
    ],
  }));
}

export async function removeLocalPreviewActionStatus(
  seedDate: string,
  input: { scheduleId: string; date: string },
): Promise<void> {
  updateSource(seedDate, (source) => ({
    ...source,
    completions: source.completions.filter(
      (completion) =>
        completion.schedule_id !== input.scheduleId || completion.occurrence_date !== input.date,
    ),
  }));
}

export async function toggleLocalPreviewRitualItem(
  seedDate: string,
  input: { ritualItemId: string; scheduleId: string; date: string; done: boolean },
): Promise<void> {
  updateSource(seedDate, (source) => {
    const withoutCurrent = source.ritualItemCompletions.filter(
      (completion) =>
        completion.ritual_item_id !== input.ritualItemId ||
        completion.schedule_id !== input.scheduleId ||
        completion.occurrence_date !== input.date,
    );
    return {
      ...source,
      ritualItemCompletions: input.done
        ? [
            ...withoutCurrent,
            {
              id: `demo-local-ritual-${input.ritualItemId}-${input.scheduleId}-${input.date}`,
              ritual_item_id: input.ritualItemId,
              schedule_id: input.scheduleId,
              occurrence_date: input.date,
            },
          ]
        : withoutCurrent,
    };
  });
}

export async function updateLocalPreviewRitualItem(
  seedDate: string,
  itemId: string,
  patch: LocalPreviewRitualItemPatch,
): Promise<void> {
  updateSource(seedDate, (source) => ({
    ...source,
    ritualItems: source.ritualItems.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    ),
  }));
}

export async function reorderLocalPreviewRitualItems(
  seedDate: string,
  orderedIds: string[],
): Promise<void> {
  const order = new Map(orderedIds.map((id, index) => [id, index]));
  updateSource(seedDate, (source) => ({
    ...source,
    ritualItems: source.ritualItems.map((item) =>
      order.has(item.id) ? { ...item, sort_order: order.get(item.id)! } : item,
    ),
  }));
}

export function resetLocalPreviewSource(): void {
  memoryFallback = null;
  preferMemoryFallback = false;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_PREVIEW_STORAGE_KEY);
  } catch {
    // A blocked storage implementation still resets the in-memory fallback.
  }
  window.dispatchEvent(new Event(LOCAL_PREVIEW_CHANGE_EVENT));
}
