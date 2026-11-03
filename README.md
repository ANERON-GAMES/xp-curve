# @aneron/xp-curve

Experience-to-level progression curves with a level cap.

## Purpose

`@aneron/xp-curve` turns a total experience value into a level, and a level into the experience required to reach it. A curve is either a named formula or an explicit table of totals, plus a level cap. The same numbers produce the same result.

The formulas are linear, polynomial, and exponential. Each one defines the experience required to leave a level. The curve stores the running total, so a lookup is a search on that table. A caller who already has per-level totals can pass them directly.

The module does not read a clock, start a timer, draw a random number, or open a socket. It has no runtime dependencies. Every accepted number is a safe integer, and every returned number is a safe integer. A curve that would leave that range is refused when it is built.

## Install

The package is an ES module. It needs Node.js 20 or newer. It has no runtime dependencies. The package name is `@aneron/xp-curve`. It is not published to the npm registry.

Clone this repository and run the tests:

```bash
git clone https://github.com/ANERON-GAMES/xp-curve.git
cd xp-curve
npm install
npm test
```

`npm test` runs `node --test`. `npm run lint` runs ESLint. `npm run format:check` runs Prettier.

Install it as a dependency from the git repository:

```bash
npm install github:ANERON-GAMES/xp-curve
```

```js
import {
  MAX_CAP,
  applyGain,
  createCurve,
  experienceForLevel,
  levelForExperience,
  progressWithinLevel
} from "@aneron/xp-curve";
```

Code in this repository imports the same entry point with `./src/index.js`.

## Usage

Level 1 is the start. It requires `0` total experience. The cap is the highest level. On a linear curve the cost to leave every level is `base`. With `base` of `100` and a cap of `10`, the totals are `0`, `100`, `200`, and so on up to `900`.

```js
import {
  applyGain,
  createCurve,
  experienceForLevel,
  levelForExperience,
  progressWithinLevel
} from "@aneron/xp-curve";

const curve = createCurve({ cap: 10, formula: "linear", base: 100 });
```

`levelForExperience(curve, 0)` is `1`. `levelForExperience(curve, 250)` is `3`. `levelForExperience(curve, 899)` is `9`. `levelForExperience(curve, 900)` is `10`. `levelForExperience(curve, 5000)` is `10`. A total at or above the cap total stays on the cap.

`experienceForLevel(curve, 1)` is `0`. `experienceForLevel(curve, 2)` is `100`. `experienceForLevel(curve, 4)` is `300`. `experienceForLevel(curve, 10)` is `900`.

`progressWithinLevel` reports the position inside the current level. At `250` the level starts at `200` and the next level starts at `300`.

```js
const progress = progressWithinLevel(curve, 250);
const past = progressWithinLevel(curve, 950);
```

`progress.level` is `3`. `progress.experience` is `250`. `progress.start` is `200`. `progress.next` is `300`. `progress.span` is `100`. `progress.current` is `50`. `progress.remaining` is `50`. `progress.overflow` is `0`.

`past.level` is `10`. `past.current` is `0`. `past.overflow` is `50`. The cap level has no span. Experience past `900` is overflow, and `current` stays `0`.

`applyGain` adds a gain to a stored total. The stored total is clamped to the cap. The part of this gain that does not fit is `overflow`.

```js
const stayed = applyGain(curve, { experience: 250, gain: 20 });
const advanced = applyGain(curve, { experience: 250, gain: 50 });
const capped = applyGain(curve, { experience: 250, gain: 800 });
const full = applyGain(curve, { experience: 900, gain: 40 });
```

`stayed.levelsGained` is `0`. `stayed.experience` is `270`. The gain stays inside level 3.

`advanced.level` is `4`. `advanced.levelsGained` is `1`. `advanced.applied` is `50`. `advanced.overflow` is `0`. `advanced.experience` is `300`. The gain lands on the next threshold.

`capped.level` is `10`. `capped.previousLevel` is `3`. `capped.levelsGained` is `7`. `capped.applied` is `650`. `capped.overflow` is `150`. `capped.experience` is `900`. The room from `250` to the cap is `650`, so `150` of the `800` does not fit.

`full.applied` is `0`. `full.overflow` is `40`. `full.levelsGained` is `0`. A stored total that is already on the cap keeps that total, and the whole gain overflows.

