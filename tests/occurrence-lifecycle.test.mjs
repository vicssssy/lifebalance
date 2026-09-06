import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

// Real API handler, domain and migration SQL. SQLite adapter models D1 atomic batches.
// No production data or network access. Requires Node >= 22 with node:sqlite.
const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports,
      crypto,
      Request,
      Response,
      Headers,
      URL,
      TextEncoder,
      console,
      Error,
      require: (id) =>
        id.startsWith("@/") || id.startsWith(".")
          ? load(
              (id.startsWith("@/")
                ? path.join(root, "src", id.slice(2))
                : path.resolve(path.dirname(file), id)) + ".ts",
            )
          : require(id),
    },
  );
  return exports;
}
const { handleWorkspaceApi } = load(path.join(root, "src/cloud/workspace-api.ts"));
const { occurrencesForDate, factsForRange } = load(path.join(root, "src/domain/occurrences.ts"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const actionTypes = ["ritual", "regular_action", "task", "time_slot", "preparation"];
const date = "2026-09-09"; // Wednesday

function database() {
  const sql = new DatabaseSync(":memory:");
  for (const file of fs.readdirSync(path.join(root, "migrations")).sort())
    sql.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8"));
  class Statement {
    constructor(query, args = []) {
      this.query = query;
      this.args = args;
    }
    bind(...args) {
      return new Statement(this.query, args);
    }
    first() {
      return Promise.resolve(sql.prepare(this.query).get(...this.args) ?? null);
    }
    all() {
      return Promise.resolve(this.execute());
    }
    run() {
      return Promise.resolve(this.execute());
    }
    execute() {
      const stmt = sql.prepare(this.query);
      if (stmt.columns().length)
        return { results: stmt.all(...this.args), meta: { changes: 0 }, success: true };
      const result = stmt.run(...this.args);
      return { results: [], meta: { changes: Number(result.changes) }, success: true };
    }
  }
  return {
    prepare: (query) => new Statement(query),
    batch: (statements) => {
      sql.exec("BEGIN");
      try {
        const results = statements.map((statement) => statement.execute());
        sql.exec("COMMIT");
        return Promise.resolve(results);
      } catch (error) {
        sql.exec("ROLLBACK");
        throw error;
      }
    },
    close: () => sql.close(),
  };
}

async function workspace(t) {
  const endpoint = process.env.LIFEBALANCE_TEST_URL;
  if (endpoint) {
    const url = new URL(endpoint);
    assert.ok(
      url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname),
      "Integration tests may only mutate a local test Worker",
    );
  }
  const db = endpoint ? null : database();
  t.after(() => db?.close());
  let cookie;
  const request = async (body, status = 200) => {
    const req = new Request(endpoint ?? "http://localhost/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
    });
    const response = endpoint ? await fetch(req) : await handleWorkspaceApi(req, db);
    cookie ??= response.headers.get("set-cookie")?.split(";")[0];
    const result = await response.json();
    if (Array.isArray(status)) assert.ok(status.includes(response.status), JSON.stringify(result));
    else assert.equal(response.status, status, JSON.stringify(result));
    return result;
  };
  const read = async () => (await request({ type: "bootstrap", seedDate: date })).data;
  await read();
  const mutate = (operation, status) => request({ type: "mutate", operation }, status);
  const goal = (
    await mutate({
      type: "createGoal",
      lifeAreaId: "body_health",
      resultText: "Цель проверки",
      whyImportant: null,
    })
  ).data;
  const create = async (
    type,
    weekly = ["ritual", "regular_action"].includes(type),
    goalId = goal.id,
  ) => {
    const action = (
      await mutate({
        type: "createAction",
        draft: {
          goalId,
          name: `Проверка ${type}`,
          type,
          description: null,
          durationSeconds: 900,
          whyImportant: null,
          helpsWith: null,
          startDate: "2026-09-01",
          lifeAreaIds: ["body_health"],
          ritualItems:
            type === "ritual"
              ? [
                  { name: "Первый", description: null },
                  { name: "Второй", description: null },
                ]
              : [],
          attachments: [
            { type: "link", url: "https://example.com/shared-material", title: "Материал" },
          ],
          schedules: [
            {
              repeat_type: weekly ? "weekly" : "once",
              weekdays: weekly ? [1, 3, 5] : [],
              scheduled_date: weekly ? null : date,
              start_time: "07:00",
              duration_seconds: 900,
            },
          ],
        },
      })
    ).data;
    const data = await read();
    return {
      action,
      schedule: data.source.schedules.find((s) => s.action_id === action.id),
      items: data.source.ritualItems.filter((i) => i.ritual_action_id === action.id),
    };
  };
  const at = (data, day, id) =>
    occurrencesForDate({ ...data.source, goals: data.goals }, day, "history").filter(
      (o) => o.action.id === id,
    );
  return { read, mutate, create, at, goal, db };
}

