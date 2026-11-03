import assert from "node:assert/strict";

const MAX = BigInt(Number.MAX_SAFE_INTEGER);

export function totalsFor(formula, base, degree, factor, cap) {
  const totals = [0n];
  let total = 0n;
  let fits = true;
  for (let level = 1; level < cap; level += 1) {
    let step;
    if (formula === "linear") {
      step = BigInt(base);
    } else if (formula === "polynomial") {
      step = BigInt(base) * BigInt(level) ** BigInt(degree);
    } else {
      step = BigInt(base) * BigInt(factor) ** BigInt(level - 1);
    }
    total += step;
    if (step > MAX || total > MAX) {
      fits = false;
    }
    totals.push(total);
  }
  for (let level = 1; level <= cap; level += 1) {
    const closed = closedForm(formula, base, degree, factor, level);
    if (closed !== null) {
      assert.equal(totals[level - 1], closed);
    }
  }
  return { fits, totals };
}

function closedForm(formula, base, degree, factor, level) {
  if (level === 1) {
    return 0n;
  }
  const n = BigInt(level - 1);
  const scale = BigInt(base);
  if (formula === "linear") {
    return scale * n;
  }
  if (formula === "polynomial" && degree === 1) {
    return (scale * n * (n + 1n)) / 2n;
  }
  if (formula === "polynomial" && degree === 2) {
    const doubled = 2n * n + 1n;
    return (scale * n * (n + 1n) * doubled) / 6n;
  }
  if (formula === "polynomial" && degree === 3) {
    const triangular = (n * (n + 1n)) / 2n;
    return scale * triangular * triangular;
  }
  if (formula === "exponential") {
    const growth = BigInt(factor);
    return (scale * (growth ** n - 1n)) / (growth - 1n);
  }
  return null;
}
