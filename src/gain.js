import { levelForTotal } from "./level.js";
import { readGain } from "./read.js";

export function applyGain(curve, options) {
  const source = readGain(curve, options);
  const capTotal = source.totals[source.cap - 1];
  const room = capTotal - source.experience;
  const capped = source.gain > room;
  const applied = capped ? room : source.gain;
  const overflow = capped ? source.gain - room : 0;
  const experience = capped ? capTotal : source.experience + source.gain;
  const previousLevel = levelForTotal(source.totals, source.experience);
  const level = levelForTotal(source.totals, experience);
  return Object.freeze({
    previousExperience: source.experience,
    previousLevel,
    experience,
    level,
    levelsGained: level - previousLevel,
    applied,
    overflow
  });
}
