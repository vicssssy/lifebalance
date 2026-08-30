import type { PlannerRecords } from "@/domain/occurrences";
import type { Action, Completion, Goal, RitualItem, Schedule } from "@/domain/types";

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

/** Starter results grouped by the existing life-area methodology used on “Мои цели”. */
export function createLocalPreviewGoals(date: string): Goal[] {
  const createdAt = `${date}T06:00:00.000Z`;

  return [
    {
      id: "demo-goal-inner-state",
      life_area_id: "inner_state",
      result_text:
        "Я начинаю утро спокойно, сохраняю внимание на себе и вхожу в день без тревоги и автоматической проверки телефона",
      status: "active",
      created_at: createdAt,
      completed_at: null,
      archived_at: null,
      closed_on: null,
    },
    {
      id: "demo-goal-personal-growth",
      life_area_id: "personal_growth",
      result_text:
        "Я лучше замечаю свои внутренние опоры, понимаю, что помогает мне сохранять равновесие, и регулярно закрепляю работающие привычки",
      status: "active",
      created_at: createdAt,
      completed_at: null,
      archived_at: null,
      closed_on: null,
    },
    {
      id: "demo-goal-body-health",
      life_area_id: "body_health",
      result_text:
        "Я системно забочусь о здоровье, прохожу профилактические проверки вовремя и принимаю решения на основе актуальной информации",
      status: "active",
      created_at: createdAt,
      completed_at: null,
      archived_at: null,
      closed_on: null,
    },
    {
      id: "demo-goal-career",
      life_area_id: "career",
      result_text:
        "Я каждую неделю продвигаю главный профессиональный результат через защищённые периоды глубокой работы без уведомлений и переключений",
      status: "active",
      created_at: createdAt,
      completed_at: null,
      archived_at: null,
      closed_on: null,
    },
    {
      id: "demo-goal-money",
      life_area_id: "money",
      result_text:
        "Я выбираю новое жильё в пределах устойчивого бюджета, понимаю реальные расходы и принимаю решение без финансовой неопределённости",
      status: "active",
      created_at: createdAt,
      completed_at: null,
      archived_at: null,
      closed_on: null,
    },
  ];
}

/**
 * Five substantial starter examples for the sign-in-free cloud workspace.
 * They are imported into D1 on the first visit and then use the normal API path.
 */
