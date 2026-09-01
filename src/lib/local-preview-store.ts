import type { PlannerRecords } from "@/domain/occurrences";
import type {
  Action,
  Attachment,
  Completion,
  Goal,
  Reflection,
  RitualItem,
  Schedule,
} from "@/domain/types";
import type { LegacyWorkspaceSnapshot } from "@/cloud/types";
import { toDateKey } from "@/domain/schedule";
import { createLocalPreviewGoals, createLocalPreviewSource } from "@/lib/local-preview-demo";

const SCHEMA_VERSION = 1;
const FIXTURE_VERSION = 1;

export const LOCAL_PREVIEW_STORAGE_KEY = "lifebalance:demo-planner:v1";
export const LOCAL_PREVIEW_CHANGE_EVENT = "lifebalance:demo-planner-change";

interface LocalPreviewPlannerState {
  schemaVersion: typeof SCHEMA_VERSION;
  fixtureVersion: typeof FIXTURE_VERSION;
  seededFor: string;
  updatedAt: string;
  source: PlannerRecords;
  goals: Goal[];
  reflections: Reflection[];
  attachments: Attachment[];
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

export interface LocalPreviewGoalDraft {
  lifeAreaId: string;
  resultText: string;
  whyImportant: string | null;
}

export interface LocalPreviewActionDraft {
  goalId: string | null;
  newGoal?: LocalPreviewGoalDraft | null;
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

export type LocalPreviewReflectionAnswers = Partial<
  Pick<
    Reflection,
    "real_result" | "effective_actions" | "obstacles" | "system_change" | "next_experiment"
  >
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
    goals: createLocalPreviewGoals(seedDate),
    reflections: [],
    attachments: [],
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

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateKeyFrom(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? null;
}

function localDateKeyFromTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
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

function isGoal(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["life_area_id"] === "string" &&
    typeof value["result_text"] === "string" &&
    (value["why_important"] === undefined || isNullableString(value["why_important"])) &&
    ["active", "completed", "cancelled"].includes(String(value["status"])) &&
    typeof value["created_at"] === "string" &&
    isNullableString(value["completed_at"]) &&
    isNullableString(value["archived_at"]) &&
    (value["closed_on"] === undefined ||
      value["closed_on"] === null ||
      isDateKey(value["closed_on"]))
  );
}

function normalizeGoal(value: Record<string, unknown>, fallbackDate: string): Goal {
  const status = value["status"] as Goal["status"];
  const closedOn =
    status === "active"
      ? null
      : isDateKey(value["closed_on"])
        ? value["closed_on"]
        : (localDateKeyFromTimestamp(value["completed_at"]) ??
          localDateKeyFromTimestamp(value["archived_at"]) ??
          fallbackDate);

  return {
    ...value,
    why_important: isNullableString(value["why_important"]) ? value["why_important"] : null,
    closed_on: closedOn,
  } as unknown as Goal;
}

function isReflection(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["month"] === "string" &&
    isNullableString(value["real_result"]) &&
    isNullableString(value["effective_actions"]) &&
    isNullableString(value["obstacles"]) &&
    isNullableString(value["system_change"]) &&
    isNullableString(value["next_experiment"])
  );
}

function isAttachment(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["action_id"] === "string" &&
    ["video", "audio", "link"].includes(String(value["type"])) &&
    typeof value["url"] === "string" &&
    isNullableString(value["title"])
  );
}

