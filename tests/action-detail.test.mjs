import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

// Component contract tests: real route + occurrence domain, mocked hooks/UI primitives.
// No network, browser storage, or production records are touched.
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const types = ["ritual", "regular_action", "task", "time_slot", "preparation"];
function fixture(type) {
  return {
    goals: [
      { id: "g", status: "active", result_text: "Результат цели", why_important: "Смысл цели" },
    ],
    actions: [
      {
        id: "a",
        goal_id: "g",
        type,
        name: "Название действия",
        description: "Первая строка\nВторая строка",
        why_important: "Смысл действия",
        start_date: "2026-08-01",
        duration_seconds: 7200,
      },
    ],
    schedules: [
      {
        id: "s",
        action_id: "a",
        status: "planned",
        repeat_type: ["ritual", "regular_action"].includes(type) ? "weekly" : "once",
        weekdays: [1, 7],
        scheduled_date: "2026-09-06",
        start_time: "10:00",
        duration_seconds: 7200,
      },
    ],
    completions: [],
    ritualItems: [
      { id: "i", ritual_action_id: "a", sort_order: 0, name: "Пункт", description: "Подсказка" },
    ],
    ritualItemCompletions: [],
    actionLifeAreas: [{ action_id: "a", life_area_id: "health" }],
  };
}
function harness(source, search = { date: "2026-09-06", scheduleId: "s" }, attachments = []) {
  const node = (type, props) => ({ type, props });
  const cache = new Map();
  const mocks = {
    react: { useState: (value) => [value, () => {}] },
    "react/jsx-runtime": { jsx: node, jsxs: node, Fragment: "Fragment" },
    "@tanstack/react-router": {
      createFileRoute: () => (config) => ({
        ...config,
        useSearch: () => search,
        useParams: () => ({ actionId: "a" }),
      }),
      useNavigate: () => () => {},
    },
    "@tanstack/react-query": { useQuery: () => ({ data: attachments }) },
    "iconoir-react": new Proxy({}, { get: (_, key) => String(key) }),
    sonner: { toast: { success: () => {} } },
    "@/data/actions": {},
    "@/data/schedules": {},
    "@/data/completions": {
      markActionCompleted: async ({ scheduleId, date }) => {
        source.completions = [
          { action_id: "a", schedule_id: scheduleId, occurrence_date: date, status: "completed" },
        ];
      },
    },
    "@/hooks/useAppData": {
      usePlannerSource: () => ({ source, isLoading: false }),
      useLifeAreas: () => ({ data: [{ id: "health", name: "Здоровье" }] }),
      usePlannerMutation: (fn) => ({
        isPending: false,
        mutate: async (input, options) => {
          await fn(input);
          options?.onSuccess?.();
        },
      }),
    },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const customRequire = (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith("@/components/")) return new Proxy({}, { get: (_, key) => String(key) });
      if (id.startsWith("@/") || id.startsWith(".")) {
        const target = id.startsWith("@/")
          ? path.join(root, "src", id.slice(2))
          : path.resolve(path.dirname(file), id);
        return load(target + ".ts");
      }
      return require(id);
    };
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
      }).outputText,
      { exports, require: customRequire },
    );
    return exports;
  }
  const route = load(path.join(root, "src/routes/_authenticated/action/$actionId.tsx")).Route;
  return () => route.component();
}
function nodes(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return [value, ...nodes(value.props?.children)];
}
function text(value) {
  if (value == null || value === false) return "";
  if (Array.isArray(value)) return value.map(text).join(" ");
  if (typeof value === "object") return text(value.props?.children);
  return String(value);
}
function completeButton(tree) {
  return nodes(tree).find(
    (n) => n.type === "Button" && ["Выполнено", "✓ Выполнено"].includes(n.props["aria-label"]),
  );
}

