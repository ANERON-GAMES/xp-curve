import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGain,
  createCurve,
  experienceForLevel,
  levelForExperience,
  progressWithinLevel
} from "../src/index.js";
import { rejects } from "./helpers.js";
import {
  BASE_MESSAGE,
  BASE_TABLE_MESSAGE,
  CAP_MESSAGE,
  CURVE_MESSAGE,
  DEGREE_EXPONENTIAL_MESSAGE,
  DEGREE_LINEAR_MESSAGE,
  DEGREE_MESSAGE,
  DEGREE_TABLE_MESSAGE,
  EXPERIENCE_CAP_MESSAGE,
  EXPERIENCE_MESSAGE,
  FACTOR_LINEAR_MESSAGE,
  FACTOR_MESSAGE,
  FACTOR_POLYNOMIAL_MESSAGE,
  FACTOR_TABLE_MESSAGE,
  FORMULA_MESSAGE,
  GAIN_MESSAGE,
  LEVEL_MESSAGE,
  MODE_MESSAGE,
  OPTIONS_MESSAGE,
  TABLE_ENTRY_MESSAGE,
  TABLE_LENGTH_MESSAGE,
  TABLE_ORDER_MESSAGE,
  TABLE_START_MESSAGE,
  TABLE_TYPE_MESSAGE,
  TOTAL_MESSAGE,
  TOTALS_ENTRY_MESSAGE,
  TOTALS_LENGTH_MESSAGE,
  TOTALS_ORDER_MESSAGE,
  TOTALS_START_MESSAGE,
  TOTALS_TYPE_MESSAGE
} from "./messages.js";

const MAX = Number.MAX_SAFE_INTEGER;
const BAD_NUMBERS = [
  null,
  true,
  false,
  "1",
  1.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  MAX + 1
];

function linear(overrides = {}) {
  return {
    cap: 4,
    formula: "linear",
    base: 10,
    ...overrides
  };
}

function tableOptions(overrides = {}) {
  return {
    cap: 3,
    table: [0, 10, 30],
    ...overrides
  };
}

function sampleCurve() {
  return createCurve(linear());
}

test("createCurve requires an options object, then a cap, then one source", () => {
  rejects(() => createCurve(), "TypeError", OPTIONS_MESSAGE);
  rejects(() => createCurve(null), "TypeError", OPTIONS_MESSAGE);
  rejects(() => createCurve(undefined), "TypeError", OPTIONS_MESSAGE);
  rejects(() => createCurve([]), "TypeError", OPTIONS_MESSAGE);
  rejects(() => createCurve("linear"), "TypeError", OPTIONS_MESSAGE);
  rejects(() => createCurve(4), "TypeError", OPTIONS_MESSAGE);
  const hidden = {
    get formula() {
      throw new Error("formula");
    },
    get table() {
      throw new Error("table");
    }
  };
  rejects(() => createCurve(hidden), "RangeError", CAP_MESSAGE);
  rejects(() => createCurve({ formula: "linear", base: -1 }), "RangeError", CAP_MESSAGE);
  rejects(() => createCurve({ cap: 0, formula: "nope", table: [] }), "RangeError", CAP_MESSAGE);
  for (const cap of [...BAD_NUMBERS, 0, -1, -0, 10001]) {
    rejects(() => createCurve(linear({ cap })), "RangeError", CAP_MESSAGE);
  }
  rejects(() => createCurve({ cap: 4 }), "TypeError", MODE_MESSAGE);
  rejects(
    () => createCurve({ cap: 4, formula: undefined, table: undefined }),
    "TypeError",
    MODE_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 3, formula: "linear", base: 10, table: [0, 10, 30] }),
    "TypeError",
    MODE_MESSAGE
  );
  rejects(() => createCurve({ cap: 3, formula: "nope", table: [0, 1] }), "TypeError", MODE_MESSAGE);
  const inherited = Object.create({ cap: 4, formula: "linear", base: 10 });
  rejects(() => createCurve(inherited), "RangeError", CAP_MESSAGE);
  assert.equal(createCurve(linear({ cap: 4.0 })).cap, 4);
  assert.equal(createCurve(linear({ cap: 1, base: 5 })).cap, 1);
});