A polynomial curve charges `base * level ^ degree` to leave `level`. A degree of `2` and a base of `10` leaves level 1 for `10`, level 2 for `40`, level 3 for `90`, and level 4 for `160`.

```js
const steep = createCurve({ cap: 5, formula: "polynomial", base: 10, degree: 2 });
```

`experienceForLevel(steep, 5)` is `300`.

An exponential curve charges `base * factor ^ (level - 1)` to leave `level`. With a base of `100` and a factor of `2`, the steps are `100`, `200`, `400`, `800`, and `1600`.

```js
const rising = createCurve({ cap: 6, formula: "exponential", base: 100, factor: 2 });
```

`experienceForLevel(rising, 6)` is `3100`. `levelForExperience(rising, 700)` is `4`. `levelForExperience(rising, 699)` is `3`.

A table lists the total required to reach each level, from level 1 through the cap. The first entry is `0`. Each later entry is greater than the one before it.

```js
const custom = createCurve({ cap: 4, table: [0, 40, 90, 200] });
const paced = progressWithinLevel(custom, 100);
```

`experienceForLevel(custom, 4)` is `200`. `levelForExperience(custom, 90)` is `3`. `paced.current` is `10`. `paced.remaining` is `100`. `paced.overflow` is `0`.

## API

All functions are pure. They do not read the clock, the network, or the filesystem. They do not mutate their arguments. Two calls with the same inputs return deeply equal values and distinct result objects.

`MAX_CAP` is `10000`. A curve stores one integer per level, and `cap` cannot be greater than this.

### `createCurve(options)`

```js
createCurve(options);
```

Build a frozen curve. Checks run in this order:

1. `options` is an object. Otherwise `TypeError`: `options must be an object`.
2. `cap` is an integer from `1` to `10000`. Otherwise `RangeError`: `cap must be an integer greater than or equal to 1 and less than or equal to 10000`.
3. Exactly one of `formula` and `table` is present. Otherwise `TypeError`: `curve must use a formula or a table`.
4. For a formula, the name is `linear`, `polynomial`, or `exponential`. Otherwise `TypeError`: `formula must be linear, polynomial, or exponential`. Fields that do not belong to that formula are rejected, then `base`, then `degree` or `factor`. A total that is not a safe integer throws `RangeError`: `experience total must be a safe integer`.
5. For a table, `base`, `degree`, and `factor` must be omitted. The table is then checked as an array whose length equals `cap`, then each entry.

A field is present when it is an own property and its value is not `undefined`. `undefined` is treated as absent. Inherited properties are ignored. Any other own property is ignored and is not read.

The result is frozen:

| Field     | Linear        | Polynomial     | Exponential     | Table                      |
| --------- | ------------- | -------------- | --------------- | -------------------------- |
| `cap`     | the cap       | the cap        | the cap         | the cap                    |
| `formula` | `"linear"`    | `"polynomial"` | `"exponential"` | `null`                     |
| `base`    | the base      | the base       | the base        | `null`                     |
| `degree`  | `null`        | the degree     | `null`          | `null`                     |
| `factor`  | `null`        | `null`         | the factor      | `null`                     |
| `totals`  | frozen totals | frozen totals  | frozen totals   | a frozen copy of the table |

`totals[level - 1]` is the experience required to reach `level`. `totals[0]` is `0`. The length is `cap`. Below the cap, each entry is strictly greater than the previous one.

`base` is an integer greater than or equal to `1`. `degree` is an integer greater than or equal to `1`. `factor` is an integer greater than or equal to `2`. On every formula with a cap of at least `2`, the first step equals `base`, so level 2 requires `base` experience.

### Formulas

Let `step(level)` be the experience required to leave `level`, for `level` from `1` through `cap - 1`. The total required to reach level `L` is the sum of `step(1)` through `step(L - 1)`. The sum for level `1` is empty, so the total is `0`.

| Formula       | `step(level)`                 |
| ------------- | ----------------------------- |
| `linear`      | `base`                        |
| `polynomial`  | `base * level ^ degree`       |
| `exponential` | `base * factor ^ (level - 1)` |

