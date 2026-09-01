import { z } from "zod";
import type { CloudWorkspacePayload, LegacyWorkspaceSnapshot } from "./types";
import type { PlannerRecords } from "@/domain/occurrences";
import type {
  Action,
  Attachment,
  Completion,
  Goal,
  LifeArea,
  Reflection,
  RitualItem,
  RitualItemCompletion,
  Schedule,
} from "@/domain/types";
import { createLocalPreviewGoals, createLocalPreviewSource } from "@/lib/local-preview-demo";

const COOKIE_NAME = "lifebalance_workspace";
const MAX_BODY_BYTES = 2_000_000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^\d{4}-\d{2}-01$/;
const TIME_VALUE = /^\d{2}:\d{2}(?::\d{2})?$/;
const WORKSPACE_TOKEN = /^[a-f0-9]{64}$/;

const id = z.string().min(1).max(200);
const dateKey = z.string().regex(DATE_KEY);
const nullableText = (max = 20_000) => z.string().max(max).nullable();
const nullableNumber = z.number().int().nonnegative().max(31_536_000).nullable();
const actionType = z.enum(["ritual", "regular_action", "task", "time_slot", "preparation"]);
const goalStatus = z.enum(["active", "completed", "cancelled"]);

const actionSchema = z.object({
  id,
  goal_id: id.nullable(),
  name: z.string().min(1).max(500),
  type: actionType,
  description: nullableText(),
  duration_seconds: nullableNumber,
  why_important: nullableText(),
  helps_with: nullableText(),
  start_date: dateKey,
  archived_at: nullableText(100),
  created_at: z.string().min(1).max(100),
});

const scheduleSchema = z.object({
  id,
  action_id: id,
  repeat_type: z.enum(["once", "weekly"]),
  scheduled_date: dateKey.nullable(),
  weekdays: z.array(z.number().int().min(1).max(7)).max(7),
  start_time: z.string().regex(TIME_VALUE).nullable(),
  duration_seconds: nullableNumber,
  status: z.enum(["planned", "cancelled"]),
});

const completionSchema = z.object({
  id,
  action_id: id,
  schedule_id: id.nullable(),
  occurrence_date: dateKey,
  completed_at: nullableText(100),
  status: z.enum(["completed", "in_progress", "skipped"]),
});

const ritualItemSchema = z.object({
  id,
  ritual_action_id: id,
  name: z.string().min(1).max(500),
  description: nullableText(),
  duration_seconds: nullableNumber,
  sort_order: z.number().int().min(0).max(10_000),
});

const ritualCompletionSchema = z.object({
  id,
  ritual_item_id: id,
  schedule_id: id.nullable(),
  occurrence_date: dateKey,
});

const actionLifeAreaSchema = z.object({ action_id: id, life_area_id: id });
const goalSchema = z.object({
  id,
  life_area_id: id,
  result_text: z.string().min(1).max(4_000),
  why_important: nullableText().optional().default(null),
  status: goalStatus,
  created_at: z.string().min(1).max(100),
  completed_at: nullableText(100),
  archived_at: nullableText(100),
  closed_on: dateKey.nullable(),
});
const reflectionSchema = z.object({
  id,
  month: dateKey,
  real_result: nullableText(),
  effective_actions: nullableText(),
  obstacles: nullableText(),
  system_change: nullableText(),
  next_experiment: nullableText(),
});
const attachmentSchema = z.object({
  id,
  action_id: id,
  type: z.enum(["video", "audio", "link"]),
  url: z.string().min(1).max(8_000),
  title: nullableText(1_000),
});

const legacySchema = z.object({
  seededFor: dateKey,
  source: z.object({
    actions: z.array(actionSchema).max(2_000),
    schedules: z.array(scheduleSchema).max(4_000),
    completions: z.array(completionSchema).max(20_000),
    ritualItems: z.array(ritualItemSchema).max(10_000),
    ritualItemCompletions: z.array(ritualCompletionSchema).max(40_000),
    actionLifeAreas: z.array(actionLifeAreaSchema).max(6_000),
  }),
  goals: z.array(goalSchema).max(2_000),
  reflections: z.array(reflectionSchema).max(1_000),
  attachments: z.array(attachmentSchema).max(5_000),
});

const actionPatchSchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    description: nullableText().optional(),
    duration_seconds: nullableNumber.optional(),
    why_important: nullableText().optional(),
    helps_with: nullableText().optional(),
    start_date: dateKey.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const schedulePatchSchema = z
  .object({
    weekdays: z.array(z.number().int().min(1).max(7)).max(7).optional(),
    scheduled_date: dateKey.nullable().optional(),
    start_time: z.string().regex(TIME_VALUE).nullable().optional(),
    duration_seconds: nullableNumber.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const ritualPatchSchema = z
  .object({
    name: z.string().min(1).max(500).optional(),
    description: nullableText().optional(),
    duration_seconds: nullableNumber.optional(),
    sort_order: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const actionDraftSchema = z.object({
  goalId: id.nullable(),
  newGoal: z
    .object({
      lifeAreaId: id,
      resultText: z.string().min(1).max(4_000),
      whyImportant: nullableText(),
    })
    .nullable()
    .optional(),
  name: z.string().min(1).max(500),
  type: actionType,
  description: nullableText(),
  durationSeconds: nullableNumber,
  whyImportant: nullableText(),
  helpsWith: nullableText(),
  startDate: dateKey,
  lifeAreaIds: z.array(id).max(3),
  ritualItems: z
    .array(
      z.object({
        name: z.string().min(1).max(500),
        description: nullableText(),
        durationSeconds: nullableNumber.optional(),
      }),
    )
    .max(100),
  attachments: z
    .array(
      z.object({
        type: z.enum(["video", "audio", "link"]),
        url: z.string().min(1).max(8_000),
        title: nullableText(1_000),
      }),
    )
    .max(100),
  schedules: z
    .array(
      z.object({
        repeat_type: z.enum(["once", "weekly"]),
        scheduled_date: dateKey.nullable(),
        weekdays: z.array(z.number().int().min(1).max(7)).max(7),
        start_time: z.string().regex(TIME_VALUE).nullable(),
        duration_seconds: nullableNumber,
      }),
    )
    .max(100),
});

const operationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("createGoal"),
    lifeAreaId: id,
    resultText: z.string().min(1).max(4_000),
    whyImportant: nullableText(),
  }),
  z.object({
    type: z.literal("updateGoal"),
    goalId: id,
    resultText: z.string().min(1).max(4_000),
    whyImportant: nullableText(),
  }),
  z.object({ type: z.literal("setGoalStatus"), goalId: id, status: goalStatus, closedOn: dateKey }),
  z.object({ type: z.literal("createAction"), draft: actionDraftSchema }),
  z.object({ type: z.literal("updateAction"), actionId: id, patch: actionPatchSchema }),
  z.object({
    type: z.literal("addRitualItem"),
    actionId: id,
    name: z.string().min(1).max(500),
    sortOrder: z.number().int().min(0).max(10_000),
  }),
  z.object({ type: z.literal("updateRitualItem"), itemId: id, patch: ritualPatchSchema }),
  z.object({ type: z.literal("reorderRitualItems"), orderedIds: z.array(id).min(1).max(1_000) }),
  z.object({ type: z.literal("updateSchedule"), scheduleId: id, patch: schedulePatchSchema }),
  z.object({
    type: z.literal("setCompletion"),
    actionId: id,
    scheduleId: id,
    date: dateKey,
    status: z.enum(["completed", "skipped"]),
  }),
  z.object({ type: z.literal("removeCompletion"), scheduleId: id, date: dateKey }),
  z.object({
    type: z.literal("setRitualItemCompletion"),
    ritualItemId: id,
    scheduleId: id,
    date: dateKey,
    done: z.boolean(),
  }),
  z.object({
    type: z.literal("saveReflection"),
    month: z.string().regex(MONTH_KEY),
    answers: z.object({
      real_result: nullableText().optional(),
      effective_actions: nullableText().optional(),
      obstacles: nullableText().optional(),
      system_change: nullableText().optional(),
      next_experiment: nullableText().optional(),
    }),
  }),
]);