for (const type of types) {
  test(`${type}: common order, own content, schedule and persistent occurrence completion`, async () => {
    const source = fixture(type);
    if (type === "time_slot")
      source.schedules.push({ ...source.schedules[0], id: "s2", scheduled_date: "2026-09-08" });
    const render = harness(source, undefined, [
      { id: "m", title: "Материал", url: "https://example.com" },
    ]);
    const tree = render();
    const titles = nodes(tree)
      .filter((n) => n.type === "Section")
      .map((n) => n.props.title);
    assert.deepEqual(titles, [
      "Описание",
      ...(type === "ritual" ? ["Ритуал"] : []),
      "Моя цель",
      "Почему это важно",
      "Материалы",
      "Расписание",
    ]);
    const treeNodes = nodes(tree);
    const controlsIndex = treeNodes.findIndex(
      (n) => n.props?.["aria-label"] === "Управление выполнением",
    );
    const descriptionIndex = treeNodes.findIndex(
      (n) => n.type === "Section" && n.props.title === "Описание",
    );
    assert.ok(controlsIndex > -1 && controlsIndex < descriptionIndex);
    assert.ok(text(tree).includes("Смысл действия"));
    for (const section of nodes(tree).filter((n) => n.type === "Section")) {
      const card = section.props.children;
      assert.ok(card.props.className.includes("content-surface"), section.props.title);
      assert.ok(card.props.className.includes("rounded-[24px]"), section.props.title);
      if (["Описание", "Моя цель", "Почему это важно"].includes(section.props.title)) {
        assert.equal(card.props.className, "content-surface rounded-[24px] px-4 py-3.5");
        assert.ok(card.props.children.props.className.includes("break-words"));
      }
    }
    assert.ok(!text(tree).includes("Смысл цели"));
    assert.ok(!text(tree).includes("1 августа"));
    assert.ok(
      nodes(tree).some(
        (n) =>
          n.type === "p" &&
          n.props.className?.includes("whitespace-pre-wrap") &&
          text(n).includes("\n"),
      ),
    );
    assert.ok(!nodes(tree).some((n) => n.type === "StickyActions"));
    if (["ritual", "regular_action"].includes(type)) {
      const weekdaySchedule = nodes(tree).find((n) => n.type === "WeekdaySchedule");
      assert.deepEqual(weekdaySchedule.props.value, [1, 7]);
    }
    if (type === "time_slot") {
      assert.ok(text(tree).includes("10:00–12:00"));
      assert.ok(text(tree).includes("8 сентября"));
    }
    assert.equal(completeButton(tree).props.variant, "primary");
    if (type === "ritual") {
      assert.equal(completeButton(tree).props.disabled, false);
    }
    await completeButton(tree).props.onClick();
    if (type === "ritual") assert.deepEqual(source.ritualItemCompletions, []);
    // Remount with a reloaded stored snapshot; no component-local completion flag.
    const reopened = harness(JSON.parse(JSON.stringify(source)))();
    assert.equal(completeButton(reopened).props.variant, "occurrenceCompleted");
    assert.equal(completeButton(reopened).props["aria-label"], "✓ Выполнено");
    const otherDate = harness(source, { date: "2026-09-07", scheduleId: "s" })();
    assert.notEqual(completeButton(otherDate)?.props.variant, "occurrenceCompleted");
  });
  test(`${type}: empty optional fields are omitted`, () => {
    const source = fixture(type);
    Object.assign(source.actions[0], { goal_id: null, description: " \n ", why_important: "\t" });
    source.ritualItems = [];
    const tree = harness(source, {}, [{ id: "blank", title: " ", url: " " }])();
    assert.deepEqual(
      nodes(tree)
        .filter((n) => n.type === "Section")
        .map((n) => n.props.title),
      ["Расписание"],
    );
    assert.equal(completeButton(tree), undefined);
  });
}
for (const context of [
  {},
  { date: "2026-09-06" },
  { scheduleId: "s" },
  { date: "2026-02-30", scheduleId: "s" },
  { date: "2026-09-06", scheduleId: "wrong" },
  { date: "2026-07-05", scheduleId: "s" },
]) {
  test(`no invented occurrence: ${JSON.stringify(context)}`, () => {
    const tree = harness(fixture("ritual"), context)();
    assert.equal(completeButton(tree), undefined);
    assert.ok(!nodes(tree).some((n) => n.props?.["aria-label"] === "Текущее выполнение"));
  });
}
test("cancelled schedule never falls back to another schedule", () => {
  const source = fixture("task");
  source.schedules.push({ ...source.schedules[0], id: "other" });
  source.schedules[0].status = "cancelled";
  assert.equal(completeButton(harness(source)()), undefined);
});
test("closed Goal preserves history display without active controls", () => {
  const source = fixture("task");
  Object.assign(source.goals[0], { status: "completed", closed_on: "2026-09-07" });
  source.completions = [{ schedule_id: "s", occurrence_date: "2026-09-06", status: "completed" }];
  const tree = harness(source)();
  assert.ok(text(tree).includes("Выполнено"));
  assert.equal(completeButton(tree), undefined);
});
test("approved completed color is one shared Button token", () => {
  const css = fs.readFileSync(path.join(root, "src/styles.css"), "utf8");
  const button = fs.readFileSync(path.join(root, "src/components/ui/button.tsx"), "utf8");
  assert.match(css, /--color-occurrence-completed:\s*#c8ea54/i);
  assert.match(button, /occurrenceCompleted:[\s\S]*?bg-occurrence-completed/);
});

test("moved once-only schedule displays and edits its effective date and time", () => {
  const source = fixture("task");
  source.occurrenceOverrides = [
    {
      schedule_id: "s",
      original_date: "2026-09-06",
      target_date: "2026-09-08",
      start_time: "12:30",
      duration_seconds: 900,
    },
  ];
  const search = { date: "2026-09-08", scheduleId: "s" };
  const tree = harness(source, search)();
  assert.ok(text(tree).includes("8 сентября"));
  assert.ok(!text(tree).includes("6 сентября"));
  assert.ok(text(tree).includes("12:30"));
  const form = nodes(harness(source, { ...search, edit: true })()).find(
    (n) => n.type === "ActionForm",
  );
  assert.equal(form.props.initial.schedules[0].scheduled_date, "2026-09-08");
  assert.equal(form.props.initial.schedules[0].start_time, "12:30");
});