function isPlannerRecords(value: unknown): value is PlannerRecords {
  if (!value || typeof value !== "object") return false;
  const source = value as Partial<PlannerRecords>;
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

function upgradeStoredState(
  value: unknown,
): { state: LocalPreviewPlannerState; upgraded: boolean } | null {
  if (!isRecord(value)) return null;
  if (
    value["schemaVersion"] !== SCHEMA_VERSION ||
    value["fixtureVersion"] !== FIXTURE_VERSION ||
    typeof value["seededFor"] !== "string" ||
    typeof value["updatedAt"] !== "string" ||
    !isPlannerRecords(value["source"])
  ) {
    return null;
  }

  const goalsValue = value["goals"];
  const reflectionsValue = value["reflections"];
  const attachmentsValue = value["attachments"];
  if (goalsValue !== undefined && (!Array.isArray(goalsValue) || !goalsValue.every(isGoal))) {
    return null;
  }
  if (
    reflectionsValue !== undefined &&
    (!Array.isArray(reflectionsValue) || !reflectionsValue.every(isReflection))
  ) {
    return null;
  }
  if (
    attachmentsValue !== undefined &&
    (!Array.isArray(attachmentsValue) || !attachmentsValue.every(isAttachment))
  ) {
    return null;
  }

  const fallbackClosedOn = dateKeyFrom(value["seededFor"]) ?? new Date().toISOString().slice(0, 10);
  const normalizedGoals = goalsValue
    ? (goalsValue as Record<string, unknown>[]).map((goal) => normalizeGoal(goal, fallbackClosedOn))
    : createLocalPreviewGoals(value["seededFor"]);
  const goalsUpgraded = goalsValue
    ? (goalsValue as Record<string, unknown>[]).some(
        (goal, index) => goal["closed_on"] !== normalizedGoals[index]?.closed_on,
      )
    : true;

  const upgraded =
    goalsUpgraded || reflectionsValue === undefined || attachmentsValue === undefined;
  return {
    state: {
      schemaVersion: SCHEMA_VERSION,
      fixtureVersion: FIXTURE_VERSION,
      seededFor: value["seededFor"],
      updatedAt: value["updatedAt"],
      source: value["source"],
      goals: normalizedGoals,
      reflections: (reflectionsValue as Reflection[] | undefined) ?? [],
      attachments: (attachmentsValue as Attachment[] | undefined) ?? [],
    },
    upgraded,
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
      const restored = upgradeStoredState(parsed);
      if (restored) {
        memoryFallback = restored.state;
        if (restored.upgraded) {
          try {
            window.localStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, JSON.stringify(restored.state));
            preferMemoryFallback = false;
          } catch {
            preferMemoryFallback = true;
          }
        }
        return restored.state;
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
  try {
    window.localStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, JSON.stringify(fresh));
    preferMemoryFallback = false;
  } catch {
    preferMemoryFallback = true;
  }
  return fresh;
}

function saveState(state: LocalPreviewPlannerState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  memoryFallback = next;

  if (typeof window === "undefined") return;
  let persistenceFailed = false;
  try {
    window.localStorage.setItem(LOCAL_PREVIEW_STORAGE_KEY, JSON.stringify(next));
    preferMemoryFallback = false;
  } catch {
    // Keep the in-memory fallback when storage is unavailable or full.
    preferMemoryFallback = true;
    persistenceFailed = true;
  }
  window.dispatchEvent(new Event(LOCAL_PREVIEW_CHANGE_EVENT));
  if (persistenceFailed) {
    throw new Error(
      "Браузер не разрешил сохранить изменения. Проверь свободное место и доступ к хранилищу.",
    );
  }
}

function updateState(
  seedDate: string,
  updater: (state: LocalPreviewPlannerState) => LocalPreviewPlannerState,
): LocalPreviewPlannerState {
  const next = updater(loadState(seedDate));
  saveState(next);
  return next;
}

function updateSource(seedDate: string, updater: (source: PlannerRecords) => PlannerRecords): void {
  updateState(seedDate, (current) => ({ ...current, source: updater(current.source) }));
}

function localId(kind: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `local-${kind}-${uuid}`;
  return `local-${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readLocalPreviewSource(seedDate: string): PlannerRecords {
  return loadState(seedDate).source;
}

export function readLocalPreviewGoals(seedDate: string): Goal[] {
  return loadState(seedDate).goals;
}

export function readLocalPreviewReflections(seedDate: string): Reflection[] {
  return loadState(seedDate).reflections;
}

export function readLocalPreviewAttachments(seedDate: string, actionId?: string): Attachment[] {
  const attachments = loadState(seedDate).attachments;
  return actionId
    ? attachments.filter((attachment) => attachment.action_id === actionId)
    : attachments;
}

/** Validated legacy browser state used once to bootstrap the private D1 workspace. */
export function readLegacyWorkspaceSnapshot(seedDate: string): LegacyWorkspaceSnapshot {
  const state = loadState(seedDate);
  return {
    seededFor: state.seededFor,
    source: state.source,
    goals: state.goals,
    reflections: state.reflections,
    attachments: state.attachments,
  };
}

export async function createLocalPreviewGoal(
  seedDate: string,
  draft: LocalPreviewGoalDraft,
): Promise<Goal> {
  const goal: Goal = {
    id: localId("goal"),
    life_area_id: draft.lifeAreaId,
    result_text: draft.resultText.trim(),
    why_important: draft.whyImportant,
    status: "active",
    created_at: new Date().toISOString(),
    completed_at: null,
    archived_at: null,
    closed_on: null,
  };
  updateState(seedDate, (state) => ({ ...state, goals: [goal, ...state.goals] }));
  return goal;
}

export async function createLocalPreviewAction(
  seedDate: string,
  draft: LocalPreviewActionDraft,
): Promise<{ action: Action; goal?: Goal }> {
  const createdAt = new Date().toISOString();
  const newGoal =
    !draft.goalId && draft.newGoal?.resultText.trim()
      ? {
          id: localId("goal"),
          life_area_id: draft.newGoal.lifeAreaId,
          result_text: draft.newGoal.resultText.trim(),
          why_important: draft.newGoal.whyImportant,
          status: "active" as const,
          created_at: createdAt,
          completed_at: null,
          archived_at: null,
          closed_on: null,
        }
      : undefined;
  const action: Action = {
    id: localId("action"),
    goal_id: draft.goalId ?? newGoal?.id ?? null,
    name: draft.name.trim(),
    type: draft.type,
    description: draft.description,
    duration_seconds: draft.durationSeconds,
    why_important: draft.whyImportant,
    helps_with: draft.helpsWith,
    start_date: draft.startDate,
    archived_at: null,
    created_at: createdAt,
  };
  const schedules: Schedule[] = draft.schedules.map((schedule) => ({
    id: localId("schedule"),
    action_id: action.id,
    ...schedule,
    weekdays: [...schedule.weekdays],
    status: "planned",
  }));
  const ritualItems: RitualItem[] = draft.ritualItems
    .filter((item) => item.name.trim())
    .map((item, index) => ({
      id: localId("ritual-item"),
      ritual_action_id: action.id,
      name: item.name.trim(),
      description: item.description,
      duration_seconds: item.durationSeconds ?? null,
      sort_order: index,
    }));
  const attachments: Attachment[] = draft.attachments
    .filter((attachment) => attachment.url.trim())
    .map((attachment) => ({
      id: localId("attachment"),
      action_id: action.id,
      type: attachment.type,
      url: attachment.url.trim(),
      title: attachment.title?.trim() || null,
    }));
  const actionLifeAreas = draft.lifeAreaIds.slice(0, 3).map((lifeAreaId) => ({
    action_id: action.id,
    life_area_id: lifeAreaId,
  }));

  updateState(seedDate, (state) => ({
    ...state,
    goals: newGoal ? [newGoal, ...state.goals] : state.goals,
    attachments: [...state.attachments, ...attachments],
    source: {
      ...state.source,
      actions: [action, ...state.source.actions],
      schedules: [...state.source.schedules, ...schedules],
      ritualItems: [...state.source.ritualItems, ...ritualItems],
      actionLifeAreas: [...state.source.actionLifeAreas, ...actionLifeAreas],
    },
  }));

  return newGoal ? { action, goal: newGoal } : { action };
}

export async function setLocalPreviewGoalStatus(
  seedDate: string,
  goalId: string,
  status: Goal["status"],
  closedOn: string = seedDate,
): Promise<void> {
  const now = new Date().toISOString();
  const cutoffDate = status === "active" ? null : isDateKey(closedOn) ? closedOn : null;
  if (status !== "active" && !cutoffDate) {
    throw new Error("Некорректная дата завершения цели.");
  }
  updateState(seedDate, (state) => ({
    ...state,
    goals: state.goals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            status,
            completed_at: status === "completed" ? now : null,
            archived_at: status === "active" ? null : now,
            closed_on: cutoffDate,
          }
        : goal,
    ),
  }));
}

export async function saveLocalPreviewReflection(
  seedDate: string,
  input: { month: string; answers: LocalPreviewReflectionAnswers },
): Promise<Reflection> {
  let saved: Reflection | null = null;
  updateState(seedDate, (state) => {
    const existing = state.reflections.find((reflection) => reflection.month === input.month);
    const answer = (field: keyof LocalPreviewReflectionAnswers): string | null =>
      Object.prototype.hasOwnProperty.call(input.answers, field)
        ? (input.answers[field] ?? null)
        : (existing?.[field] ?? null);
    saved = {
      id: existing?.id ?? localId("reflection"),
      month: input.month,
      real_result: answer("real_result"),
      effective_actions: answer("effective_actions"),
      obstacles: answer("obstacles"),
      system_change: answer("system_change"),
      next_experiment: answer("next_experiment"),
    };
    return {
      ...state,
      reflections: [
        saved,
        ...state.reflections.filter((reflection) => reflection.month !== input.month),
      ].sort((left, right) => right.month.localeCompare(left.month)),
    };
  });
  return saved!;
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
