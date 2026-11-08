import assert from "node:assert/strict";
import test from "node:test";
import { applyGain, createCurve, levelForExperience, progressWithinLevel } from "../src/index.js";
import { assertProgress } from "./helpers.js";

function expectGain(curve, experience, gain) {
  const options = { experience, gain };
  const result = applyGain(curve, options);
  const capTotal = curve.totals[curve.cap - 1];
  const room = capTotal - experience;
  const applied = gain > room ? room : gain;
  const overflow = gain - applied;
  const next = experience + applied;
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.previousExperience, experience);
  assert.equal(result.previousLevel, levelForExperience(curve, experience));
  assert.equal(result.experience, next);
  assert.equal(result.level, levelForExperience(curve, next));
  assert.equal(result.levelsGained, result.level - result.previousLevel);
  assert.equal(result.applied, applied);
  assert.equal(result.overflow, overflow);
  assert.equal(result.applied + result.overflow, gain);
  assert.equal(result.experience, result.previousExperience + result.applied);
  assert.equal(result.experience <= capTotal, true);
  assert.equal(result.levelsGained >= 0, true);
  const progress = progressWithinLevel(curve, result.experience);
  assertProgress(progress, curve);
  assert.equal(progress.overflow, 0);
  assert.equal(options.experience, experience);
  assert.equal(options.gain, gain);
  return result;
}

test("documented gains stay inside a level, cross levels, and overflow at the cap", () => {
  const curve = createCurve({ cap: 10, formula: "linear", base: 100 });
  const stayed = expectGain(curve, 250, 20);
  assert.equal(stayed.level, 3);
  assert.equal(stayed.previousLevel, 3);
  assert.equal(stayed.levelsGained, 0);
  assert.equal(stayed.applied, 20);
  assert.equal(stayed.overflow, 0);
  assert.equal(stayed.experience, 270);

  const advanced = expectGain(curve, 250, 50);
  assert.equal(advanced.level, 4);
  assert.equal(advanced.previousLevel, 3);
  assert.equal(advanced.levelsGained, 1);
  assert.equal(advanced.applied, 50);
  assert.equal(advanced.overflow, 0);
  assert.equal(advanced.experience, 300);

  const capped = expectGain(curve, 250, 800);
  assert.equal(capped.level, 10);
  assert.equal(capped.previousLevel, 3);
  assert.equal(capped.levelsGained, 7);
  assert.equal(capped.applied, 650);
  assert.equal(capped.overflow, 150);
  assert.equal(capped.experience, 900);
  assert.equal(capped.previousExperience, 250);

  const full = expectGain(curve, 900, 40);
  assert.equal(full.level, 10);
  assert.equal(full.previousLevel, 10);
  assert.equal(full.levelsGained, 0);
  assert.equal(full.applied, 0);
  assert.equal(full.overflow, 40);
  assert.equal(full.experience, 900);

  const exact = expectGain(curve, 250, 650);
  assert.equal(exact.experience, 900);
  assert.equal(exact.overflow, 0);
  assert.equal(exact.applied, 650);
  assert.equal(exact.level, 10);

  const opened = expectGain(curve, 0, 0);
  assert.equal(opened.level, 1);
  assert.equal(opened.levelsGained, 0);
  assert.equal(opened.experience, 0);
});

test("gains agree with the cap room across formulas, tables, and the safe integer edge", () => {
  const curves = [
    createCurve({ cap: 10, formula: "linear", base: 100 }),
    createCurve({ cap: 5, formula: "polynomial", base: 10, degree: 2 }),
    createCurve({ cap: 6, formula: "exponential", base: 100, factor: 2 }),
    createCurve({ cap: 4, table: [0, 40, 90, 200] }),
    createCurve({ cap: 1, formula: "linear", base: 80 }),
    createCurve({ cap: 2, formula: "linear", base: Number.MAX_SAFE_INTEGER })
  ];
  const gains = [0, 1, 2, 7, 50, 100, 650, 800, 5000, Number.MAX_SAFE_INTEGER];
  for (const curve of curves) {
    const capTotal = curve.totals[curve.cap - 1];
    const samples = [0, 1, capTotal];
    if (capTotal > 2) {
      samples.push(Math.floor(capTotal / 2));
      samples.push(capTotal - 1);
    }
    for (const experience of samples) {
      if (experience > capTotal) {
        continue;
      }
      for (const gain of gains) {
        const result = expectGain(curve, experience, gain);
        assert.equal(result.experience >= experience, true);
      }
    }
  }
  const small = curves[0];
  const totals = small.totals.slice();
  expectGain(small, 0, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(small.totals, totals);
  const again = applyGain(small, { experience: 250, gain: 800 });
  const repeated = applyGain(small, { experience: 250, gain: 800 });
  assert.notEqual(again, repeated);
  assert.deepEqual(again, repeated);
});

test("a single-level cap stores nothing and a tall linear curve still clamps", () => {
  const only = createCurve({ cap: 1, table: [0] });
  const wasted = expectGain(only, 0, 50);
  assert.equal(wasted.level, 1);
  assert.equal(wasted.levelsGained, 0);
  assert.equal(wasted.applied, 0);
  assert.equal(wasted.overflow, 50);
  assert.equal(wasted.experience, 0);

  const tall = createCurve({ cap: 10000, formula: "linear", base: 1 });
  const step = expectGain(tall, 9998, 5);
  assert.equal(step.previousLevel, 9999);
  assert.equal(step.level, 10000);
  assert.equal(step.levelsGained, 1);
  assert.equal(step.applied, 1);
  assert.equal(step.overflow, 4);
  assert.equal(step.experience, 9999);
  const parked = expectGain(tall, 9999, 1);
  assert.equal(parked.levelsGained, 0);
  assert.equal(parked.applied, 0);
  assert.equal(parked.overflow, 1);
});