The powers and the running total use integer multiplication and addition. Each product is formed only when it is still a safe integer. There is no floating-point rounding. A closed form matches these sums when the total fits:

- Linear: `base * (L - 1)`.
- Polynomial of degree `1`: `base * (L - 1) * L / 2`.
- Polynomial of degree `2`: `base * n * (n + 1) * (2 * n + 1) / 6`, where `n` is `L - 1`.
- Polynomial of degree `3`: `base * (n * (n + 1) / 2) ^ 2`.
- Exponential: `base * (factor ^ (L - 1) - 1) / (factor - 1)`.

Those divisions are exact for the integers the formulas accept. The implementation accumulates steps, so it does not need the closed form.

### `levelForExperience(curve, experience)`

```js
levelForExperience(curve, experience);
```

Return the level for a total experience value. Checks run in this order:

1. `curve` passes the curve checks below.
2. `experience` is an integer greater than or equal to `0`. Otherwise `RangeError`: `experience must be an integer greater than or equal to 0`.

The level is the greatest level whose total is less than or equal to `experience`. A total at or above `totals[cap - 1]` returns `cap`.

### `experienceForLevel(curve, level)`

```js
experienceForLevel(curve, level);
```

Return the total experience required to reach `level`. Checks run in this order:

1. `curve` passes the curve checks below.
2. `level` is an integer from `1` to `cap`. Otherwise `RangeError`: `level must be an integer greater than or equal to 1 and less than or equal to the cap`.

The return value is `totals[level - 1]`.

### `progressWithinLevel(curve, experience)`

```js
progressWithinLevel(curve, experience);
```

Return the progress inside the level that contains `experience`. The checks are the same as `levelForExperience`, in the same order.

The result is frozen:

| Field        | Meaning                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| `level`      | The level for `experience`.                                                                   |
| `experience` | The total that was passed, with `-0` normalized to `0`.                                       |
| `start`      | The total required to reach `level`.                                                          |
| `next`       | The total required to reach the next level, or `null` at the cap.                             |
| `span`       | `next - start`, or `0` at the cap.                                                            |
| `current`    | Experience earned inside this level. `0` at the cap, including past the cap.                  |
| `remaining`  | Experience still required to reach `next`, or `0` at the cap.                                 |
| `overflow`   | `0` when `experience` is at or below the cap total, otherwise `experience - totals[cap - 1]`. |

Two identities hold for every accepted total:

`experience === start + current + overflow`

`current + remaining === span`

Below the cap, `overflow` is `0`, `current` is less than `span`, and `remaining` is greater than `0`. At the cap, `span`, `current`, and `remaining` are `0`. Experience above the cap total is carried only by `overflow`.

### `applyGain(curve, options)`

```js
applyGain(curve, options);
```

Add `gain` to a stored `experience` and clamp the stored total to the cap. Checks run in this order:

1. `curve` passes the curve checks below.
2. `options` is an object. Otherwise `TypeError`: `options must be an object`.
3. `experience` is an integer greater than or equal to `0`. Otherwise `RangeError`: `experience must be an integer greater than or equal to 0`.
4. `experience` is less than or equal to the cap total. Otherwise `RangeError`: `experience must be less than or equal to the cap`.
5. `gain` is an integer greater than or equal to `0`. Otherwise `RangeError`: `gain must be an integer greater than or equal to 0`.

`experience` here is the stored total, so it cannot sit above the cap. A raw counter above the cap is a question for `levelForExperience` or `progressWithinLevel`, not a stored state.

Let `room` be the cap total minus `experience`. When `gain` is less than or equal to `room`, all of it is stored. When `gain` is greater than `room`, `room` is stored and the rest is overflow. The addition is skipped when it would pass the cap, so a huge gain cannot round the sum.

The result is frozen:

| Field                | Meaning                                                         |
| -------------------- | --------------------------------------------------------------- |
| `previousExperience` | The stored total before the gain.                               |
| `previousLevel`      | The level of `previousExperience`.                              |
| `experience`         | The stored total after the gain. This is at most the cap total. |
| `level`              | The level of `experience`.                                      |
| `levelsGained`       | `level - previousLevel`.                                        |
| `applied`            | The part of `gain` that was stored.                             |
| `overflow`           | The part of `gain` that did not fit.                            |

