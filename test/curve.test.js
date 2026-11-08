import assert from "node:assert/strict";
import test from "node:test";
import { MAX_CAP, createCurve, experienceForLevel } from "../src/index.js";
import { rejects } from "./helpers.js";
import { TOTAL_MESSAGE } from "./messages.js";
import { totalsFor } from "./oracle.js";

const MAX = Number.MAX_SAFE_INTEGER;

function optionsFor(formula, base, degree, factor, cap) {
  const options = { cap, formula, base };
  if (formula === "polynomial") {
    options.degree = degree;
  }
  if (formula === "exponential") {
    options.factor = factor;
  }
  return options;
}

function assertBuilt(formula, base, degree, factor, cap) {
  const expected = totalsFor(formula, base, degree, factor, cap);
  const options = optionsFor(formula, base, degree, factor, cap);
  if (!expected.fits) {
    rejects(() => createCurve(options), "RangeError", TOTAL_MESSAGE);
    return;
  }
  const curve = createCurve(options);
  const numbers = [];
  for (const value of expected.totals) {
    numbers.push(Number(value));
  }
  assert.equal(Object.isFrozen(curve), true);
  assert.equal(Object.isFrozen(curve.totals), true);
  assert.deepEqual(Object.keys(curve), ["cap", "formula", "base", "degree", "factor", "totals"]);
  assert.equal(curve.formula, formula);
  assert.equal(curve.base, base);
  assert.equal(curve.degree, formula === "polynomial" ? degree : null);
  assert.equal(curve.factor, formula === "exponential" ? factor : null);
  assert.deepEqual(curve.totals, numbers);
  assert.equal(curve.totals[0], 0);
  assert.equal(experienceForLevel(curve, 1), 0);
  if (cap >= 2) {
    assert.equal(experienceForLevel(curve, 2), base);
  }
  assert.throws(() => {
    curve.totals[0] = 1;
  }, TypeError);
  assert.throws(() => {
    curve.cap = 1;
  }, TypeError);
}

test("formula totals match the integer sums and the closed forms", () => {
  const half = Math.floor(MAX / 2) + 1;
  const specs = [
    ["linear", 1, null, null, 1],
    ["linear", 1, null, null, 2],
    ["linear", 100, null, null, 10],
    ["linear", 7, null, null, 30],
    ["linear", 1, null, null, MAX_CAP],
    ["linear", MAX, null, null, 2],
    ["linear", half, null, null, 2],
    ["linear", MAX, null, null, 3],
    ["linear", half, null, null, 3],
    ["polynomial", 10, 1, null, 5],
    ["polynomial", 10, 2, null, 5],
    ["polynomial", 10, 3, null, 5],
    ["polynomial", 3, 4, null, 9],
    ["polynomial", 1, 1, null, 40],
    ["polynomial", 5, MAX, null, 2],
    ["polynomial", MAX, 1, null, 3],
    ["exponential", 100, null, 2, 6],
    ["exponential", 1, null, 2, 54],
    ["exponential", 1, null, 2, 55],
    ["exponential", 1, null, 3, 34],
    ["exponential", 9, null, 5, 10],
    ["exponential", MAX, null, 2, 2],
    ["exponential", MAX, null, 2, 3]
  ];
  for (const spec of specs) {
    assertBuilt(spec[0], spec[1], spec[2], spec[3], spec[4]);
  }
  const power = createCurve({ cap: 54, formula: "exponential", base: 1, factor: 2 });
  assert.equal(power.totals[53], MAX);
  const steep = createCurve({ cap: 5, formula: "polynomial", base: 10, degree: 2 });
  assert.deepEqual(steep.totals, [0, 10, 50, 140, 300]);
  const rising = createCurve({ cap: 6, formula: "exponential", base: 100, factor: 2 });
  assert.deepEqual(rising.totals, [0, 100, 300, 700, 1500, 3100]);
});

test("a table is copied, frozen, and independent of the input array", () => {
  const table = [0, 40, 90, 200];
  const first = createCurve({ cap: 4, table });
  const second = createCurve({ cap: 4, table: [0, 40, 90, 200] });
  assert.equal(first.formula, null);
  assert.equal(first.base, null);
  assert.equal(first.degree, null);
  assert.equal(first.factor, null);
  assert.notEqual(first, second);
  assert.notEqual(first.totals, second.totals);
  assert.notEqual(first.totals, table);
  assert.deepEqual(first, second);
  table[1] = 1;
  table.push(400);
  assert.deepEqual(first.totals, [0, 40, 90, 200]);
  const capOnly = createCurve({ cap: 1, formula: "linear", base: 40 });
  assert.deepEqual(capOnly.totals, [0]);
  assert.equal(capOnly.base, 40);
});

test("the same definition builds equal curves and ignores later edits to the options", () => {
  const options = { cap: 4, formula: "linear", base: 25, note: "keep" };
  const curve = createCurve(options);
  options.base = 1;
  options.cap = 2;
  assert.equal(curve.base, 25);
  assert.equal(curve.cap, 4);
  assert.deepEqual(curve.totals, [0, 25, 50, 75]);
  assert.equal(options.note, "keep");
});
