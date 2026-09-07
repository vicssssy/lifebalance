import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  const defaults = {
    "./OccurrenceCard": { OccurrenceCard: "OccurrenceCard" },
    react: {
      useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
    },
    "react-dom": { createPortal: (children) => children },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "iconoir-react": new Proxy({}, { get: (_, name) => String(name) }),
    "@tanstack/react-router": {
      Link: "Link",
      useNavigate: () => () => {
        throw Error("Unexpected navigation");
      },
      createFileRoute: () => (config) => config,
    },
    "@dnd-kit/core": { DndContext: "DndContext", useSensors: () => [], useSensor: () => ({}) },
    sonner: {
      toast: {
        success() {},
        error(error) {
          throw Error(error);
        },
      },
    },
    ...mocks,
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      {
        exports,
        require: (id) => {
          if (id in defaults) return defaults[id];
          if (id.startsWith("@/components/"))
            return new Proxy({}, { get: (_, name) => String(name) });
          if (id.startsWith("@/") || id.startsWith(".")) {
            const target = id.startsWith("@/")
              ? path.join(root, "src", id.slice(2))
              : path.resolve(path.dirname(file), id);
            return load(target + (fs.existsSync(target + ".ts") ? ".ts" : ".tsx"));
          }
          return require(id);
        },
      },
    );
    return exports;
  }
  return (file) => load(path.join(root, file));
}
const load = loader();
const { occurrencesForDate, completionProgressForDate } = load("src/domain/occurrences.ts");
const { DayPicker } = load("src/components/planning.tsx");
const { OccurrenceCard } = load("src/components/OccurrenceCard.tsx");
const plain = (value) => JSON.parse(JSON.stringify(value));
const types = ["ritual", "regular_action", "task", "time_slot", "preparation"];
const date = "2026-09-09";
function fixture() {
  return {
    goals: [{ id: "goal", status: "active" }],
    actions: types.map((type, i) => ({
      id: `a${i}`,
      goal_id: "goal",
      type,
      name: type,
      start_date: "2026-09-01",
    })),
    schedules: types.map((_, i) => ({
      id: `s${i}`,
      action_id: `a${i}`,
      repeat_type: "weekly",
      weekdays: [1, 3, 5],
      start_time: "07:00",
      status: "planned",
    })),
    completions: [],
    ritualItems: [
      { id: "i1", ritual_action_id: "a0" },
      { id: "i2", ritual_action_id: "a0" },
    ],
    ritualItemCompletions: [],
    actionLifeAreas: [],
    occurrenceOverrides: [],
  };
}
function nodes(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return [value, ...nodes(value.props?.children)];
}

test("calendar progress: no occurrences, zero, partial, full, skipped and ritual counted once", () => {
  const source = fixture();
  assert.deepEqual(plain(completionProgressForDate(source, "2026-08-31")), {
    planned: 0,
    completed: 0,
  });
  assert.deepEqual(plain(completionProgressForDate(source, date)), { planned: 5, completed: 0 });
  source.ritualItemCompletions = [
    { ritual_item_id: "i1", schedule_id: "s0", occurrence_date: date },
  ];
  assert.equal(completionProgressForDate(source, date).completed, 0);
  source.completions = types.map((_, i) => ({
    action_id: `a${i}`,
    schedule_id: `s${i}`,
    occurrence_date: date,
    status: i < 2 ? "completed" : "skipped",
  }));
  assert.deepEqual(plain(completionProgressForDate(source, date)), { planned: 5, completed: 2 });
  const snapshot = JSON.stringify(source);
  completionProgressForDate(source, date);
  assert.equal(JSON.stringify(source), snapshot, "visualization never mutates history");
  assert.deepEqual(plain(completionProgressForDate(source, "2026-09-11")), {
    planned: 5,
    completed: 0,
  });
  source.completions.forEach((c) => (c.status = "completed"));
  assert.deepEqual(plain(completionProgressForDate(source, date)), { planned: 5, completed: 5 });
  assert.deepEqual(plain(completionProgressForDate(plain(source), date)), {
    planned: 5,
    completed: 5,
  });
});

test("calendar derives moved occurrences and closed Goal history from common domain", () => {
  const source = fixture();
  source.occurrenceOverrides = [
    { schedule_id: "s0", original_date: date, target_date: "2026-09-10", start_time: "10:00" },
  ];
  source.completions = [
    { action_id: "a0", schedule_id: "s0", occurrence_date: date, status: "completed" },
  ];
  assert.deepEqual(plain(completionProgressForDate(source, date)), { planned: 4, completed: 0 });
  assert.deepEqual(plain(completionProgressForDate(source, "2026-09-10")), {
    planned: 1,
    completed: 1,
  });
  source.goals[0] = { id: "goal", status: "cancelled", closed_on: "2026-09-10" };
  assert.equal(completionProgressForDate(source, "2026-09-10").completed, 1);
  assert.equal(completionProgressForDate(source, "2026-09-11").planned, 0);
  assert.equal(completionProgressForDate(source, date).planned, 4);
});