test("formula names and fields are checked in order", () => {
  for (const formula of [null, 1, "", "Linear", "table", "exponential "]) {
    rejects(() => createCurve(linear({ formula })), "TypeError", FORMULA_MESSAGE);
  }
  rejects(
    () => createCurve(linear({ degree: 2, factor: 3, base: -1 })),
    "TypeError",
    DEGREE_LINEAR_MESSAGE
  );
  rejects(() => createCurve(linear({ factor: 3, base: 0 })), "TypeError", FACTOR_LINEAR_MESSAGE);
  for (const base of [...BAD_NUMBERS, 0, -1, undefined]) {
    rejects(() => createCurve(linear({ base })), "RangeError", BASE_MESSAGE);
  }
  rejects(
    () => createCurve({ cap: 4, formula: "polynomial", factor: 2, base: -1, degree: 0 }),
    "TypeError",
    FACTOR_POLYNOMIAL_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 4, formula: "polynomial", base: 0, degree: 0 }),
    "RangeError",
    BASE_MESSAGE
  );
  for (const degree of [...BAD_NUMBERS, 0, -1, undefined]) {
    rejects(
      () => createCurve({ cap: 4, formula: "polynomial", base: 2, degree }),
      "RangeError",
      DEGREE_MESSAGE
    );
  }
  rejects(
    () => createCurve({ cap: 4, formula: "exponential", degree: 2, base: 0, factor: 1 }),
    "TypeError",
    DEGREE_EXPONENTIAL_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 4, formula: "exponential", base: 0, factor: 1 }),
    "RangeError",
    BASE_MESSAGE
  );
  for (const factor of [...BAD_NUMBERS, 0, 1, -1, undefined]) {
    rejects(
      () => createCurve({ cap: 4, formula: "exponential", base: 2, factor }),
      "RangeError",
      FACTOR_MESSAGE
    );
  }
  const inheritedBase = Object.create({ base: 8 });
  inheritedBase.cap = 3;
  inheritedBase.formula = "linear";
  rejects(() => createCurve(inheritedBase), "RangeError", BASE_MESSAGE);
  const optional = linear();
  optional.degree = undefined;
  optional.factor = undefined;
  optional.table = undefined;
  assert.equal(createCurve(optional).formula, "linear");
});

