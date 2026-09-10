import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
function harness(file, overrides = {}) {
  const state = [];
  let cursor = 0;
  const exports = {};
  const mocks = {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
        return [
          state[i],
          (value) => {
            state[i] = typeof value === "function" ? value(state[i]) : value;
          },
        ];
      },
      useRef(value) {
        const i = cursor++;
        return (state[i] ??= { current: value });
      },
    },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    ...overrides,
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    { exports, require: (id) => mocks[id] ?? new Proxy({}, { get: (_, name) => String(name) }) },
  );
  return (props) => {
    cursor = 0;
    return (exports.ArchivedGoalSwipe ?? exports.Route.component)(props);
  };
}
function nodes(value) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return [value, ...nodes(value.props?.children)];
}
const find = (tree, type) => nodes(tree).find((n) => n.type === type);
const findByText = (tree, type, text) =>
  nodes(tree).find((n) => n.type === type && n.props?.children === text);
const activeDialog = (tree) =>
  nodes(tree).find((n) => n.type === "AlertDialog" && n.props?.open === true);
function swipeHarness() {
  let confirmations = 0;
  const render = harness("src/components/ArchivedGoalSwipe.tsx");
  const tree = () =>
    render({ name: "Архивная цель", children: "Карточка", onRequestDelete: () => confirmations++ });
  const card = () => find(tree(), "div").props.children[1];
  const target = {
    clientWidth: 320,
    setPointerCapture() {},
    hasPointerCapture: () => true,
    releasePointerCapture() {},
  };
  const pointer = (x, y = 50) => ({
    currentTarget: target,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  return { tree, card, pointer, count: () => confirmations };
}

test("short swipe reveals trash; tapping only requests confirmation", () => {
  const h = swipeHarness();
  h.card().props.onPointerDown(h.pointer(300));
  h.card().props.onPointerMove(h.pointer(220));
  h.card().props.onPointerUp(h.pointer(220));
  assert.equal(h.card().props.style.transform, "translateX(-96px)");
  assert.equal(h.count(), 0);
  find(h.tree(), "button").props.onClick();
  assert.equal(h.count(), 1);
  assert.equal(h.card().props.style.transform, "translateX(-0px)");
});

test("full left swipe requests confirmation and suppresses accidental navigation", () => {
  const h = swipeHarness();
  h.card().props.onPointerDown(h.pointer(300));
  h.card().props.onPointerMove(h.pointer(30));
  h.card().props.onPointerUp(h.pointer(30));
  assert.equal(h.count(), 1);
  let prevented = false,
    stopped = false;
  h.card().props.onClickCapture({
    preventDefault: () => (prevented = true),
    stopPropagation: () => (stopped = true),
  });
  assert.ok(prevented && stopped);
});

test("vertical scrolling, cancelled gesture and right swipe cannot request deletion", () => {
  const h = swipeHarness();
  h.card().props.onPointerDown(h.pointer(300));
  h.card().props.onPointerMove(h.pointer(290, 90));
  h.card().props.onPointerUp(h.pointer(290, 90));
  h.card().props.onPointerDown(h.pointer(300));
  h.card().props.onPointerMove(h.pointer(30));
  h.card().props.onPointerCancel(h.pointer(30));
  h.card().props.onPointerDown(h.pointer(30));
  h.card().props.onPointerMove(h.pointer(300));
  h.card().props.onPointerUp(h.pointer(300));
  assert.equal(h.count(), 0);
  assert.equal(h.card().props.style.transform, "translateX(-0px)");
});

test("keyboard can reveal/close and request confirmation, never through child controls", () => {
  const h = swipeHarness(),
    target = {};
  const key = (key) => ({ key, target, currentTarget: target, preventDefault() {} });
  h.card().props.onKeyDown(key("ArrowLeft"));
  assert.equal(h.card().props.style.transform, "translateX(-96px)");
  h.card().props.onKeyDown(key("Escape"));
  assert.equal(h.card().props.style.transform, "translateX(-0px)");
  h.card().props.onKeyDown({ ...key("Delete"), target: {} });
  assert.equal(h.count(), 0);
  h.card().props.onKeyDown(key("Delete"));
  assert.equal(h.count(), 1);
});

function goalHarness() {
  let calls = 0,
    failure = false,
    statusUpdate = null;
  const render = harness("src/routes/_authenticated/goals.tsx", {
    "@tanstack/react-router": {
      createFileRoute: () => (config) => ({ ...config, useSearch: () => ({}) }),
      useNavigate: () => () => {},
    },
    "@/data/goals": {
      deleteArchivedGoal: async () => {
        calls++;
        if (failure) throw new Error("Нет соединения");
      },
      setGoalStatus: async (goalId, status, closedOn) => {
        statusUpdate = { goalId, status, closedOn };
      },
    },
    "@/domain/schedule": { todayKey: () => "2026-09-07" },
    "@/hooks/useAppData": {
      useGoals: () => ({
        data: [
          { id: "active", life_area_id: "health", status: "active", result_text: "Активная" },
          { id: "archived", life_area_id: "health", status: "cancelled", result_text: "Архивная" },
        ],
      }),
      useLifeAreas: () => ({ data: [{ id: "health", name: "Тело и здоровье" }] }),
      usePlannerSource: () => ({
        source: {
          actions: [
            {
              id: "active-action",
              goal_id: "active",
              name: "Действие активной цели",
              type: "task",
              archived_at: null,
            },
          ],
        },
      }),
      usePlannerMutation: (fn) => ({
        isPending: false,
        mutate: async (input, options) => {
          try {
            await fn(input);
          } catch (error) {
            options?.onError?.(error);
          }
        },
      }),
    },
  });
  return {
    render,
    calls: () => calls,
    fail: () => (failure = true),
    statusUpdate: () => statusUpdate,
  };
}

test("only Archive offers delete; cancel is inert; confirm hides card after server acknowledgement", async () => {
  const h = goalHarness();
  assert.equal(find(h.render(), "ArchivedGoalSwipe"), undefined);
  h.render().props.right.props.onClick();
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  assert.equal(activeDialog(h.render()).props.open, true);
  assert.equal(h.calls(), 0);
  activeDialog(h.render()).props.onOpenChange(false);
  assert.equal(activeDialog(h.render()), undefined);
  assert.ok(find(h.render(), "ArchivedGoalSwipe"));
  assert.equal(h.calls(), 0);
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  findByText(activeDialog(h.render()), "AlertDialogAction", "Удалить").props.onClick({
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.calls(), 1);
  assert.equal(find(h.render(), "ArchivedGoalSwipe"), undefined);
  assert.equal(activeDialog(h.render()), undefined);
});

test("failed deletion preserves archived card and confirmation with error", async () => {
  const h = goalHarness();
  h.fail();
  h.render().props.right.props.onClick();
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  findByText(activeDialog(h.render()), "AlertDialogAction", "Удалить").props.onClick({
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(find(h.render(), "ArchivedGoalSwipe"));
  assert.equal(activeDialog(h.render()).props.open, true);
  assert.equal(
    nodes(h.render()).find((n) => n.props?.role === "alert").props.children,
    "Нет соединения",
  );
});

test("active Goal uses the menu and confirmation before the existing archive lifecycle", async () => {
  const h = goalHarness();
  assert.equal(h.render().props.title, "Мои цели");
  assert.equal(h.render().props.subtitle, "То, к чему ты сейчас идёшь");
  assert.equal(findByText(h.render(), "p", "Цель").props.children, "Цель");
  assert.ok(
    nodes(h.render()).some(
      (node) =>
        node.type === "Button" &&
        Array.isArray(node.props?.children) &&
        node.props.children.includes("Добавить действие"),
    ),
  );
  assert.equal(
    findByText(h.render(), "DropdownMenuItem", "Цель достигнута").props.children,
    "Цель достигнута",
  );
  assert.equal(findByText(h.render(), "DropdownMenuItem", "Результат достигнут"), undefined);
  assert.equal(findByText(h.render(), "DropdownMenuItem", "Отменено"), undefined);
  findByText(h.render(), "DropdownMenuItem", "Цель достигнута").props.onSelect();
  assert.equal(
    findByText(activeDialog(h.render()), "AlertDialogTitle", "Цель достигнута!").props.children,
    "Цель достигнута!",
  );
  assert.equal(
    findByText(activeDialog(h.render()), "AlertDialogAction", "В архив").props.children,
    "В архив",
  );
  findByText(activeDialog(h.render()), "AlertDialogAction", "В архив").props.onClick({
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.statusUpdate(), {
    goalId: "active",
    status: "completed",
    closedOn: "2026-09-07",
  });
});

test("cancelling an active Goal requires its own confirmation", async () => {
  const h = goalHarness();
  findByText(h.render(), "DropdownMenuItem", "Отменить").props.onSelect();
  const dialog = activeDialog(h.render());
  assert.equal(
    findByText(dialog, "AlertDialogTitle", "Отменить цель?").props.children,
    "Отменить цель?",
  );
  assert.equal(
    findByText(dialog, "AlertDialogAction", "Отменить цель").props.children,
    "Отменить цель",
  );
  findByText(dialog, "AlertDialogAction", "Отменить цель").props.onClick({
    preventDefault() {},
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.statusUpdate(), {
    goalId: "active",
    status: "cancelled",
    closedOn: "2026-09-07",
  });
});

test("returning from a Goal lifecycle dialog changes nothing", () => {
  const h = goalHarness();
  findByText(h.render(), "DropdownMenuItem", "Отменить").props.onSelect();
  const dialog = activeDialog(h.render());
  findByText(dialog, "AlertDialogCancel", "Вернуться").props.onClick?.();
  dialog.props.onOpenChange(false);
  assert.equal(activeDialog(h.render()), undefined);
  assert.equal(h.statusUpdate(), null);
});
