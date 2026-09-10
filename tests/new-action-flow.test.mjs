import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("the New Action goal step keeps a draft and does not persist it", () => {
  const flow = read("src/routes/_authenticated/new/index.tsx");
  assert.doesNotMatch(flow, /createGoal|updateGoal|usePlannerMutation/);
  assert.match(flow, /onClick=\{\(\) => setStep\("format"\)\}/);
  assert.match(flow, /state: \{ newActionGoalDraft: goalDraft \}/);
});

test("the Action screen converts the history-state draft into one createAction mutation", () => {
  const actionScreen = read("src/routes/_authenticated/new/$type.tsx");
  assert.match(actionScreen, /readNewActionFlowLocationState/);
  assert.match(actionScreen, /newGoal:/);
  assert.match(actionScreen, /values\.goalId === newGoalDraft\?\.id/);
});
