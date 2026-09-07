import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const lifeAreaIds = [
  "personal_growth",
  "body_health",
  "inner_state",
  "love",
  "family",
  "friends",
  "career",
  "money",
  "creativity",
  "learning",
  "meaning",
  "lifestyle",
];

test("all twelve Life Areas own one centralized, commercially-safe icon", () => {
  const icons = read("src/components/LifeAreaIcon.tsx");
  const phosphorPackage = JSON.parse(read("node_modules/@phosphor-icons/react/package.json"));

  assert.equal(phosphorPackage.license, "MIT");
  assert.match(icons, /Original LifeBalance life-area icon collection/);
  assert.match(icons, /Phosphor Icons Regular.*MIT licensed/s);
  assert.match(icons, /LIFE_AREA_ICON_CONFIG/);
  for (const id of lifeAreaIds) {
    assert.match(icons, new RegExp(`\\b${id}: \\{ Icon:`));
  }
  assert.match(icons, /size-11/);
  assert.match(icons, /rounded-\[14px\]/);
  assert.match(icons, /className="size-6"/);
});

test("both Life Area selectors reuse the framed shared icon component", () => {
  const newFlow = read("src/routes/_authenticated/new/index.tsx");
  const picker = read("src/components/planning.tsx");

  assert.match(newFlow, /import \{ LifeAreaIconFrame \} from "@\/components\/LifeAreaIcon"/);
  assert.match(newFlow, /<LifeAreaIconFrame area=\{a\} className="mt-0\.5" \/>/);
  assert.match(picker, /import \{ LifeAreaIconFrame \} from "@\/components\/LifeAreaIcon"/);
  assert.match(picker, /<LifeAreaIconFrame area=\{area\} className="mt-0\.5" \/>/);
});