const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bootstrap"), seedDate: dateKey, legacy: legacySchema.optional() }),
  z.object({ type: z.literal("mutate"), operation: operationSchema }),
]);

type WorkspaceContext = { id: string; cookie?: string; initialized: boolean };

class WorkspaceRequestError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404,
  ) {
    super(message);
  }
}

function json(data: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  if (cookie) headers.append("set-cookie", cookie);
  return Response.json(data, { status, headers });
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cookieValue(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) {
      const value = rest.join("=");
      return WORKSPACE_TOKEN.test(value) ? value : null;
    }
  }
  return null;
}

function workspaceCookie(request: Request, value: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

async function resolveWorkspace(
  db: D1Database,
  request: Request,
  seedDate: string,
): Promise<WorkspaceContext> {
  const existingToken = cookieValue(request);
  const workspaceId = existingToken ?? randomToken();
  const existing = await db
    .prepare("SELECT initialized_at FROM workspaces WHERE id = ?")
    .bind(workspaceId)
    .first<{ initialized_at: string | null }>();
  if (!existing) {
    const now = new Date().toISOString();
    await db
      .prepare(
        "INSERT INTO workspaces (id, seeded_for, initialized_at, imported_at, created_at, updated_at) VALUES (?, ?, NULL, NULL, ?, ?)",
      )
      .bind(workspaceId, seedDate, now, now)
      .run();
  }
  return {
    id: workspaceId,
    cookie: workspaceCookie(request, workspaceId),
    initialized: Boolean(existing?.initialized_at),
  };
}

function snapshotStatements(
  db: D1Database,
  workspaceId: string,
  snapshot: LegacyWorkspaceSnapshot,
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const goal of snapshot.goals) {
    statements.push(
      db
        .prepare(
          "INSERT INTO goals (id, workspace_id, life_area_id, result_text, why_important, status, created_at, completed_at, archived_at, closed_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          goal.id,
          workspaceId,
          goal.life_area_id,
          goal.result_text,
          goal.why_important,
          goal.status,
          goal.created_at,
          goal.completed_at,
          goal.archived_at,
          goal.closed_on,
        ),
    );
  }
  for (const action of snapshot.source.actions) {
    statements.push(
      db
        .prepare(
          "INSERT INTO actions (id, workspace_id, goal_id, name, type, description, duration_seconds, why_important, helps_with, start_date, archived_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          action.id,
          workspaceId,
          action.goal_id,
          action.name,
          action.type,
          action.description,
          action.duration_seconds,
          action.why_important,
          action.helps_with,
          action.start_date,
          action.archived_at,
          action.created_at,
        ),
    );
  }
  for (const relation of snapshot.source.actionLifeAreas) {
    statements.push(
      db
        .prepare(
          "INSERT INTO action_life_areas (workspace_id, action_id, life_area_id) VALUES (?, ?, ?)",
        )
        .bind(workspaceId, relation.action_id, relation.life_area_id),
    );
  }
  for (const item of snapshot.source.ritualItems) {
    statements.push(
      db
        .prepare(
          "INSERT INTO ritual_items (id, workspace_id, ritual_action_id, name, description, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          item.id,
          workspaceId,
          item.ritual_action_id,
          item.name,
          item.description,
          item.duration_seconds,
          item.sort_order,
        ),
    );
  }
  for (const schedule of snapshot.source.schedules) {
    statements.push(
      db
        .prepare(
          "INSERT INTO schedules (id, workspace_id, action_id, repeat_type, scheduled_date, weekdays_json, start_time, duration_seconds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          schedule.id,
          workspaceId,
          schedule.action_id,
          schedule.repeat_type,
          schedule.scheduled_date,
          JSON.stringify(schedule.weekdays),
          schedule.start_time,
          schedule.duration_seconds,
          schedule.status,
        ),
    );
  }
  for (const completion of snapshot.source.completions) {
    statements.push(
      db
        .prepare(
          "INSERT INTO completions (id, workspace_id, action_id, schedule_id, occurrence_date, completed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          completion.id,
          workspaceId,
          completion.action_id,
          completion.schedule_id,
          completion.occurrence_date,
          completion.completed_at,
          completion.status,
        ),
    );
  }
  for (const completion of snapshot.source.ritualItemCompletions) {
    statements.push(
      db
        .prepare(
          "INSERT INTO ritual_item_completions (id, workspace_id, ritual_item_id, schedule_id, occurrence_date) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          completion.id,
          workspaceId,
          completion.ritual_item_id,
          completion.schedule_id,
          completion.occurrence_date,
        ),
    );
  }
  for (const attachment of snapshot.attachments) {
    statements.push(
      db
        .prepare(
          "INSERT INTO attachments (id, workspace_id, action_id, type, url, title) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          attachment.id,
          workspaceId,
          attachment.action_id,
          attachment.type,
          attachment.url,
          attachment.title,
        ),
    );
  }
  for (const reflection of snapshot.reflections) {
    statements.push(
      db
        .prepare(
          "INSERT INTO reflections (id, workspace_id, month, real_result, effective_actions, obstacles, system_change, next_experiment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          reflection.id,
          workspaceId,
          reflection.month,
          reflection.real_result,
          reflection.effective_actions,
          reflection.obstacles,
          reflection.system_change,
          reflection.next_experiment,
        ),
    );
  }
  return statements;
}

