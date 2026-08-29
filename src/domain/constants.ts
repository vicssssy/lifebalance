/**
 * Утверждённые формулировки из ТЗ. Менять нельзя.
 */

export type ActionType = "ritual" | "regular_action" | "task" | "time_slot" | "preparation";

export const ACTION_FORMATS: {
  type: ActionType;
  name: string;
  hint: string;
}[] = [
  {
    type: "ritual",
    name: "Ритуал",
    hint: "Несколько действий, которые ты выполняешь вместе.",
  },
  {
    type: "regular_action",
    name: "Регулярное действие",
    hint: "Одно действие, которое ты повторяешь.",
  },
  {
    type: "task",
    name: "Задача",
    hint: "То, что нужно сделать один раз.",
  },
  {
    type: "time_slot",
    name: "Временной слот",
    hint: "Время, которое ты заранее выделяешь для чего-то.",
  },
  {
    type: "preparation",
    name: "Подготовка",
    hint: "Время, чтобы разобраться и подготовиться, если пока не хватает информации.",
  },
];

export const ACTION_FORMAT_NAME: Record<ActionType, string> = ACTION_FORMATS.reduce(
  (acc, f) => ({ ...acc, [f.type]: f.name }),
  {} as Record<ActionType, string>,
);

/** Форматы, которые повторяются по дням недели. */
export const RECURRING_TYPES: ActionType[] = ["ritual", "regular_action"];

export type DayPart = "morning" | "day" | "evening" | "extra";

export const DAY_PARTS: { key: DayPart; title: string }[] = [
  { key: "morning", title: "Утро" },
  { key: "day", title: "День" },
  { key: "evening", title: "Вечер" },
  { key: "extra", title: "Дополнительно" },
];

/** ISO-дни недели: понедельник = 1. */
export const WEEKDAYS: { value: number; short: string }[] = [
  { value: 1, short: "Пн" },
  { value: 2, short: "Вт" },
  { value: 3, short: "Ср" },
  { value: 4, short: "Чт" },
  { value: 5, short: "Пт" },
  { value: 6, short: "Сб" },
  { value: 7, short: "Вс" },
];

export const REFLECTION_QUESTIONS = [
  { field: "real_result", question: "Какой реальный результат ты получила?" },
  { field: "effective_actions", question: "Какие действия реально привели тебя к этому результату?" },
  { field: "obstacles", question: "Что помешало тебе сделать то, что ты планировала?" },
  { field: "system_change", question: "Что тебе нужно изменить в своей системе?" },
  { field: "next_experiment", question: "Какое одно изменение ты проверишь в следующем месяце?" },
] as const;

export type ReflectionField = (typeof REFLECTION_QUESTIONS)[number]["field"];