test("table curves reject formula fields, then validate every entry", () => {
  rejects(
    () => createCurve(tableOptions({ base: 1, degree: 1, factor: 2 })),
    "TypeError",
    BASE_TABLE_MESSAGE
  );
  rejects(
    () => createCurve(tableOptions({ degree: 1, factor: 2 })),
    "TypeError",
    DEGREE_TABLE_MESSAGE
  );
  rejects(() => createCurve(tableOptions({ factor: 2 })), "TypeError", FACTOR_TABLE_MESSAGE);
  for (const table of [null, {}, "0,10", 10, new Set([0, 10])]) {
    rejects(() => createCurve(tableOptions({ table })), "TypeError", TABLE_TYPE_MESSAGE);
  }
  rejects(() => createCurve(tableOptions({ table: [0, 10] })), "RangeError", TABLE_LENGTH_MESSAGE);
  rejects(
    () => createCurve(tableOptions({ cap: 1, table: [] })),
    "RangeError",
    TABLE_LENGTH_MESSAGE
  );
  const longer = [0, 10, 30, 40];
  let readPast = false;
  Object.defineProperty(longer, "4", {
    get() {
      readPast = true;
      return 50;
    }
  });
  rejects(() => createCurve({ cap: 3, table: longer }), "RangeError", TABLE_LENGTH_MESSAGE);
  assert.equal(readPast, false);
  for (const entry of [...BAD_NUMBERS, -1]) {
    rejects(
      () => createCurve(tableOptions({ table: [0, entry, 4] })),
      "RangeError",
      TABLE_ENTRY_MESSAGE
    );
  }
  rejects(
    () => createCurve(tableOptions({ table: [0, undefined, 4] })),
    "RangeError",
    TABLE_ENTRY_MESSAGE
  );
  const hole = [0, 10, 30];
  delete hole[1];
  rejects(() => createCurve(tableOptions({ table: hole })), "RangeError", TABLE_ENTRY_MESSAGE);
  const proto = Object.create(Array.prototype);
  proto[1] = 50;
  const inheritedEntry = [0, 10, 30];
  Object.setPrototypeOf(inheritedEntry, proto);
  delete inheritedEntry[1];
  rejects(
    () => createCurve(tableOptions({ table: inheritedEntry })),
    "RangeError",
    TABLE_ENTRY_MESSAGE
  );
  rejects(
    () => createCurve(tableOptions({ cap: 2, table: [-1, 2] })),
    "RangeError",
    TABLE_ENTRY_MESSAGE
  );
  rejects(
    () => createCurve(tableOptions({ cap: 2, table: [1, 2] })),
    "RangeError",
    TABLE_START_MESSAGE
  );
  rejects(
    () => createCurve(tableOptions({ cap: 2, table: [0, 0] })),
    "RangeError",
    TABLE_ORDER_MESSAGE
  );
  rejects(() => createCurve(tableOptions({ table: [0, 3, 2] })), "RangeError", TABLE_ORDER_MESSAGE);
  rejects(() => createCurve(tableOptions({ table: [0, 4, 4] })), "RangeError", TABLE_ORDER_MESSAGE);
  const untouched = [0, 4, 4];
  rejects(() => createCurve({ cap: 3, table: untouched }), "RangeError", TABLE_ORDER_MESSAGE);
  assert.deepEqual(untouched, [0, 4, 4]);
  const normalized = createCurve({ cap: 2, table: [-0, 1.0] });
  assert.equal(Object.is(normalized.totals[0], 0), true);
  assert.equal(normalized.totals[1], 1);
});

test("a formula total that leaves the safe integer range is refused", () => {
  const half = Math.floor(MAX / 2) + 1;
  rejects(() => createCurve({ cap: 3, formula: "linear", base: MAX }), "RangeError", TOTAL_MESSAGE);
  rejects(
    () => createCurve({ cap: 3, formula: "linear", base: half }),
    "RangeError",
    TOTAL_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 3, formula: "polynomial", base: MAX, degree: 1 }),
    "RangeError",
    TOTAL_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 3, formula: "polynomial", base: 1, degree: MAX }),
    "RangeError",
    TOTAL_MESSAGE
  );
  rejects(
    () => createCurve({ cap: 55, formula: "exponential", base: 1, factor: 2 }),
    "RangeError",
    TOTAL_MESSAGE
  );
  assert.equal(createCurve({ cap: 2, formula: "linear", base: MAX }).totals[1], MAX);
  assert.equal(createCurve({ cap: 2, formula: "polynomial", base: 5, degree: MAX }).totals[1], 5);
});

test("unknown fields are ignored and only own fields are read", () => {
  const options = linear({ note: "keep" });
  Object.defineProperty(options, "extra", {
    enumerable: true,
    get() {
      throw new Error("extra");
    }
  });
  const built = createCurve(options);
  assert.equal(built.base, 10);
  assert.equal(Object.hasOwn(built, "note"), false);
  assert.equal(options.note, "keep");
  assert.equal(Object.isFrozen(options), false);
});

