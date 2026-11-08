import assert from "node:assert/strict";
import test from "node:test";
import {
  createCurve,
  experienceForLevel,
  levelForExperience,
  progressWithinLevel
} from "../src/index.js";
import { assertProgress, scanLevel } from "./helpers.js";

function linear() {
  return createCurve({ cap: 10, formula: "linear", base: 100 });
}

function assertSameLevel(curve, total) {
  const level = levelForExperience(curve, total);
  assert.equal(level, scanLevel(curve.totals, total));
  const progress = progressWithinLevel(curve, total);
  assert.equal(progress.level, level);
  assert.equal(experienceForLevel(curve, level), curve.totals[level - 1]);
  assertProgress(progress, curve);
  return progress;
}

test("documented linear, polynomial, exponential, and table lookups", () => {
  const curve = linear();
  assert.equal(levelForExperience(curve, 0), 1);
  assert.equal(levelForExperience(curve, 100), 2);
  assert.equal(levelForExperience(curve, 250), 3);
  assert.equal(levelForExperience(curve, 899), 9);
  assert.equal(levelForExperience(curve, 900), 10);
  assert.equal(levelForExperience(curve, 5000), 10);
  assert.equal(experienceForLevel(curve, 1), 0);
  assert.equal(experienceForLevel(curve, 2), 100);
  assert.equal(experienceForLevel(curve, 4), 300);
  assert.equal(experienceForLevel(curve, 10), 900);

  const progress = progressWithinLevel(curve, 250);
  assert.equal(progress.level, 3);
  assert.equal(progress.experience, 250);
  assert.equal(progress.start, 200);
  assert.equal(progress.next, 300);
  assert.equal(progress.span, 100);
  assert.equal(progress.current, 50);
  assert.equal(progress.remaining, 50);
  assert.equal(progress.overflow, 0);
  assertProgress(progress, curve);

  const past = progressWithinLevel(curve, 950);
  assert.equal(past.level, 10);
  assert.equal(past.experience, 950);
  assert.equal(past.start, 900);
  assert.equal(past.next, null);
  assert.equal(past.span, 0);
  assert.equal(past.current, 0);
  assert.equal(past.remaining, 0);
  assert.equal(past.overflow, 50);

  const steep = createCurve({ cap: 5, formula: "polynomial", base: 10, degree: 2 });
  assert.equal(experienceForLevel(steep, 2), 10);
  assert.equal(experienceForLevel(steep, 5), 300);
  assert.equal(levelForExperience(steep, 50), 3);
  assert.equal(levelForExperience(steep, 49), 2);
  const inside = progressWithinLevel(steep, 80);
  assert.equal(inside.level, 3);
  assert.equal(inside.start, 50);
  assert.equal(inside.next, 140);
  assert.equal(inside.span, 90);
  assert.equal(inside.current, 30);
  assert.equal(inside.remaining, 60);
  assert.equal(inside.overflow, 0);

  const rising = createCurve({ cap: 6, formula: "exponential", base: 100, factor: 2 });
  assert.equal(experienceForLevel(rising, 2), 100);
  assert.equal(experienceForLevel(rising, 6), 3100);
  assert.equal(levelForExperience(rising, 700), 4);
  assert.equal(levelForExperience(rising, 699), 3);

  const custom = createCurve({ cap: 4, table: [0, 40, 90, 200] });
  assert.equal(experienceForLevel(custom, 4), 200);
  assert.equal(levelForExperience(custom, 90), 3);
  assert.equal(levelForExperience(custom, 89), 2);
  const paced = progressWithinLevel(custom, 100);
  assert.equal(paced.level, 3);
  assert.equal(paced.start, 90);
  assert.equal(paced.next, 200);
  assert.equal(paced.span, 110);
  assert.equal(paced.current, 10);
  assert.equal(paced.remaining, 100);
  assert.equal(paced.overflow, 0);
});

test("every total on a curve agrees with a linear scan", () => {
  const curves = [
    linear(),
    createCurve({ cap: 5, formula: "polynomial", base: 10, degree: 2 }),
    createCurve({ cap: 6, formula: "exponential", base: 100, factor: 2 }),
    createCurve({ cap: 4, table: [0, 40, 90, 200] }),
    createCurve({ cap: 1, formula: "linear", base: 25 }),
    createCurve({ cap: 8, formula: "polynomial", base: 3, degree: 3 })
  ];
  for (const curve of curves) {
    const capTotal = curve.totals[curve.cap - 1];
    const limit = capTotal + 5;
    for (let total = 0; total <= limit; total += 1) {
      assertSameLevel(curve, total);
    }
    const top = progressWithinLevel(curve, Number.MAX_SAFE_INTEGER);
    assert.equal(top.level, curve.cap);
    assert.equal(top.current, 0);
    assert.equal(top.overflow, Number.MAX_SAFE_INTEGER - capTotal);
    for (let level = 1; level <= curve.cap; level += 1) {
      const required = experienceForLevel(curve, level);
      assert.equal(required, curve.totals[level - 1]);
      assert.equal(levelForExperience(curve, required), level);
    }
  }
});

test("lookups read cap and totals, return distinct frozen results, and follow edits", () => {
  const curve = linear();
  const minimal = { cap: curve.cap, totals: curve.totals.slice() };
  assert.equal(levelForExperience(minimal, 250), 3);
  assert.deepEqual(progressWithinLevel(minimal, 250), progressWithinLevel(curve, 250));
  const restored = JSON.parse(JSON.stringify(curve));
  assert.deepEqual(progressWithinLevel(restored, 950), progressWithinLevel(curve, 950));
  const watched = {
    cap: curve.cap,
    totals: curve.totals.slice(),
    get formula() {
      throw new Error("formula");
    }
  };
  assert.equal(levelForExperience(watched, 0), 1);
  const first = progressWithinLevel(curve, 250);
  const second = progressWithinLevel(curve, 250);
  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  const mutable = { cap: 3, totals: [0, 10, 30] };
  assert.equal(experienceForLevel(mutable, 2), 10);
  mutable.totals[1] = 5;
  assert.equal(experienceForLevel(mutable, 2), 5);
  assert.equal(levelForExperience(mutable, 10), 2);
  const again = createCurve({ cap: 10, formula: "linear", base: 100 });
  assert.deepEqual(levelForExperience(again, 250), levelForExperience(curve, 250));
});
