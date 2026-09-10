import { DAY_PARTS, type DayPart } from "./constants";
import { dayPartFor, fromDateKey, toDateKey, weeklyScheduleIncludesDate } from "./schedule";
import type {
  Action,
  Completion,
  Goal,
  Occurrence,
  OccurrenceOverride,
  RitualItem,
  RitualItemCompletion,
  Schedule,
} from "./types";

export interface PlannerRecords {
  actions: Action[];
  schedules: Schedule[];
  occurrenceOverrides?: OccurrenceOverride[];
  completions: Completion[];
  ritualItems: RitualItem[];
  ritualItemCompletions: RitualItemCompletion[];
  actionLifeAreas: { action_id: string; life_area_id: string }[];
}

export interface OccurrenceSource extends PlannerRecords {
  goals: Goal[];
}

function scheduleHitsDate(schedule: Schedule, dateKey: string): boolean {
  if (schedule.status !== "planned") return false;
  if (schedule.repeat_type === "once") return schedule.scheduled_date === dateKey;
  return weeklyScheduleIncludesDate(schedule.weekdays, dateKey);
}

export type OccurrenceView = "active-plan" | "history";

/**
 * Собирает действия на конкретный день.
 *
 * active-plan — только действия активных Goals (Today и текущий план).
 * history — прошлый план с сохранёнными фактами закрытого дня (Calendar и Reflection).
 */
export function occurrencesForDate(
  source: OccurrenceSource,
  dateKey: string,
  view: OccurrenceView,
): Occurrence[] {
  const actionById = new Map(source.actions.map((a) => [a.id, a]));
  const goalById = new Map(source.goals.map((goal) => [goal.id, goal]));
  const areasByAction = new Map<string, string[]>();
  for (const link of source.actionLifeAreas) {
    const list = areasByAction.get(link.action_id) ?? [];
    list.push(link.life_area_id);
    areasByAction.set(link.action_id, list);
  }

  const result: Occurrence[] = [];

  for (const schedule of source.schedules) {
    if (schedule.status !== "planned") continue;
    const overrides = (source.occurrenceOverrides ?? []).filter(
      (item) => item.schedule_id === schedule.id,
    );
    const override = overrides.find((item) => item.target_date === dateKey);
    // A moved occurrence has one canonical display date: its target. Never show a
    // second copy at the original date, including in history.
    if (!override && overrides.some((item) => item.original_date === dateKey)) continue;
    const originalDate = override?.original_date ?? dateKey;
    const action = actionById.get(schedule.action_id);
    if (!action) continue;
    const completion = source.completions.find(
      (item) => item.schedule_id === schedule.id && item.occurrence_date === originalDate,
    );
    const terminalHistory =
      view === "history" &&
      (completion?.status === "completed" || completion?.status === "skipped");

    // Editing a schedule changes the active plan, but must not erase a recorded
    // completion from Calendar or Reflection. Active-plan never takes this path.
    if (
      !override &&
      ((schedule.repeat_type === "once" && overrides.length > 0) ||
        !scheduleHitsDate(schedule, dateKey)) &&
      !terminalHistory
    )
      continue;
    // Действие появляется только в заданный период, включая обе его границы.
    if (
      (action.start_date && dateKey < action.start_date) ||
      (action.end_date && dateKey > action.end_date)
    ) {
      if (!terminalHistory) continue;
    }

    // Закрытая Goal сразу выключает действие из активного плана. Исторический режим
    // сохраняет прошлые появления, а в день закрытия — только уже зафиксированный факт.
    const goal = action.goal_id ? goalById.get(action.goal_id) : null;
    // Отсутствующая связанная Goal не должна случайно реактивировать Action.
    const actionActive = !action.goal_id || goal?.status === "active";
    if (!actionActive) {
      const closedOn =
        goal?.closed_on ?? goal?.completed_at?.slice(0, 10) ?? goal?.archived_at?.slice(0, 10);
      if (
        view === "active-plan" ||
        !closedOn ||
        dateKey > closedOn ||
        (dateKey === closedOn && !terminalHistory)
      ) {
        continue;
      }
    }

    const completed = completion?.status === "completed";
    const skipped = completion?.status === "skipped";

    let ritualProgress: Occurrence["ritualProgress"] = null;
    if (action.type === "ritual") {
      const items = source.ritualItems.filter((i) => i.ritual_action_id === action.id);
      const done = items.filter((item) =>
        source.ritualItemCompletions.some(
          (c) =>
            c.ritual_item_id === item.id &&
            c.schedule_id === schedule.id &&
            c.occurrence_date === originalDate,
        ),
      ).length;
      ritualProgress = { done, total: items.length };
    }

    result.push({
      key: `${schedule.id}:${originalDate}`,
      action,
      actionActive,
      schedule,
      date: dateKey,
      originalDate,
      startTime: override ? override.start_time : schedule.start_time,
      durationSeconds:
        (override ? override.duration_seconds : schedule.duration_seconds) ??
        action.duration_seconds,
      completed,
      skipped,
      ritualProgress,
      lifeAreaIds: areasByAction.get(action.id) ?? [],
    });
  }

  return result;
}