for (const type of actionTypes) {
  test(`${type}: completion, skip, move and reopen affect one occurrence only`, async (t) => {
    const { read, mutate, create, at } = await workspace(t);
    const { action, schedule, items } = await create(type);
    const context = { actionId: action.id, scheduleId: schedule.id, date };
    if (type === "ritual") {
      for (const item of items)
        await mutate({
          type: "setRitualItemCompletion",
          ritualItemId: item.id,
          scheduleId: schedule.id,
          date,
          done: true,
        });
    } else await mutate({ type: "setCompletion", ...context, status: "completed" });
    let data = await read();
    assert.equal(at(data, date, action.id)[0].completed, true);
    const completion = data.source.completions.find((c) => c.schedule_id === schedule.id);
    assert.equal(
      at(data, "2026-09-11", action.id).some((o) => o.completed),
      false,
    );
    await mutate({ type: "setCompletion", ...context, status: "skipped" });
    data = await read();
    assert.equal(at(data, date, action.id)[0].skipped, true);
    assert.equal(at(data, date, action.id)[0].completed, false);
    const skippedFacts = factsForRange({ ...data.source, goals: data.goals }, date, date).find(
      (f) => f.action.id === action.id,
    );
    assert.equal(skippedFacts.planned, 1);
    assert.equal(skippedFacts.completed, 0);
    const originalSchedule = clone(data.source.schedules.find((s) => s.id === schedule.id));
    await mutate({
      type: "rescheduleOccurrence",
      scheduleId: schedule.id,
      fromDate: date,
      date: "2026-09-10",
      startTime: "09:30",
      durationSeconds: 1800,
    });
    data = await read();
    assert.equal(at(data, date, action.id).length, 0);
    const moved = at(data, "2026-09-10", action.id);
    assert.equal(moved.length, 1);
    assert.equal(moved[0].originalDate, date);
    assert.equal(moved[0].startTime, "09:30");
    assert.equal(moved[0].durationSeconds, 1800);
    assert.equal(moved[0].skipped, true);
    assert.deepEqual(
      clone(data.source.schedules.find((s) => s.id === schedule.id)),
      originalSchedule,
    );
    assert.equal(
      data.source.completions.find((c) => c.schedule_id === schedule.id).id,
      completion.id,
    );
    await mutate({ type: "setCompletion", ...context, date: "2026-09-10", status: "completed" });
    data = await read();
    assert.equal(at(data, "2026-09-10", action.id)[0].completed, true);
    assert.equal(at(data, "2026-09-10", action.id)[0].skipped, false);
    assert.equal(data.source.completions.filter((c) => c.schedule_id === schedule.id).length, 1);
    const facts = factsForRange(
      { ...data.source, goals: data.goals },
      "2026-09-09",
      "2026-09-10",
    ).find((f) => f.action.id === action.id);
    assert.equal(facts.planned, 1);
    assert.equal(facts.completed, 1);
    if (["ritual", "regular_action"].includes(type)) {
      assert.equal(at(data, "2026-09-11", action.id).length, 1);
      assert.equal(at(data, "2026-09-16", action.id)[0].startTime, "07:00");
      await mutate(
        {
          type: "rescheduleOccurrence",
          scheduleId: schedule.id,
          fromDate: "2026-09-10",
          date: "2026-09-11",
          startTime: "09:00",
          durationSeconds: 900,
        },
        400,
      );
    }
    await mutate({
      type: "rescheduleOccurrence",
      scheduleId: schedule.id,
      fromDate: "2026-09-10",
      date: "2026-09-12",
      startTime: null,
      durationSeconds: null,
    });
    data = await read();
    assert.equal(at(data, "2026-09-10", action.id).length, 0);
    assert.equal(at(data, "2026-09-12", action.id)[0].completed, true);
    assert.equal(
      data.source.occurrenceOverrides.filter((o) => o.schedule_id === schedule.id).length,
      1,
    );
    assert.deepEqual(clone(data.source.actions.find((a) => a.id === action.id)), clone(action));
    if (!["ritual", "regular_action"].includes(type)) {
      await mutate({
        type: "updateActionConfiguration",
        actionId: action.id,
        draft: {
          name: action.name,
          description: action.description,
          durationSeconds: action.duration_seconds,
          whyImportant: action.why_important,
          startDate: action.start_date,
          lifeAreaIds: ["body_health"],
          ritualItems: [],
          attachments: [],
          schedules: [{ ...originalSchedule, scheduled_date: "2026-09-14", start_time: "11:00" }],
        },
      });
      const edited = await read();
      assert.equal(at(edited, "2026-09-12", action.id).length, 0);
      assert.equal(at(edited, date, action.id).length, 0);
      const editedOccurrence = at(edited, "2026-09-14", action.id);
      assert.equal(editedOccurrence.length, 1);
      assert.equal(editedOccurrence[0].originalDate, date);
      assert.equal(editedOccurrence[0].completed, true);
      assert.equal(editedOccurrence[0].startTime, "11:00");
    }
  });
}

