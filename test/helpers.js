import assert from "node:assert/strict";

export function rejects(fn, errorName, message) {
  assert.throws(fn, (error) => {
    assert.equal(error instanceof Error, true);
    assert.equal(error.name, errorName);
    assert.equal(error.message, message);
    return true;
  });
}

export function assertProgress(progress, curve) {
  assert.equal(Object.isFrozen(progress), true);
  assert.equal(progress.current + progress.remaining, progress.span);
  assert.equal(progress.experience, progress.start + progress.current + progress.overflow);
  assert.equal(progress.level >= 1, true);
  assert.equal(progress.level <= curve.cap, true);
  assert.equal(progress.start, curve.totals[progress.level - 1]);
  assert.equal(progress.current >= 0, true);
  assert.equal(progress.remaining >= 0, true);
  assert.equal(progress.overflow >= 0, true);
  if (progress.level === curve.cap) {
    assert.equal(progress.next, null);
    assert.equal(progress.span, 0);
    assert.equal(progress.remaining, 0);
    assert.equal(progress.current, 0);
    assert.equal(progress.overflow, progress.experience - curve.totals[curve.cap - 1]);
  } else {
    assert.equal(progress.next, curve.totals[progress.level]);
    assert.equal(progress.span, progress.next - progress.start);
    assert.equal(progress.overflow, 0);
    assert.equal(progress.current < progress.span, true);
    assert.equal(progress.remaining > 0, true);
  }
}

export function scanLevel(totals, total) {
  const last = totals.length - 1;
  if (total >= totals[last]) {
    return totals.length;
  }
  let level = 1;
  for (let index = 1; index < totals.length; index += 1) {
    if (totals[index] <= total) {
      level = index + 1;
    } else {
      break;
    }
  }
  return level;
}