export interface DaySection {
  key: DayPart;
  title: string;
  items: Occurrence[];
}

/** Read-only calendar progress: a ritual is one occurrence, never a count of items. */
export function completionProgressForDate(source: OccurrenceSource, date: string) {
  const occurrences = occurrencesForDate(source, date, "history");
  return {
    planned: occurrences.length,
    completed: occurrences.filter((occurrence) => occurrence.completed && !occurrence.skipped)
      .length,
  };
}

/** Группировка строго: Утро → День → Вечер → Дополнительно. Пустые категории не возвращаются. */
export function groupByDayPart(occurrences: Occurrence[]): DaySection[] {
  const buckets = new Map<DayPart, Occurrence[]>();
  for (const occ of occurrences) {
    const part = dayPartFor(occ.startTime);
    const list = buckets.get(part) ?? [];
    list.push(occ);
    buckets.set(part, list);
  }
  return DAY_PARTS.map(({ key, title }) => ({
    key,
    title,
    items: (buckets.get(key) ?? []).sort(
      (a, b) =>
        (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
        a.action.name.localeCompare(b.action.name),
    ),
  })).filter((section) => section.items.length > 0);
}

export interface ReflectionFact {
  action: Action;
  planned: number;
  completed: number;
  skipped: number;
}

/** Фактические данные для Рефлексии: запланировано / выполнено / пропущено за период. */
export function factsForRange(
  source: OccurrenceSource,
  fromKey: string,
  toKey: string,
): ReflectionFact[] {
  const counters = new Map<string, Omit<ReflectionFact, "action">>();
  const from = fromDateKey(fromKey);
  const to = fromDateKey(toKey);

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    for (const occ of occurrencesForDate(source, key, "history")) {
      const entry = counters.get(occ.action.id) ?? { planned: 0, completed: 0, skipped: 0 };
      entry.planned += 1;
      if (occ.completed) entry.completed += 1;
      if (occ.skipped) entry.skipped += 1;
      counters.set(occ.action.id, entry);
    }
  }

  return source.actions
    .filter((a) => counters.has(a.id))
    .map((action) => ({ action, ...counters.get(action.id)! }));
}

/**
 * Facts for Reflection are limited to lived days. A future month has no facts,
 * while the current month ends today rather than at the end of the month.
 */
export function reflectionFactsForMonth(
  source: OccurrenceSource,
  monthStart: string,
  today: string,
): ReflectionFact[] {
  if (monthStart > today) return [];
  const date = fromDateKey(monthStart);
  const monthEnd = toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return factsForRange(source, monthStart, monthEnd < today ? monthEnd : today);
}
