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
    failure = false;
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
    },
    "@/hooks/useAppData": {
      useGoals: () => ({
        data: [
          { id: "active", life_area_id: "health", status: "active", result_text: "Активная" },
          { id: "archived", life_area_id: "health", status: "cancelled", result_text: "Архивная" },
        ],
      }),
      useLifeAreas: () => ({ data: [{ id: "health", name: "Тело и здоровье" }] }),
      usePlannerSource: () => ({ source: { actions: [] } }),
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
  return { render, calls: () => calls, fail: () => (failure = true) };
}

test("only Archive offers delete; cancel is inert; confirm hides card after server acknowledgement", async () => {
  const h = goalHarness();
  assert.equal(find(h.render(), "ArchivedGoalSwipe"), undefined);
  h.render().props.right.props.onClick();
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  assert.equal(find(h.render(), "AlertDialog").props.open, true);
  assert.equal(h.calls(), 0);
  find(h.render(), "AlertDialog").props.onOpenChange(false);
  assert.equal(find(h.render(), "AlertDialog").props.open, false);
  assert.ok(find(h.render(), "ArchivedGoalSwipe"));
  assert.equal(h.calls(), 0);
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  find(h.render(), "AlertDialogAction").props.onClick({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(h.calls(), 1);
  assert.equal(find(h.render(), "ArchivedGoalSwipe"), undefined);
  assert.equal(find(h.render(), "AlertDialog").props.open, false);
});

test("failed deletion preserves archived card and confirmation with error", async () => {
  const h = goalHarness();
  h.fail();
  h.render().props.right.props.onClick();
  find(h.render(), "ArchivedGoalSwipe").props.onRequestDelete();
  find(h.render(), "AlertDialogAction").props.onClick({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(find(h.render(), "ArchivedGoalSwipe"));
  assert.equal(find(h.render(), "AlertDialog").props.open, true);
  assert.equal(
    nodes(h.render()).find((n) => n.props?.role === "alert").props.children,
    "Нет соединения",
  );
});