export function createLocalPreviewSource(date: string): PlannerRecords {
  const createdAt = `${date}T06:00:00.000Z`;

  const actions: Action[] = [
    {
      id: "demo-ritual-morning",
      goal_id: "demo-goal-inner-state",
      name: "Спокойное утро: вода, дыхание и десять минут без телефона",
      type: "ritual",
      description: "Мягко начать день и вернуть внимание к себе до первых внешних задач.",
      duration_seconds: 900,
      why_important: "Так утро задаёт спокойный ритм всему дню.",
      helps_with: "Больше ясности, энергии и внутренней устойчивости.",
      start_date: date,
      archived_at: null,
      created_at: createdAt,
    },
    {
      id: "demo-regular-evening",
      goal_id: "demo-goal-personal-growth",
      name: "Каждый вечер записывать три мысли, которые помогли сохранить внутреннее равновесие",
      type: "regular_action",
      description: "Коротко заметить, что поддержало тебя сегодня, и завершить день без спешки.",
      duration_seconds: 600,
      why_important: "Регулярная рефлексия помогает видеть опоры и повторять то, что работает.",
      helps_with: "Бережное отношение к себе и спокойное завершение дня.",
      start_date: date,
      archived_at: null,
      created_at: createdAt,
    },
    {
      id: "demo-task-health-check",
      goal_id: "demo-goal-body-health",
      name: "Подготовить документы и записаться на ежегодный профилактический осмотр",
      type: "task",
      description: "Проверить список документов, выбрать клинику и подтвердить удобное время.",
      duration_seconds: 1800,
      why_important: "Профилактика помогает заботиться о здоровье заранее.",
      helps_with: "Спокойствие и уверенность в состоянии здоровья.",
      start_date: date,
      archived_at: null,
      created_at: createdAt,
    },
    {
      id: "demo-time-slot-focus",
      goal_id: "demo-goal-career",
      name: "Девяносто минут глубокой работы над главным профессиональным результатом недели",
      type: "time_slot",
      description: "Отключить уведомления и сосредоточиться только на одном важном результате.",
      duration_seconds: 5400,
      why_important: "Защищённое время помогает продвигать действительно важную работу.",
      helps_with: "Устойчивый профессиональный прогресс без перегрузки.",
      start_date: date,
      archived_at: null,
      created_at: createdAt,
    },
    {
      id: "demo-preparation-home",
      goal_id: "demo-goal-money",
      name: "Сравнить районы, бюджет и условия перед выбором новой квартиры",
      type: "preparation",
      description: "Собрать критерии, сравнить варианты и выписать вопросы для просмотра квартир.",
      duration_seconds: 3600,
      why_important: "Подготовка помогает принять спокойное и обоснованное решение.",
      helps_with: "Переезд в подходящее место без лишней неопределённости.",
      start_date: date,
      archived_at: null,
      created_at: createdAt,
    },
  ];

  const schedules: Schedule[] = [
    {
      id: "demo-schedule-ritual",
      action_id: "demo-ritual-morning",
      repeat_type: "weekly",
      scheduled_date: null,
      weekdays: EVERY_DAY,
      start_time: "07:00:00",
      duration_seconds: 900,
      status: "planned",
    },
    {
      id: "demo-schedule-regular",
      action_id: "demo-regular-evening",
      repeat_type: "weekly",
      scheduled_date: null,
      weekdays: EVERY_DAY,
      start_time: "21:30:00",
      duration_seconds: 600,
      status: "planned",
    },
    {
      id: "demo-schedule-task",
      action_id: "demo-task-health-check",
      repeat_type: "once",
      scheduled_date: date,
      weekdays: [],
      start_time: "10:30:00",
      duration_seconds: 1800,
      status: "planned",
    },
    {
      id: "demo-schedule-focus",
      action_id: "demo-time-slot-focus",
      repeat_type: "once",
      scheduled_date: date,
      weekdays: [],
      start_time: "15:00:00",
      duration_seconds: 5400,
      status: "planned",
    },
    {
      id: "demo-schedule-preparation",
      action_id: "demo-preparation-home",
      repeat_type: "once",
      scheduled_date: date,
      weekdays: [],
      start_time: "19:00:00",
      duration_seconds: 3600,
      status: "planned",
    },
  ];

  const completions: Completion[] = [
    {
      id: "demo-completion-regular",
      action_id: "demo-regular-evening",
      schedule_id: "demo-schedule-regular",
      occurrence_date: date,
      completed_at: `${date}T19:00:00.000Z`,
      status: "completed",
    },
    {
      id: "demo-completion-task",
      action_id: "demo-task-health-check",
      schedule_id: "demo-schedule-task",
      occurrence_date: date,
      completed_at: `${date}T10:50:00.000Z`,
      status: "completed",
    },
  ];

  const ritualItems: RitualItem[] = [
    {
      id: "demo-ritual-item-water",
      ritual_action_id: "demo-ritual-morning",
      name: "Выпить стакан воды",
      description: null,
      duration_seconds: 60,
      sort_order: 0,
    },
    {
      id: "demo-ritual-item-breathe",
      ritual_action_id: "demo-ritual-morning",
      name: "Сделать пять спокойных вдохов",
      description: null,
      duration_seconds: 120,
      sort_order: 1,
    },
    {
      id: "demo-ritual-item-offline",
      ritual_action_id: "demo-ritual-morning",
      name: "Побыть десять минут без телефона",
      description: null,
      duration_seconds: 600,
      sort_order: 2,
    },
  ];

  return {
    actions,
    schedules,
    completions,
    ritualItems,
    ritualItemCompletions: [
      {
        id: "demo-ritual-item-completion-water",
        ritual_item_id: "demo-ritual-item-water",
        schedule_id: "demo-schedule-ritual",
        occurrence_date: date,
      },
    ],
    actionLifeAreas: [
      { action_id: "demo-ritual-morning", life_area_id: "inner_state" },
      { action_id: "demo-regular-evening", life_area_id: "personal_growth" },
      { action_id: "demo-task-health-check", life_area_id: "body_health" },
      { action_id: "demo-time-slot-focus", life_area_id: "career" },
      { action_id: "demo-preparation-home", life_area_id: "money" },
    ],
  };
}
