import { add, multiply, pow } from "./math.js";
import { readDefinition } from "./read.js";

const TOTAL_MESSAGE = "experience total must be a safe integer";

export function createCurve(options) {
  const definition = readDefinition(options);
  const totals = definition.table === null ? buildTotals(definition) : definition.table;
  return Object.freeze({
    cap: definition.cap,
    formula: definition.formula,
    base: definition.base,
    degree: definition.degree,
    factor: definition.factor,
    totals: Object.freeze(totals)
  });
}

function buildTotals(definition) {
  const totals = [0];
  let total = 0;
  for (let level = 1; level < definition.cap; level += 1) {
    total = add(total, stepFor(definition, level), TOTAL_MESSAGE);
    totals.push(total);
  }
  return totals;
}

function stepFor(definition, level) {
  if (definition.formula === "linear") {
    return definition.base;
  }
  if (definition.formula === "polynomial") {
    return multiply(definition.base, pow(level, definition.degree, TOTAL_MESSAGE), TOTAL_MESSAGE);
  }
  return multiply(definition.base, pow(definition.factor, level - 1, TOTAL_MESSAGE), TOTAL_MESSAGE);
}
