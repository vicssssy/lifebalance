import { DAY_PARTS, type DayPart } from "./constants";
import { dayPartFor, fromDateKey, isoWeekday } from "./schedule";
import type {
  Action,
  Completion,
  Goal,
  Occurrence,
  RitualItem,
  RitualItemCompletion,
  Schedule,
} from "./types";

export interface PlannerRecords {
  actions: Action[];
  schedules: Schedule[];
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
  const weekday = isoWeekday(fromDateKey(dateKey));
  return schedule.weekdays.includes(weekday);
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
    if (!scheduleHitsDate(schedule, dateKey)) continue;
    const action = actionById.get(schedule.action_id);
    if (!action) continue;
    // Действие не появляется раньше своей даты начала.
    if (action.start_date && dateKey < action.start_date) continue;

    const completion = source.completions.find(
      (item) => item.schedule_id === schedule.id && item.occurrence_date === dateKey,
    );

    // Закрытая Goal сразу выключает действие из активного плана. Исторический режим
    // сохраняет прошлые появления, а в день закрытия — только уже зафиксированный факт.
    const goal = action.goal_id ? goalById.get(action.goal_id) : null;
    // Отсутствующая связанная Goal не должна случайно реактивировать Action.
    const actionActive = !action.goal_id || goal?.status === "active";
    if (!actionActive) {
      const closedOn =
        goal?.closed_on ?? goal?.completed_at?.slice(0, 10) ?? goal?.archived_at?.slice(0, 10);
      const terminalHistory =
        completion?.status === "completed" || completion?.status === "skipped";
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
            c.occurrence_date === dateKey,
        ),
      ).length;
      ritualProgress = { done, total: items.length };
    }

    result.push({
      key: `${schedule.id}:${dateKey}`,
      action,
      actionActive,
      schedule,
      date: dateKey,
      startTime: schedule.start_time,
      durationSeconds: schedule.duration_seconds ?? action.duration_seconds,
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

/** Фактические данные для Рефлексии: запланировано / выполнено за период. */
export function factsForRange(
  source: OccurrenceSource,
  fromKey: string,
  toKey: string,
): { action: Action; planned: number; completed: number }[] {
  const counters = new Map<string, { planned: number; completed: number }>();
  const from = fromDateKey(fromKey);
  const to = fromDateKey(toKey);

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    for (const occ of occurrencesForDate(source, key, "history")) {
      const entry = counters.get(occ.action.id) ?? { planned: 0, completed: 0 };
      entry.planned += 1;
      if (occ.completed) entry.completed += 1;
      counters.set(occ.action.id, entry);
    }
  }

  return source.actions
    .filter((a) => counters.has(a.id))
    .map((action) => ({ action, ...counters.get(action.id)! }));
}