test("ritual: partial progress, automatic completion, unchecking, pause and foreign-item rejection", async (t) => {
  const { read, mutate, create, at } = await workspace(t);
  const { action, schedule, items } = await create("ritual");
  const other = await create("ritual");
  const context = { scheduleId: schedule.id, date };
  const setItem = (item, done) =>
    mutate({ type: "setRitualItemCompletion", ritualItemId: item.id, ...context, done });
  await mutate({ type: "setCompletion", actionId: action.id, ...context, status: "completed" });
  assert.equal(at(await read(), date, action.id)[0].completed, false);
  await setItem(items[0], true);
  await mutate({ type: "setCompletion", actionId: action.id, ...context, status: "skipped" });
  await mutate({ type: "removeCompletion", ...context }); // Вернусь позже
  let occurrence = at(await read(), date, action.id)[0];
  assert.deepEqual(clone(occurrence.ritualProgress), { done: 1, total: 2 });
  assert.equal(occurrence.completed || occurrence.skipped, false);
  await setItem(items[1], true);
  assert.equal(at(await read(), date, action.id)[0].completed, true);
  await setItem(items[0], false);
  occurrence = at(await read(), date, action.id)[0];
  assert.equal(occurrence.completed || occurrence.skipped, false);
  assert.equal(occurrence.ritualProgress.done, 1);
  await mutate(
    { type: "setRitualItemCompletion", ritualItemId: other.items[0].id, ...context, done: true },
    404,
  );
  await Promise.all(items.map((item) => setItem(item, true)));
  assert.equal(at(await read(), date, action.id)[0].completed, true);
  await mutate({
    type: "rescheduleOccurrence",
    scheduleId: schedule.id,
    fromDate: date,
    date: "2026-09-10",
    startTime: "08:00",
    durationSeconds: 900,
  });
  await mutate({
    type: "setRitualItemCompletion",
    ritualItemId: items[0].id,
    scheduleId: schedule.id,
    date: "2026-09-10",
    done: false,
  });
  occurrence = at(await read(), "2026-09-10", action.id)[0];
  assert.equal(occurrence.completed, false);
  assert.equal(occurrence.ritualProgress.done, 1);
});

test("guards: invalid/stale date, start_date, same-date time override, destination collision", async (t) => {
  const { read, mutate, create, at } = await workspace(t);
  const { action, schedule } = await create("regular_action");
  const move = (fromDate, target, status = 200) =>
    mutate(
      {
        type: "rescheduleOccurrence",
        scheduleId: schedule.id,
        fromDate,
        date: target,
        startTime: "19:00",
        durationSeconds: 1200,
      },
      status,
    );
  await move(date, "2026-08-31", 400);
  await move(date, "2026-09-31", 400);
  await move("2026-09-08", "2026-09-10", 400);
  await move(date, date);
  assert.equal(at(await read(), date, action.id)[0].startTime, "19:00");
  assert.equal(at(await read(), "2026-09-11", action.id)[0].startTime, "07:00");
  await move(date, "2026-09-10");
  await mutate(
    {
      type: "setCompletion",
      actionId: action.id,
      scheduleId: schedule.id,
      date,
      status: "completed",
    },
    400,
  );
  await move("2026-09-11", "2026-09-10", 400);
  await move("2026-09-10", date); // Moving home reuses the same identity.
  assert.equal(at(await read(), date, action.id).length, 1);
});

