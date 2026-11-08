import { levelForTotal } from "./level.js";
import { readCurve, readExperience, readLevel } from "./read.js";

export function levelForExperience(curve, experience) {
  const source = readCurve(curve);
  const total = readExperience(experience);
  return levelForTotal(source.totals, total);
}

export function experienceForLevel(curve, level) {
  const source = readCurve(curve);
  const resolved = readLevel(level, source.cap);
  return source.totals[resolved - 1];
}

export function progressWithinLevel(curve, experience) {
  const source = readCurve(curve);
  const total = readExperience(experience);
  const level = levelForTotal(source.totals, total);
  const start = source.totals[level - 1];
  const capTotal = source.totals[source.cap - 1];
  const next = level === source.cap ? null : source.totals[level];
  const span = next === null ? 0 : next - start;
  const overflow = total > capTotal ? total - capTotal : 0;
  const current = total - start - overflow;
  const remaining = span - current;
  return Object.freeze({
    level,
    experience: total,
    start,
    next,
    span,
    current,
    remaining,
    overflow
  });
}
