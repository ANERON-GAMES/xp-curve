import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  MAX_CAP,
  applyGain,
  createCurve,
  experienceForLevel,
  levelForExperience,
  progressWithinLevel
} from "../src/index.js";
import * as api from "../src/index.js";
import { MESSAGES } from "./messages.js";

const root = new URL("..", import.meta.url);

test("public exports stay limited to the documented surface", () => {
  assert.deepEqual(Object.keys(api).sort(), [
    "MAX_CAP",
    "applyGain",
    "createCurve",
    "experienceForLevel",
    "levelForExperience",
    "progressWithinLevel"
  ]);
  assert.equal(MAX_CAP, 10000);
  assert.equal(typeof api.MAX_CAP, "number");
  assert.equal(typeof api.createCurve, "function");
  assert.equal(typeof api.levelForExperience, "function");
  assert.equal(typeof api.experienceForLevel, "function");
  assert.equal(typeof api.progressWithinLevel, "function");
  assert.equal(typeof api.applyGain, "function");
  assert.equal(api.createCurve, createCurve);
  assert.equal(api.levelForExperience, levelForExperience);
  assert.equal(api.experienceForLevel, experienceForLevel);
  assert.equal(api.progressWithinLevel, progressWithinLevel);
  assert.equal(api.applyGain, applyGain);
});

test("package metadata names the module and the author", () => {
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));
  assert.equal(pkg.name, "@aneron/xp-curve");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.author, "Vadim Gubin");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.sideEffects, false);
  assert.equal(pkg.engines.node, ">=20");
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.main, "./src/index.js");
  assert.equal(pkg.exports, "./src/index.js");
  assert.equal(pkg.repository.type, "git");
  assert.equal(pkg.repository.url, "git+https://github.com/ANERON-GAMES/xp-curve.git");
  assert.deepEqual(pkg.files, ["src", "LICENSE", "README.md"]);
  assert.equal(pkg.scripts.test, "node --test test/*.test.js");
  assert.equal(pkg.scripts.lint, "eslint .");
  assert.equal(pkg.scripts.format, "prettier --write .");
  assert.equal(pkg.scripts["format:check"], "prettier --check .");
  const license = readFileSync(new URL("LICENSE", root), "utf8");
  assert.equal(license.split("\n")[2], "Copyright (c) 2026 Vadim Gubin");
  assert.equal(license.includes("Copyright (c) 2026 Vadim Gubin"), true);
  assert.equal(license.includes("anerongames"), false);
  const readme = readFileSync(new URL("README.md", root), "utf8");
  for (const heading of [
    "## Purpose",
    "## Install",
    "## Usage",
    "## API",
    "## Design notes",
    "## License"
  ]) {
    assert.equal(readme.includes(heading), true, heading);
  }
  for (const message of MESSAGES) {
    assert.equal(readme.includes(message), true, message);
  }
  for (const phrase of [
    "`levelForExperience(curve, 0)` is `1`",
    "`levelForExperience(curve, 250)` is `3`",
    "`levelForExperience(curve, 899)` is `9`",
    "`levelForExperience(curve, 900)` is `10`",
    "`levelForExperience(curve, 5000)` is `10`",
    "`experienceForLevel(curve, 1)` is `0`",
    "`experienceForLevel(curve, 2)` is `100`",
    "`experienceForLevel(curve, 4)` is `300`",
    "`experienceForLevel(curve, 10)` is `900`",
    "`progress.level` is `3`",
    "`progress.experience` is `250`",
    "`progress.start` is `200`",
    "`progress.next` is `300`",
    "`progress.span` is `100`",
    "`progress.current` is `50`",
    "`progress.remaining` is `50`",
    "`progress.overflow` is `0`",
    "`past.level` is `10`",
    "`past.overflow` is `50`",
    "`past.current` is `0`",
    "`stayed.levelsGained` is `0`",
    "`stayed.experience` is `270`",
    "`advanced.level` is `4`",
    "`advanced.levelsGained` is `1`",
    "`advanced.applied` is `50`",
    "`advanced.overflow` is `0`",
    "`advanced.experience` is `300`",
    "`capped.level` is `10`",
    "`capped.previousLevel` is `3`",
    "`capped.levelsGained` is `7`",
    "`capped.applied` is `650`",
    "`capped.overflow` is `150`",
    "`capped.experience` is `900`",
    "`full.overflow` is `40`",
    "`full.applied` is `0`",
    "`full.levelsGained` is `0`",
    "`experienceForLevel(steep, 5)` is `300`",
    "`experienceForLevel(rising, 6)` is `3100`",
    "`levelForExperience(rising, 700)` is `4`",
    "`levelForExperience(rising, 699)` is `3`",
    "`experienceForLevel(custom, 4)` is `200`",
    "`levelForExperience(custom, 90)` is `3`",
    "`paced.current` is `10`",
    "`paced.remaining` is `100`",
    "`paced.overflow` is `0`",
    "`experience === start + current + overflow`",
    "`current + remaining === span`"
  ]) {
    assert.equal(readme.includes(phrase), true, phrase);
  }
});

test("source files do not contain comments, clocks, timers, or network calls", () => {
  const files = readdirSync(new URL("src/", root)).sort();
  assert.deepEqual(files, [
    "curve.js",
    "gain.js",
    "index.js",
    "level.js",
    "lookup.js",
    "math.js",
    "read.js"
  ]);
  for (const name of files) {
    const source = readFileSync(new URL("src/" + name, root), "utf8");
    const specifiers = source.match(/from "[^"]+"/g) ?? [];
    assert.equal(specifiers.length > 0 || !source.includes("import "), true, name);
    for (const specifier of specifiers) {
      assert.match(specifier, /^from "\.\/[a-z]+\.js"$/);
    }
    assert.equal(source.includes("node:"), false, name);
    assert.equal(source.includes("require("), false, name);
    assert.equal(source.includes("/*"), false, name);
    assert.equal(source.includes("//"), false, name);
    for (const token of [
      "Date",
      "setTimeout",
      "setInterval",
      "Math.random",
      "process",
      "fetch(",
      "globalThis",
      "queueMicrotask",
      "setImmediate",
      "performance"
    ]) {
      assert.equal(source.includes(token), false, name + " " + token);
    }
  }
});

test("ci runs lint, format, and tests on node 20 and 22", () => {
  const ci = readFileSync(new URL(".github/workflows/ci.yml", root), "utf8");
  assert.equal(ci.includes("node-version: [20, 22]"), true);
  assert.equal(ci.includes("npm ci"), true);
  assert.equal(ci.includes("npm test"), true);
  assert.equal(ci.includes("npm run lint"), true);
  assert.equal(ci.includes("npm run format:check"), true);
});

test("the lockfile resolves only from the npm registry", () => {
  const lockPath = new URL("package-lock.json", root);
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  assert.equal(lock.lockfileVersion >= 2, true);
  const text = readFileSync(lockPath, "utf8");
  assert.equal(text.includes("git+"), false);
  assert.equal(text.includes("github:"), false);
  let resolved = 0;
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
      return;
    }
    if (value !== null && typeof value === "object") {
      if (typeof value.resolved === "string") {
        resolved += 1;
        assert.equal(
          value.resolved.startsWith("https://registry.npmjs.org/"),
          true,
          value.resolved
        );
      }
      for (const key of Object.keys(value)) {
        walk(value[key]);
      }
    }
  };
  walk(lock);
  assert.equal(resolved > 0, true);
});