test("two concurrent moves cannot occupy one destination; terminal writes remain exclusive", async (t) => {
  const { read, mutate, create, at } = await workspace(t);
  const { action, schedule } = await create("regular_action");
  const results = await Promise.all(
    [date, "2026-09-11"].map((fromDate) =>
      mutate(
        {
          type: "rescheduleOccurrence",
          scheduleId: schedule.id,
          fromDate,
          date: "2026-09-12",
          startTime: "09:00",
          durationSeconds: 900,
        },
        [200, 400],
      ),
    ),
  );
  assert.equal(results.filter((r) => r.error).length, 1);
  assert.equal(at(await read(), "2026-09-12", action.id).length, 1);
  await Promise.all(
    ["completed", "skipped"].map((status) =>
      mutate({
        type: "setCompletion",
        actionId: action.id,
        scheduleId: schedule.id,
        date: "2026-09-12",
        status,
      }),
    ),
  );
  const data = await read();
  const occurrence = at(data, "2026-09-12", action.id)[0];
  assert.notEqual(occurrence.completed, occurrence.skipped);
  assert.equal(data.source.completions.filter((c) => c.schedule_id === schedule.id).length, 1);
  await mutate({ type: "removeCompletion", scheduleId: schedule.id, date: "2026-09-12" });
  const reopened = at(await read(), "2026-09-12", action.id)[0];
  assert.equal(reopened.completed || reopened.skipped, false);
});

for (const status of ["completed", "cancelled"]) {
  test(`Goal ${status}: moved history survives; another active Goal is unaffected`, async (t) => {
    const { read, mutate, create, at, goal } = await workspace(t);
    const { action, schedule } = await create("regular_action");
    const before = await read();
    const unrelated = before.source.actions.find((a) => a.goal_id !== goal.id);
    const unrelatedBefore = clone(at(before, "2026-09-11", unrelated.id));
    await mutate({
      type: "rescheduleOccurrence",
      scheduleId: schedule.id,
      fromDate: date,
      date: "2026-09-10",
      startTime: "08:00",
      durationSeconds: 900,
    });
    await mutate({
      type: "setCompletion",
      actionId: action.id,
      scheduleId: schedule.id,
      date: "2026-09-10",
      status: "completed",
    });
    await mutate({ type: "setGoalStatus", goalId: goal.id, status, closedOn: "2026-09-11" });
    const data = await read();
    assert.equal(at(data, "2026-09-10", action.id)[0].completed, true);
    assert.equal(at(data, "2026-09-11", action.id).length, 0);
    assert.equal(at(data, "2026-09-14", action.id).length, 0);
    assert.deepEqual(clone(at(data, "2026-09-11", unrelated.id)), unrelatedBefore);
    assert.equal(
      factsForRange({ ...data.source, goals: data.goals }, date, "2026-09-10").find(
        (f) => f.action.id === action.id,
      ).completed,
      1,
    );
  });
}

const ownedTables = [
  "goals",
  "actions",
  "schedules",
  "completions",
  "ritual_items",
  "ritual_item_completions",
  "attachments",
  "action_life_areas",
  "occurrence_overrides",
];
async function snapshot(db) {
  const result = {};
  for (const table of [...ownedTables, "life_areas", "reflections"])
    result[table] = clone(
      (await db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()).results,
    );
  return result;
}