test("monthly picker renders proportional rings, independent purple selection, and no ring for empty dates", () => {
  let selected;
  for (const completed of [0, 1, 2, 3]) {
    const tree = DayPicker({
      value: [date],
      multiple: false,
      onChange: (value) => (selected = value),
      getProgress: (day) => ({
        planned: day === date ? 3 : 0,
        completed: day === date ? completed : 0,
      }),
    });
    const rings = nodes(tree).filter((n) => n.type === "svg");
    assert.equal(rings.length, 1);
    const arc = nodes(rings[0]).find((n) => n.props?.strokeDasharray);
    if (completed) assert.equal(parseFloat(arc.props.strokeDasharray), (completed / 3) * 100);
    else assert.equal(arc, undefined);
    const button = nodes(tree).find((n) => n.type === "button" && n.props["aria-pressed"]);
    assert.ok(nodes(button).some((n) => n.props?.className?.includes("accent-control")));
    assert.ok(button.props["aria-label"].includes(`выполнено ${completed} из 3`));
    button.props.onClick();
    assert.deepEqual(plain(selected), [date]);
  }
  const plainPicker = DayPicker({ value: [date], onChange() {} });
  assert.equal(
    nodes(plainPicker).filter((n) => n.type === "svg").length,
    0,
    "editing date pickers unchanged",
  );
});

for (const type of types)
  test(`Today ${type}: checkbox is separate from link and persists current occurrence without navigation`, async () => {
    const source = fixture();
    const occurrence = occurrencesForDate(source, date, "active-plan").find(
      (o) => o.action.type === type,
    );
    const writes = [];
    const localLoad = loader({
      "@/data/completions": {
        markActionCompleted: async (value) => writes.push({ kind: "complete", ...value }),
        unmarkActionCompleted: async (value) => writes.push({ kind: "unmark", ...value }),
      },
      "@/hooks/useAppData": {
        usePlannerMutation: (fn) => ({ isPending: false, mutate: (value) => fn(value) }),
      },
    });
    const { DayPlan } = localLoad("src/components/DayPlan.tsx");
    for (const completed of [false, true]) {
      const plan = DayPlan({
        occurrences: [{ ...occurrence, completed }],
        emptyText: "",
        allowDrag: false,
        directRitualCompletion: true,
        maxTitleLines: 2,
      });
      assert.ok(!nodes(plan).some((n) => n.type === "DndContext"));
      const cardProps = nodes(plan).find((n) => n.type === "OccurrenceCard").props;
      assert.equal(cardProps.drag, undefined);
      const card = OccurrenceCard(cardProps);
      const buttons = nodes(card).filter((n) => n.type === "button");
      assert.equal(buttons.length, 1, "no drag handle");
      assert.equal(buttons[0].props["aria-pressed"], completed);
      assert.ok(
        buttons[0].props.className.includes("mr-2"),
        "completion control has right breathing room",
      );
      const completionCircle = nodes(card).find(
        (n) => n.type === "span" && n.props?.className?.includes("size-7"),
      );
      assert.ok(
        completionCircle,
        "completion indicator is visually compact while the tap target stays large",
      );
      const link = nodes(card).find((n) => n.type === "Link");
      assert.ok(!nodes(link).includes(buttons[0]), "button is not nested in navigation link");
      assert.equal(link.props.to, "/action/$actionId");
      assert.equal(link.props.search.date, date);
      let prevented = false,
        stopped = false;
      buttons[0].props.onClick({
        preventDefault: () => (prevented = true),
        stopPropagation: () => (stopped = true),
      });
      await new Promise((resolve) => setImmediate(resolve));
      assert.ok(prevented && stopped);
      assert.equal(writes.at(-1).kind, completed ? "unmark" : "complete");
      assert.equal(writes.at(-1).date, date);
      assert.equal(writes.at(-1).scheduleId, occurrence.schedule.id);
    }
    const calendarPlan = DayPlan({ occurrences: [occurrence], emptyText: "", allowDrag: false });
    assert.notEqual(calendarPlan.type, "DndContext", "Calendar cards do not support dragging");
  });

test("Today and Calendar disable card dragging while Calendar keeps progress", () => {
  const source = fixture();
  const localLoad = loader({
    "@/hooks/useAppData": { usePlannerSource: () => ({ source, isLoading: false }) },
  });
  const today = localLoad("src/routes/_authenticated/today.tsx").Route.component();
  const plan = nodes(today).find((n) => n.type === "DayPlan");
  assert.equal(plan.props.allowDrag, false);
  assert.equal(plan.props.directRitualCompletion, true);
  const calendar = localLoad("src/routes/_authenticated/calendar.tsx").Route.component();
  const calendarPlan = nodes(calendar).find((n) => n.type === "DayPlan");
  assert.equal(calendarPlan.props.allowDrag, false);
  const picker = nodes(calendar).find((n) => n.type === "DayPicker");
  assert.deepEqual(plain(picker.props.getProgress(date)), { planned: 5, completed: 0 });
});
