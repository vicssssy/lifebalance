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

test("all twelve Life Areas own one centralized Phosphor icon composition", () => {
  const icons = read("src/components/LifeAreaIcon.tsx");
  const phosphorPackage = JSON.parse(read("node_modules/@phosphor-icons/react/package.json"));

  assert.equal(phosphorPackage.license, "MIT");
  assert.match(icons, /from "@phosphor-icons\/react"/);
  assert.match(icons, /Phosphor-only icon ownership/);
  assert.match(icons, /LIFE_AREA_ICON_CONFIG/);
  for (const id of lifeAreaIds) {
    assert.match(icons, new RegExp(`\\b${id}:\\s*\\{[\\s\\S]*?Icon:`));
  }
  assert.match(icons, /phosphorIcons/);
  assert.doesNotMatch(icons, /IconStack|Tabler|Lucide|<svg|<path/);
  assert.match(icons, /weight="regular"/);
  assert.match(icons, /size-11/);
  assert.match(icons, /rounded-\[14px\]/);
  assert.match(icons, /className="size-6"/);
});

test("every Life Area surface reuses the framed shared icon component", () => {
  const newFlow = read("src/routes/_authenticated/new/index.tsx");
  const picker = read("src/components/planning.tsx");
  const goals = read("src/routes/_authenticated/goals.tsx");

  assert.match(newFlow, /import \{ LifeAreaIconFrame \} from "@\/components\/LifeAreaIcon"/);
  assert.match(newFlow, /<LifeAreaIconFrame area=\{a\} className="mt-0\.5" \/>/);
  assert.match(picker, /import \{ LifeAreaIconFrame \} from "@\/components\/LifeAreaIcon"/);
  assert.match(picker, /<LifeAreaIconFrame area=\{area\} className="mt-0\.5" \/>/);
  assert.match(goals, /import \{ LifeAreaIconFrame \} from "@\/components\/LifeAreaIcon"/);
  assert.match(goals, /<LifeAreaIconFrame area=\{area\} className="size-10 rounded-\[16px\]" \/>/);
});

test("the browser favicon is a Phosphor asset and no stale IconStack reference remains", () => {
  const rootRoute = read("src/routes/__root.tsx");
  const iconBarrel = read("src/components/ui/icons.ts");
  const favicon = read("public/favicon.svg");

  assert.match(rootRoute, /href: "\/favicon\.svg", type: "image\/svg\+xml"/);
  assert.match(favicon, /Phosphor Icons CompassRose/);
  assert.doesNotMatch(iconBarrel, /Iconstack/i);
  assert.equal(fs.existsSync(path.join(root, "public/favicon.ico")), false);
});