for (const status of ["completed", "cancelled"]) {
  test(`permanent deletion ${status}: all five owned graphs disappear, independent data/history remain`, async (t) => {
    const { read, mutate, create, goal, db } = await workspace(t);
    const independent = await create("ritual", true, null);
    const otherGoal = (
      await mutate({
        type: "createGoal",
        lifeAreaId: "body_health",
        resultText: "Другая архивная цель",
        whyImportant: null,
      })
    ).data;
    const otherAction = await create("task", false, otherGoal.id);
    await mutate({
      type: "setCompletion",
      actionId: otherAction.action.id,
      scheduleId: otherAction.schedule.id,
      date,
      status: "completed",
    });
    await mutate({
      type: "setGoalStatus",
      goalId: otherGoal.id,
      status: "cancelled",
      closedOn: "2026-09-11",
    });
    await mutate({
      type: "setRitualItemCompletion",
      ritualItemId: independent.items[0].id,
      scheduleId: independent.schedule.id,
      date,
      done: true,
    });
    await mutate({
      type: "saveReflection",
      month: "2026-09-01",
      answers: { real_result: "Общий итог месяца; сохраняется независимо от цели" },
    });
    const owned = [];
    for (const type of actionTypes) {
      const row = await create(type);
      owned.push(row);
      if (type === "ritual")
        await mutate({
          type: "setRitualItemCompletion",
          ritualItemId: row.items[0].id,
          scheduleId: row.schedule.id,
          date,
          done: true,
        });
      else
        await mutate({
          type: "setCompletion",
          actionId: row.action.id,
          scheduleId: row.schedule.id,
          date,
          status: type === "task" ? "skipped" : "completed",
        });
    }
    await mutate({
      type: "rescheduleOccurrence",
      scheduleId: owned[1].schedule.id,
      fromDate: date,
      date: "2026-09-10",
      startTime: "09:00",
      durationSeconds: 900,
    });
    await mutate({ type: "setGoalStatus", goalId: goal.id, status, closedOn: "2026-09-11" });
    const ids = new Set(owned.map((row) => row.action.id));
    const schedules = new Set(owned.map((row) => row.schedule.id));
    const items = new Set(owned.flatMap((row) => row.items.map((item) => item.id)));
    if (db) {
      const { workspace_id: wid } = await db
        .prepare("SELECT workspace_id FROM goals WHERE id = ?")
        .bind(goal.id)
        .first();
      await db
        .prepare(
          "INSERT INTO completions (id, workspace_id, action_id, schedule_id, occurrence_date, status) VALUES (?, ?, ?, NULL, ?, 'completed')",
        )
        .bind(crypto.randomUUID(), wid, owned[2].action.id, "2026-09-01")
        .run();
      await db
        .prepare(
          "INSERT INTO ritual_item_completions (id, workspace_id, ritual_item_id, schedule_id, occurrence_date) VALUES (?, ?, ?, NULL, ?)",
        )
        .bind(crypto.randomUUID(), wid, owned[0].items[0].id, "2026-09-01")
        .run();
      await db
        .prepare("UPDATE attachments SET archived_at = '2026-09-10' WHERE action_id = ?")
        .bind(owned[0].action.id)
        .run();
    }
    const before = await read();
    const rawBefore = db ? await snapshot(db) : null;
    const belongs = (table, row) =>
      table === "goals"
        ? row.id === goal.id
        : table === "actions"
          ? ids.has(row.id)
          : table === "ritual_items"
            ? ids.has(row.ritual_action_id)
            : table === "ritual_item_completions"
              ? items.has(row.ritual_item_id)
              : table === "occurrence_overrides"
                ? schedules.has(row.schedule_id)
                : ids.has(row.action_id);
    await mutate({ type: "deleteArchivedGoal", goalId: goal.id });
    const after = await read(); // server reload, not optimistic UI
    assert.deepEqual(clone(after.goals), clone(before.goals.filter((g) => g.id !== goal.id)));
    assert.deepEqual(
      clone(after.source.actions),
      clone(before.source.actions.filter((a) => !ids.has(a.id))),
    );
    assert.deepEqual(clone(after.reflections), clone(before.reflections));
    assert.equal(
      after.source.schedules.some((s) => ids.has(s.action_id)),
      false,
    );
    assert.equal(
      after.source.completions.some((c) => ids.has(c.action_id)),
      false,
    );
    assert.equal(
      after.source.ritualItemCompletions.some((c) => items.has(c.ritual_item_id)),
      false,
    );
    assert.equal(
      after.source.occurrenceOverrides.some((o) => schedules.has(o.schedule_id)),
      false,
    );
    const facts = (data) =>
      clone(factsForRange({ ...data.source, goals: data.goals }, "2026-09-01", "2026-09-30"));
    assert.deepEqual(
      facts(after),
      facts(before).filter((f) => !ids.has(f.action.id)),
    );
    if (db) {
      const rawAfter = await snapshot(db);
      for (const table of Object.keys(rawBefore))
        assert.deepEqual(
          rawAfter[table],
          rawBefore[table].filter((row) => !belongs(table, row)),
          table,
        );
      assert.equal((await db.prepare("PRAGMA foreign_key_check").all()).results.length, 0);
    }
    await mutate({ type: "deleteArchivedGoal", goalId: goal.id }, 404);
  });
}

test("permanent deletion rejects active and unknown Goals without changing data", async (t) => {
  const { read, mutate, create, goal, db } = await workspace(t);
  await create("task");
  const before = db ? await snapshot(db) : clone(await read());
  await mutate({ type: "deleteArchivedGoal", goalId: goal.id }, 400);
  await mutate({ type: "deleteArchivedGoal", goalId: crypto.randomUUID() }, 404);
  assert.deepEqual(db ? await snapshot(db) : clone(await read()), before);
});

