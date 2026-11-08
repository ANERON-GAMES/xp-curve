export const MAX_CAP = 10000;

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeZero(value) {
  if (value === 0) {
    return 0;
  }
  return value;
}

export function add(left, right, message) {
  if (left > MAX_SAFE - right) {
    throw new RangeError(message);
  }
  return left + right;
}

export function multiply(left, right, message) {
  if (right !== 0 && left > Math.floor(MAX_SAFE / right)) {
    throw new RangeError(message);
  }
  return left * right;
}

export function pow(base, exponent, message) {
  if (exponent === 0) {
    return 1;
  }
  let result = 1;
  let current = base;
  let remaining = exponent;
  while (remaining > 1) {
    if (remaining % 2 === 1) {
      result = multiply(result, current, message);
    }
    remaining = Math.floor(remaining / 2);
    current = multiply(current, current, message);
  }
  return multiply(result, current, message);
}