`applied + overflow` equals `gain`. `experience` equals `previousExperience + applied`. A later `progressWithinLevel` on the returned `experience` has `overflow` of `0`, because the surplus was not stored. `overflow` on the gain is the discarded part of this call, not a running surplus.

### Curve checks

`levelForExperience`, `experienceForLevel`, `progressWithinLevel`, and `applyGain` read `cap` and `totals` only. They accept the object returned by `createCurve` and any other object with the same `cap` and `totals`. Formula fields are a record of how `createCurve` built the curve. They are not read by the lookups.

The checks run in this order:

1. `curve` is an object. Otherwise `TypeError`: `curve must be an object`.
2. `cap` uses the same rule as `createCurve`. Otherwise `RangeError`: `cap must be an integer greater than or equal to 1 and less than or equal to 10000`.
3. `totals` is an own array. Otherwise `TypeError`: `totals must be an array`.
4. `totals.length` equals `cap`. Otherwise `RangeError`: `totals length must equal cap`.
5. Each index from `0` to `cap - 1` is an own integer greater than or equal to `0`. Otherwise `RangeError`: `totals entry must be an integer greater than or equal to 0`.
6. The first entry is `0`. Otherwise `RangeError`: `totals must start at 0`.
7. Each later entry is greater than the one before it. Otherwise `RangeError`: `totals must be strictly increasing`.

A hand-built `totals` array is read as it stands. Editing it changes the next lookup. `createCurve` copies and freezes its own `totals`, so editing the input table does not change the curve.

### Errors

| When the check fails                                                     | Error        | Message                                                                                 |
| ------------------------------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------- |
| `options` is missing, an array, or not an object                         | `TypeError`  | `options must be an object`                                                             |
| `cap` is missing or not an integer from `1` to `10000`                   | `RangeError` | `cap must be an integer greater than or equal to 1 and less than or equal to 10000`     |
| Both `formula` and `table` are present, or neither is                    | `TypeError`  | `curve must use a formula or a table`                                                   |
| `formula` is not `linear`, `polynomial`, or `exponential`                | `TypeError`  | `formula must be linear, polynomial, or exponential`                                    |
| `base` is missing or not an integer greater than or equal to `1`         | `RangeError` | `base must be an integer greater than or equal to 1`                                    |
| `degree` is missing or not an integer greater than or equal to `1`       | `RangeError` | `degree must be an integer greater than or equal to 1`                                  |
| `factor` is missing or not an integer greater than or equal to `2`       | `RangeError` | `factor must be an integer greater than or equal to 2`                                  |
| `degree` is present on a linear curve                                    | `TypeError`  | `degree must be omitted for a linear curve`                                             |
| `factor` is present on a linear curve                                    | `TypeError`  | `factor must be omitted for a linear curve`                                             |
| `factor` is present on a polynomial curve                                | `TypeError`  | `factor must be omitted for a polynomial curve`                                         |
| `degree` is present on an exponential curve                              | `TypeError`  | `degree must be omitted for an exponential curve`                                       |
| `base` is present on a table curve                                       | `TypeError`  | `base must be omitted for a table curve`                                                |
| `degree` is present on a table curve                                     | `TypeError`  | `degree must be omitted for a table curve`                                              |
| `factor` is present on a table curve                                     | `TypeError`  | `factor must be omitted for a table curve`                                              |
| `table` is not an array                                                  | `TypeError`  | `table must be an array`                                                                |
| `table.length` does not equal `cap`                                      | `RangeError` | `table length must equal cap`                                                           |
| A table index is missing or not an integer greater than or equal to `0`  | `RangeError` | `table entry must be an integer greater than or equal to 0`                             |
| The first table entry is not `0`                                         | `RangeError` | `table must start at 0`                                                                 |
| A table entry is not greater than the previous entry                     | `RangeError` | `table must be strictly increasing`                                                     |
| A step or a running total is not a safe integer                          | `RangeError` | `experience total must be a safe integer`                                               |
| `curve` is missing, an array, or not an object                           | `TypeError`  | `curve must be an object`                                                               |
| `totals` is missing or not an array                                      | `TypeError`  | `totals must be an array`                                                               |
| `totals.length` does not equal `cap`                                     | `RangeError` | `totals length must equal cap`                                                          |
| A totals index is missing or not an integer greater than or equal to `0` | `RangeError` | `totals entry must be an integer greater than or equal to 0`                            |
| The first totals entry is not `0`                                        | `RangeError` | `totals must start at 0`                                                                |
| A totals entry is not greater than the previous entry                    | `RangeError` | `totals must be strictly increasing`                                                    |
| `experience` is missing or not an integer greater than or equal to `0`   | `RangeError` | `experience must be an integer greater than or equal to 0`                              |
| Stored `experience` is above the cap total                               | `RangeError` | `experience must be less than or equal to the cap`                                      |
| `level` is missing or outside `1 .. cap`                                 | `RangeError` | `level must be an integer greater than or equal to 1 and less than or equal to the cap` |
| `gain` is missing or not an integer greater than or equal to `0`         | `RangeError` | `gain must be an integer greater than or equal to 0`                                    |