async function initializeWorkspace(
  db: D1Database,
  workspace: WorkspaceContext,
  seedDate: string,
  legacy?: LegacyWorkspaceSnapshot,
): Promise<void> {
  if (workspace.initialized) return;
  const now = new Date().toISOString();
  const snapshot =
    legacy ??
    ({
      seededFor: seedDate,
      source: createLocalPreviewSource(seedDate),
      goals: createLocalPreviewGoals(seedDate),
      reflections: [],
      attachments: [],
    } satisfies LegacyWorkspaceSnapshot);
  const statements = snapshotStatements(db, workspace.id, snapshot);
  statements.push(
    db
      .prepare(
        "UPDATE workspaces SET seeded_for = ?, initialized_at = ?, imported_at = ?, updated_at = ? WHERE id = ? AND initialized_at IS NULL",
      )
      .bind(snapshot.seededFor, now, legacy ? now : null, now, workspace.id),
  );
  await db.batch(statements);
  workspace.initialized = true;
}

function parseWeekdays(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => Number.isInteger(item))
      ? (parsed as number[])
      : [];
  } catch {
    return [];
  }
}

async function readWorkspace(db: D1Database, workspaceId: string): Promise<CloudWorkspacePayload> {
  const results = await db.batch([
    db.prepare(
      "SELECT id, name, question, description, sort_order FROM life_areas ORDER BY sort_order",
    ),
    db
      .prepare(
        "SELECT id, life_area_id, result_text, why_important, status, created_at, completed_at, archived_at, closed_on FROM goals WHERE workspace_id = ? ORDER BY created_at DESC",
      )
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, goal_id, name, type, description, duration_seconds, why_important, helps_with, start_date, archived_at, created_at FROM actions WHERE workspace_id = ? ORDER BY created_at DESC",
      )
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, action_id, repeat_type, scheduled_date, weekdays_json, start_time, duration_seconds, status FROM schedules WHERE workspace_id = ?",
      )
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, action_id, schedule_id, occurrence_date, completed_at, status FROM completions WHERE workspace_id = ?",
      )
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, ritual_action_id, name, description, duration_seconds, sort_order FROM ritual_items WHERE workspace_id = ? ORDER BY sort_order",
      )
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, ritual_item_id, schedule_id, occurrence_date FROM ritual_item_completions WHERE workspace_id = ?",
      )
      .bind(workspaceId),
    db
      .prepare("SELECT action_id, life_area_id FROM action_life_areas WHERE workspace_id = ?")
      .bind(workspaceId),
    db
      .prepare(
        "SELECT id, month, real_result, effective_actions, obstacles, system_change, next_experiment FROM reflections WHERE workspace_id = ? ORDER BY month DESC",
      )
      .bind(workspaceId),
    db
      .prepare("SELECT id, action_id, type, url, title FROM attachments WHERE workspace_id = ?")
      .bind(workspaceId),
  ]);
  const rows = (index: number): Record<string, unknown>[] =>
    (results[index]?.results ?? []) as Record<string, unknown>[];
  const schedules = rows(3).map(({ weekdays_json, ...schedule }) => ({
    ...schedule,
    weekdays: parseWeekdays(String(weekdays_json ?? "[]")),
  })) as unknown as Schedule[];
  const source: PlannerRecords = {
    actions: rows(2) as unknown as Action[],
    schedules,
    completions: rows(4) as unknown as Completion[],
    ritualItems: rows(5) as unknown as RitualItem[],
    ritualItemCompletions: rows(6) as unknown as RitualItemCompletion[],
    actionLifeAreas: rows(7) as unknown as { action_id: string; life_area_id: string }[],
  };
  return {
    lifeAreas: rows(0) as unknown as LifeArea[],
    goals: rows(1) as unknown as Goal[],
    source,
    reflections: rows(8) as unknown as Reflection[],
    attachments: rows(9) as unknown as Attachment[],
  };
}