test("lookups validate the curve before the query", () => {
  rejects(() => levelForExperience(), "TypeError", CURVE_MESSAGE);
  rejects(() => levelForExperience(null, -1), "TypeError", CURVE_MESSAGE);
  rejects(() => levelForExperience([], -1), "TypeError", CURVE_MESSAGE);
  rejects(() => experienceForLevel(null, 1), "TypeError", CURVE_MESSAGE);
  rejects(() => progressWithinLevel("curve", 0), "TypeError", CURVE_MESSAGE);
  const hiddenTotals = {
    get totals() {
      throw new Error("totals");
    }
  };
  rejects(() => levelForExperience(hiddenTotals, -1), "RangeError", CAP_MESSAGE);
  rejects(() => levelForExperience({ cap: 0, totals: [0] }, -1), "RangeError", CAP_MESSAGE);
  rejects(() => experienceForLevel({ cap: 1 }, 1), "TypeError", TOTALS_TYPE_MESSAGE);
  rejects(() => progressWithinLevel({ cap: 1, totals: null }, 0), "TypeError", TOTALS_TYPE_MESSAGE);
  rejects(() => levelForExperience({ cap: 1, totals: {} }, 0), "TypeError", TOTALS_TYPE_MESSAGE);
  rejects(
    () => levelForExperience({ cap: 1, totals: [0, 1] }, -1),
    "RangeError",
    TOTALS_LENGTH_MESSAGE
  );
  rejects(
    () => experienceForLevel({ cap: 2, totals: [0, 1.5] }, 1),
    "RangeError",
    TOTALS_ENTRY_MESSAGE
  );
  rejects(
    () => progressWithinLevel({ cap: 2, totals: [1, 2] }, 0),
    "RangeError",
    TOTALS_START_MESSAGE
  );
  rejects(
    () => levelForExperience({ cap: 3, totals: [0, 2, 2] }, 0),
    "RangeError",
    TOTALS_ORDER_MESSAGE
  );
  const inheritedTotals = Object.create({ totals: [0, 10] });
  inheritedTotals.cap = 2;
  rejects(() => levelForExperience(inheritedTotals, 0), "TypeError", TOTALS_TYPE_MESSAGE);
  const built = sampleCurve();
  for (const experience of [...BAD_NUMBERS, -1, undefined]) {
    rejects(() => levelForExperience(built, experience), "RangeError", EXPERIENCE_MESSAGE);
    rejects(() => progressWithinLevel(built, experience), "RangeError", EXPERIENCE_MESSAGE);
  }
  for (const level of [...BAD_NUMBERS, 0, -1, 5, undefined]) {
    rejects(() => experienceForLevel(built, level), "RangeError", LEVEL_MESSAGE);
  }
  assert.equal(levelForExperience(built, 0.0), 1);
  assert.equal(Object.is(progressWithinLevel(built, -0).experience, 0), true);
  assert.equal(experienceForLevel(built, 1.0), 0);
});

test("applyGain validates the curve, the options, then experience, then the cap, then the gain", () => {
  const built = sampleCurve();
  rejects(() => applyGain(null, { experience: -1, gain: -1 }), "TypeError", CURVE_MESSAGE);
  rejects(() => applyGain(built), "TypeError", OPTIONS_MESSAGE);
  rejects(() => applyGain(built, null), "TypeError", OPTIONS_MESSAGE);
  rejects(() => applyGain(built, []), "TypeError", OPTIONS_MESSAGE);
  rejects(() => applyGain(built, { gain: -1 }), "RangeError", EXPERIENCE_MESSAGE);
  for (const experience of [...BAD_NUMBERS, -1]) {
    rejects(() => applyGain(built, { experience, gain: -1 }), "RangeError", EXPERIENCE_MESSAGE);
  }
  rejects(
    () => applyGain(built, { experience: built.totals[built.cap - 1] + 1, gain: -1 }),
    "RangeError",
    EXPERIENCE_CAP_MESSAGE
  );
  for (const gain of [...BAD_NUMBERS, -1, undefined]) {
    rejects(() => applyGain(built, { experience: 0, gain }), "RangeError", GAIN_MESSAGE);
  }
  const inherited = Object.create({ experience: 0, gain: 1 });
  rejects(() => applyGain(built, inherited), "RangeError", EXPERIENCE_MESSAGE);
  const atCap = applyGain(built, { experience: built.totals[built.cap - 1], gain: 0 });
  assert.equal(atCap.experience, built.totals[built.cap - 1]);
  const normalized = applyGain(built, { experience: -0, gain: -0 });
  assert.equal(Object.is(normalized.previousExperience, 0), true);
  assert.equal(Object.is(normalized.experience, 0), true);
  assert.equal(Object.is(normalized.applied, 0), true);
  assert.equal(Object.is(normalized.overflow, 0), true);
});