for (const ritual of [false, true])
  for (const reverse of [false, true]) {
    test(
      `permanent deletion refuses cross-boundary ${ritual ? "ritual" : "completion"} history, direction ${reverse}`,
      { skip: !!process.env.LIFEBALANCE_TEST_URL },
      async (t) => {
        const { mutate, create, goal, db } = await workspace(t);
        const owned = await create("ritual");
        const independent = await create("ritual", true, null);
        await mutate({
          type: "rescheduleOccurrence",
          scheduleId: owned.schedule.id,
          fromDate: date,
          date: "2026-09-10",
          startTime: "09:00",
          durationSeconds: 900,
        });
        await mutate({
          type: "setGoalStatus",
          goalId: goal.id,
          status: "completed",
          closedOn: "2026-09-11",
        });
        const { workspace_id: wid } = await db
          .prepare("SELECT workspace_id FROM goals WHERE id = ?")
          .bind(goal.id)
          .first();
        const owner = reverse ? owned : independent,
          scheduled = reverse ? independent : owned;
        if (ritual)
          await db
            .prepare(
              "INSERT INTO ritual_item_completions (id, workspace_id, ritual_item_id, schedule_id, occurrence_date) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(crypto.randomUUID(), wid, owner.items[0].id, scheduled.schedule.id, date)
            .run();
        else
          await db
            .prepare(
              "INSERT INTO completions (id, workspace_id, action_id, schedule_id, occurrence_date, status) VALUES (?, ?, ?, ?, ?, 'completed')",
            )
            .bind(crypto.randomUUID(), wid, owner.action.id, scheduled.schedule.id, date)
            .run();
        const before = await snapshot(db);
        await mutate({ type: "deleteArchivedGoal", goalId: goal.id }, 400);
        assert.deepEqual(await snapshot(db), before);
      },
    );
  }

test(
  "permanent deletion is workspace-scoped and rolls back overrides on cascade failure",
  { skip: !!process.env.LIFEBALANCE_TEST_URL },
  async (t) => {
    const { mutate, create, goal, db } = await workspace(t);
    const { schedule } = await create("regular_action");
    await mutate({
      type: "rescheduleOccurrence",
      scheduleId: schedule.id,
      fromDate: date,
      date: "2026-09-10",
      startTime: "09:00",
      durationSeconds: 900,
    });
    await mutate({
      type: "setGoalStatus",
      goalId: goal.id,
      status: "cancelled",
      closedOn: "2026-09-11",
    });
    const { workspace_id: wid } = await db
      .prepare("SELECT workspace_id FROM goals WHERE id = ?")
      .bind(goal.id)
      .first();
    await db
      .prepare(
        "INSERT INTO workspaces (id, seeded_for, created_at, updated_at) VALUES ('other', ?, ?, ?)",
      )
      .bind(date, date, date)
      .run();
    await db
      .prepare(
        "INSERT INTO goals (id, workspace_id, life_area_id, result_text, status, created_at) VALUES (?, 'other', 'body_health', 'Чужая цель с таким же ID', 'completed', ?)",
      )
      .bind(goal.id, date)
      .run();
    const otherGoalBefore = clone(
      await db.prepare("SELECT * FROM goals WHERE workspace_id = 'other'").first(),
    );
    const { deleteArchivedGoalData } = load(path.join(root, "src/cloud/delete-archived-goal.ts"));
    const before = await snapshot(db);
    assert.equal(await deleteArchivedGoalData(db, "another-workspace", goal.id), false);
    assert.deepEqual(await snapshot(db), before);
    await db
      .prepare(
        "CREATE TRIGGER deletion_failure BEFORE DELETE ON actions BEGIN SELECT RAISE(ABORT, 'injected failure'); END",
      )
      .run();
    await assert.rejects(async () => deleteArchivedGoalData(db, wid, goal.id), /injected failure/);
    assert.deepEqual(await snapshot(db), before);
    await db.prepare("DROP TRIGGER deletion_failure").run();
    assert.equal(await deleteArchivedGoalData(db, wid, goal.id), true);
    assert.deepEqual(
      clone(await db.prepare("SELECT * FROM goals WHERE workspace_id = 'other'").first()),
      otherGoalBefore,
    );
  },
);