async function assertOwned(
  db: D1Database,
  table: "goals" | "actions" | "schedules" | "ritual_items",
  idColumn: "id",
  recordId: string,
  workspaceId: string,
): Promise<void> {
  const row = await db
    .prepare(`SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ? AND workspace_id = ?`)
    .bind(recordId, workspaceId)
    .first();
  if (!row)
    throw new WorkspaceRequestError("Запись не найдена в текущем рабочем пространстве.", 404);
}

function updateStatement(
  db: D1Database,
  table: "actions" | "schedules" | "ritual_items",
  recordId: string,
  workspaceId: string,
  patch: Record<string, unknown>,
): D1PreparedStatement {
  const entries = Object.entries(patch).map(
    ([key, value]) =>
      [
        key === "weekdays" ? "weekdays_json" : key,
        key === "weekdays" ? JSON.stringify(value) : value,
      ] as const,
  );
  const assignment = entries.map(([key]) => `${key} = ?`).join(", ");
  return db
    .prepare(`UPDATE ${table} SET ${assignment} WHERE id = ? AND workspace_id = ?`)
    .bind(...entries.map(([, value]) => value), recordId, workspaceId);
}

async function mutate(
  db: D1Database,
  workspaceId: string,
  operation: z.infer<typeof operationSchema>,
): Promise<unknown> {
  const now = new Date().toISOString();
  switch (operation.type) {
    case "createGoal": {
      const goal: Goal = {
        id: crypto.randomUUID(),
        life_area_id: operation.lifeAreaId,
        result_text: operation.resultText.trim(),
        why_important: operation.whyImportant,
        status: "active",
        created_at: now,
        completed_at: null,
        archived_at: null,
        closed_on: null,
      };
      await db
        .prepare(
          "INSERT INTO goals (id, workspace_id, life_area_id, result_text, why_important, status, created_at, completed_at, archived_at, closed_on) VALUES (?, ?, ?, ?, ?, 'active', ?, NULL, NULL, NULL)",
        )
        .bind(
          goal.id,
          workspaceId,
          goal.life_area_id,
          goal.result_text,
          goal.why_important,
          goal.created_at,
        )
        .run();
      return goal;
    }
    case "updateGoal":
      await assertOwned(db, "goals", "id", operation.goalId, workspaceId);
      await db
        .prepare(
          "UPDATE goals SET result_text = ?, why_important = ? WHERE id = ? AND workspace_id = ?",
        )
        .bind(operation.resultText.trim(), operation.whyImportant, operation.goalId, workspaceId)
        .run();
      return null;
    case "setGoalStatus":
      await assertOwned(db, "goals", "id", operation.goalId, workspaceId);
      await db
        .prepare(
          "UPDATE goals SET status = ?, completed_at = ?, archived_at = ?, closed_on = ? WHERE id = ? AND workspace_id = ?",
        )
        .bind(
          operation.status,
          operation.status === "completed" ? now : null,
          operation.status === "active" ? null : now,
          operation.status === "active" ? null : operation.closedOn,
          operation.goalId,
          workspaceId,
        )
        .run();
      return null;
    case "createAction": {
      const draft = operation.draft;
      const goal: Goal | undefined =
        !draft.goalId && draft.newGoal
          ? {
              id: crypto.randomUUID(),
              life_area_id: draft.newGoal.lifeAreaId,
              result_text: draft.newGoal.resultText.trim(),
              why_important: draft.newGoal.whyImportant,
              status: "active",
              created_at: now,
              completed_at: null,
              archived_at: null,
              closed_on: null,
            }
          : undefined;
      if (draft.goalId) await assertOwned(db, "goals", "id", draft.goalId, workspaceId);
      const action: Action = {
        id: crypto.randomUUID(),
        goal_id: draft.goalId ?? goal?.id ?? null,
        name: draft.name.trim(),
        type: draft.type,
        description: draft.description,
        duration_seconds: draft.durationSeconds,
        why_important: draft.whyImportant,
        helps_with: draft.helpsWith,
        start_date: draft.startDate,
        archived_at: null,
        created_at: now,
      };
      const statements: D1PreparedStatement[] = [];
      if (goal) {
        statements.push(
          db
            .prepare(
              "INSERT INTO goals (id, workspace_id, life_area_id, result_text, why_important, status, created_at, completed_at, archived_at, closed_on) VALUES (?, ?, ?, ?, ?, 'active', ?, NULL, NULL, NULL)",
            )
            .bind(
              goal.id,
              workspaceId,
              goal.life_area_id,
              goal.result_text,
              goal.why_important,
              goal.created_at,
            ),
        );
      }
      statements.push(
        db
          .prepare(
            "INSERT INTO actions (id, workspace_id, goal_id, name, type, description, duration_seconds, why_important, helps_with, start_date, archived_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)",
          )
          .bind(
            action.id,
            workspaceId,
            action.goal_id,
            action.name,
            action.type,
            action.description,
            action.duration_seconds,
            action.why_important,
            action.helps_with,
            action.start_date,
            action.created_at,
          ),
      );
      for (const lifeAreaId of [...new Set(draft.lifeAreaIds)].slice(0, 3)) {
        statements.push(
          db
            .prepare(
              "INSERT INTO action_life_areas (workspace_id, action_id, life_area_id) VALUES (?, ?, ?)",
            )
            .bind(workspaceId, action.id, lifeAreaId),
        );
      }
      draft.ritualItems.forEach((item, index) => {
        statements.push(
          db
            .prepare(
              "INSERT INTO ritual_items (id, workspace_id, ritual_action_id, name, description, duration_seconds, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              crypto.randomUUID(),
              workspaceId,
              action.id,
              item.name.trim(),
              item.description,
              item.durationSeconds ?? null,
              index,
            ),
        );
      });
      for (const attachment of draft.attachments) {
        statements.push(
          db
            .prepare(
              "INSERT INTO attachments (id, workspace_id, action_id, type, url, title) VALUES (?, ?, ?, ?, ?, ?)",
            )
            .bind(
              crypto.randomUUID(),
              workspaceId,
              action.id,
              attachment.type,
              attachment.url.trim(),
              attachment.title,
            ),
        );
      }
      for (const schedule of draft.schedules) {
        statements.push(
          db
            .prepare(
              "INSERT INTO schedules (id, workspace_id, action_id, repeat_type, scheduled_date, weekdays_json, start_time, duration_seconds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'planned')",
            )
            .bind(
              crypto.randomUUID(),
              workspaceId,
              action.id,
              schedule.repeat_type,
              schedule.scheduled_date,
              JSON.stringify(schedule.weekdays),
              schedule.start_time,
              schedule.duration_seconds,
            ),
        );
      }
      await db.batch(statements);
      return action;
    }
    case "updateAction":
      await assertOwned(db, "actions", "id", operation.actionId, workspaceId);
      await updateStatement(db, "actions", operation.actionId, workspaceId, operation.patch).run();
      return null;
    case "addRitualItem":
      await assertOwned(db, "actions", "id", operation.actionId, workspaceId);
      await db
        .prepare(
          "INSERT INTO ritual_items (id, workspace_id, ritual_action_id, name, description, duration_seconds, sort_order) VALUES (?, ?, ?, ?, NULL, NULL, ?)",
        )
        .bind(
          crypto.randomUUID(),
          workspaceId,
          operation.actionId,
          operation.name.trim(),
          operation.sortOrder,
        )
        .run();
      return null;
    case "updateRitualItem":
      await assertOwned(db, "ritual_items", "id", operation.itemId, workspaceId);
      await updateStatement(
        db,
        "ritual_items",
        operation.itemId,
        workspaceId,
        operation.patch,
      ).run();
      return null;
    case "reorderRitualItems": {
      const rows = await db
        .prepare(
          `SELECT id FROM ritual_items WHERE workspace_id = ? AND id IN (${operation.orderedIds.map(() => "?").join(",")})`,
        )
        .bind(workspaceId, ...operation.orderedIds)
        .all<{ id: string }>();
      if (rows.results.length !== new Set(operation.orderedIds).size)
        throw new WorkspaceRequestError(
          "Не все пункты принадлежат текущему рабочему пространству.",
          400,
        );
      await db.batch(
        operation.orderedIds.map((itemId, index) =>
          db
            .prepare("UPDATE ritual_items SET sort_order = ? WHERE id = ? AND workspace_id = ?")
            .bind(index, itemId, workspaceId),
        ),
      );
      return null;
    }
    case "updateSchedule":
      await assertOwned(db, "schedules", "id", operation.scheduleId, workspaceId);
      await updateStatement(
        db,
        "schedules",
        operation.scheduleId,
        workspaceId,
        operation.patch,
      ).run();
      return null;
    case "setCompletion": {
      const schedule = await db
        .prepare("SELECT action_id FROM schedules WHERE id = ? AND workspace_id = ?")
        .bind(operation.scheduleId, workspaceId)
        .first<{ action_id: string }>();
      if (!schedule || schedule.action_id !== operation.actionId)
        throw new WorkspaceRequestError("Расписание не принадлежит выбранному действию.", 400);
      await db
        .prepare(
          "INSERT INTO completions (id, workspace_id, action_id, schedule_id, occurrence_date, completed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (workspace_id, schedule_id, occurrence_date) DO UPDATE SET action_id = excluded.action_id, completed_at = excluded.completed_at, status = excluded.status",
        )
        .bind(
          crypto.randomUUID(),
          workspaceId,
          operation.actionId,
          operation.scheduleId,
          operation.date,
          operation.status === "completed" ? now : null,
          operation.status,
        )
        .run();
      return null;
    }
    case "removeCompletion":
      await db
        .prepare(
          "DELETE FROM completions WHERE workspace_id = ? AND schedule_id = ? AND occurrence_date = ?",
        )
        .bind(workspaceId, operation.scheduleId, operation.date)
        .run();
      return null;
    case "setRitualItemCompletion": {
      const item = await db
        .prepare("SELECT id FROM ritual_items WHERE id = ? AND workspace_id = ?")
        .bind(operation.ritualItemId, workspaceId)
        .first();
      const schedule = await db
        .prepare("SELECT id FROM schedules WHERE id = ? AND workspace_id = ?")
        .bind(operation.scheduleId, workspaceId)
        .first();
      if (!item || !schedule)
        throw new WorkspaceRequestError("Пункт ритуала или расписание не найдено.", 404);
      if (operation.done) {
        await db
          .prepare(
            "INSERT INTO ritual_item_completions (id, workspace_id, ritual_item_id, schedule_id, occurrence_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT (workspace_id, ritual_item_id, schedule_id, occurrence_date) DO NOTHING",
          )
          .bind(
            crypto.randomUUID(),
            workspaceId,
            operation.ritualItemId,
            operation.scheduleId,
            operation.date,
          )
          .run();
      } else {
        await db
          .prepare(
            "DELETE FROM ritual_item_completions WHERE workspace_id = ? AND ritual_item_id = ? AND schedule_id = ? AND occurrence_date = ?",
          )
          .bind(workspaceId, operation.ritualItemId, operation.scheduleId, operation.date)
          .run();
      }
      return null;
    }
    case "saveReflection": {
      const existing = await db
        .prepare(
          "SELECT id, real_result, effective_actions, obstacles, system_change, next_experiment FROM reflections WHERE workspace_id = ? AND month = ?",
        )
        .bind(workspaceId, operation.month)
        .first<Reflection>();
      const value = (field: keyof typeof operation.answers): string | null =>
        Object.prototype.hasOwnProperty.call(operation.answers, field)
          ? (operation.answers[field] ?? null)
          : (existing?.[field] ?? null);
      await db
        .prepare(
          "INSERT INTO reflections (id, workspace_id, month, real_result, effective_actions, obstacles, system_change, next_experiment) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (workspace_id, month) DO UPDATE SET real_result = excluded.real_result, effective_actions = excluded.effective_actions, obstacles = excluded.obstacles, system_change = excluded.system_change, next_experiment = excluded.next_experiment",
        )
        .bind(
          existing?.id ?? crypto.randomUUID(),
          workspaceId,
          operation.month,
          value("real_result"),
          value("effective_actions"),
          value("obstacles"),
          value("system_change"),
          value("next_experiment"),
        )
        .run();
      return null;
    }
  }
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function handleWorkspaceApi(request: Request, db: D1Database): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Метод не поддерживается." }, 405);
  if (!sameOrigin(request)) return json({ error: "Запрос из другого источника отклонён." }, 403);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: "Запрос слишком большой." }, 413);

  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES)
      return json({ error: "Запрос слишком большой." }, 413);
    const raw: unknown = JSON.parse(body);
    const parsed = requestSchema.parse(raw);
    const seedDate =
      parsed.type === "bootstrap" ? parsed.seedDate : new Date().toISOString().slice(0, 10);
    const workspace = await resolveWorkspace(db, request, seedDate);
    const legacy = parsed.type === "bootstrap" ? parsed.legacy : undefined;
    await initializeWorkspace(db, workspace, seedDate, legacy);

    if (parsed.type === "bootstrap") {
      const data = await readWorkspace(db, workspace.id);
      return json({ data }, 200, workspace.cookie);
    }

    const result = await mutate(db, workspace.id, parsed.operation);
    await db
      .prepare("UPDATE workspaces SET updated_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), workspace.id)
      .run();
    return json({ data: result }, 200, workspace.cookie);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return json({ error: "Некорректные данные запроса." }, 400);
    }
    if (error instanceof WorkspaceRequestError) {
      return json({ error: error.message }, error.status);
    }
    console.error(JSON.stringify({ event: "workspace_api_error", error }));
    return json({ error: "Не удалось обработать запрос." }, 500);
  }
}