`-0` is accepted anywhere `0` is accepted, and it is returned as `0`. `1.0` is an integer. Strings, fractions, `NaN`, infinities, and values past `Number.MAX_SAFE_INTEGER` are rejected.

## Design notes

A level is a threshold on one number, the total experience. Level 1 is that number at `0`, because a new profile has not earned anything and is already in the game. The cap is the last threshold. There is no level past it, and there is no separate cost to "finish" the cap. The width of the cap is `0`.

Defining a formula as a step, then summing the steps, keeps the three names easy to compare. Linear growth adds the same cost every level. Polynomial growth scales the cost by the level raised to a degree, so degree `1` is the triangular series and degree `2` is the sum of squares. Exponential growth multiplies the cost by `factor` after every level. Degree `0` and factor `1` would both collapse to the linear curve, so they are rejected and the names stay distinct.

The table is the same sequence the formulas produce: the experience required to reach each level, not the cost of each step. A step of `40` followed by a step of `50` is written `[0, 40, 90]`. The table has to start at `0` and rise by at least `1` each level. A zero-width level below the cap would make "the next level" and "this level" the same total. The cap is the only level with a span of `0`.

Safe integers keep every threshold exact. A total that lands on a level joins that level, including a total exactly equal to the threshold. A float curve would make that equality depend on rounding. Products and sums are checked before they are formed. `2 ^ 52` still fits, and the exponential curve of base `1` and factor `2` reaches exactly `Number.MAX_SAFE_INTEGER` at level `54`. The next power does not fit, and that curve is refused. No lookup ever returns a rounded total.

Progress is reported as integers because a ratio would be a float. `current` is the portion inside the span. `overflow` is the portion past the cap. Their split is what makes the two identities hold when the total is above the cap: `current` stays `0`, and the surplus is not described as partial progress through a span that does not exist.

`applyGain` clamps. The stored total after a gain is always between `0` and the cap total, so a profile has one canonical experience value. The overflow on that call is how much of this gain was discarded. It is not added to a bank. A caller that wants to show a raw counter above the cap can pass that counter to `progressWithinLevel` and read `overflow` there. A caller that wants the next stored total uses the `experience` returned by `applyGain`.

Lookups accept a total above the cap so the question "what level is this counter" has an answer even when the counter was not clamped. `applyGain` refuses that same number as a stored total. The two functions are asking different questions. The gain path also refuses the addition when the gain is larger than the room, which keeps `Number.MAX_SAFE_INTEGER` usable as a gain without producing an imprecise sum.

The curve object is data. Lookups use `cap` and `totals` and ignore the formula fields, so a table and a formula that happen to produce the same totals answer the same level questions. `createCurve` copies the table and freezes the copy. A later write to the caller's array does not move a threshold. A hand-built totals array is not copied by the lookups. Changing it changes the next answer, which is what a pure function of its arguments does. Results are frozen and are not reused between calls, so freezing one progress object cannot change the next call.

Own properties are the whole input. An inherited `cap` or `base` is not a cap or a base. An unknown field is not read, so a getter used as a label cannot change the curve and cannot throw into the call. `-0` is normalized at the boundary so a stored total and a result never carry a negative zero.

The output order of fields is fixed. The same arguments produce the same totals, the same level, and the same gain report.

## License

MIT. Copyright (c) 2026 Vadim Gubin.
