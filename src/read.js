import { MAX_CAP, isObject, normalizeZero } from "./math.js";

const OPTIONS_MESSAGE = "options must be an object";
const CAP_MESSAGE = `cap must be an integer greater than or equal to 1 and less than or equal to ${MAX_CAP}`;
const MODE_MESSAGE = "curve must use a formula or a table";
const FORMULA_MESSAGE = "formula must be linear, polynomial, or exponential";
const BASE_MESSAGE = "base must be an integer greater than or equal to 1";
const DEGREE_MESSAGE = "degree must be an integer greater than or equal to 1";
const FACTOR_MESSAGE = "factor must be an integer greater than or equal to 2";
const DEGREE_LINEAR_MESSAGE = "degree must be omitted for a linear curve";
const FACTOR_LINEAR_MESSAGE = "factor must be omitted for a linear curve";
const FACTOR_POLYNOMIAL_MESSAGE = "factor must be omitted for a polynomial curve";
const DEGREE_EXPONENTIAL_MESSAGE = "degree must be omitted for an exponential curve";
const BASE_TABLE_MESSAGE = "base must be omitted for a table curve";
const DEGREE_TABLE_MESSAGE = "degree must be omitted for a table curve";
const FACTOR_TABLE_MESSAGE = "factor must be omitted for a table curve";
const TABLE_TYPE_MESSAGE = "table must be an array";
const TABLE_LENGTH_MESSAGE = "table length must equal cap";
const TABLE_ENTRY_MESSAGE = "table entry must be an integer greater than or equal to 0";
const TABLE_START_MESSAGE = "table must start at 0";
const TABLE_ORDER_MESSAGE = "table must be strictly increasing";
const CURVE_MESSAGE = "curve must be an object";
const TOTALS_TYPE_MESSAGE = "totals must be an array";
const TOTALS_LENGTH_MESSAGE = "totals length must equal cap";
const TOTALS_ENTRY_MESSAGE = "totals entry must be an integer greater than or equal to 0";
const TOTALS_START_MESSAGE = "totals must start at 0";
const TOTALS_ORDER_MESSAGE = "totals must be strictly increasing";
const EXPERIENCE_MESSAGE = "experience must be an integer greater than or equal to 0";
const EXPERIENCE_CAP_MESSAGE = "experience must be less than or equal to the cap";
const LEVEL_MESSAGE =
  "level must be an integer greater than or equal to 1 and less than or equal to the cap";
const GAIN_MESSAGE = "gain must be an integer greater than or equal to 0";

const TABLE_MESSAGES = {
  type: TABLE_TYPE_MESSAGE,
  length: TABLE_LENGTH_MESSAGE,
  entry: TABLE_ENTRY_MESSAGE,
  start: TABLE_START_MESSAGE,
  order: TABLE_ORDER_MESSAGE
};

const TOTALS_MESSAGES = {
  type: TOTALS_TYPE_MESSAGE,
  length: TOTALS_LENGTH_MESSAGE,
  entry: TOTALS_ENTRY_MESSAGE,
  start: TOTALS_START_MESSAGE,
  order: TOTALS_ORDER_MESSAGE
};

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

export function readDefinition(options) {
  if (!isObject(options)) {
    throw new TypeError(OPTIONS_MESSAGE);
  }
  const cap = readCap(options);
  const formulaPresent = present(options, "formula");
  const tablePresent = present(options, "table");
  if (formulaPresent === tablePresent) {
    throw new TypeError(MODE_MESSAGE);
  }
  if (tablePresent) {
    return readTableDefinition(options, cap);
  }
  return readFormulaDefinition(options, cap);
}

export function readCurve(value) {
  if (!isObject(value)) {
    throw new TypeError(CURVE_MESSAGE);
  }
  const cap = readCap(value);
  if (!Object.hasOwn(value, "totals")) {
    throw new TypeError(TOTALS_TYPE_MESSAGE);
  }
  const totals = readSequence(value.totals, cap, TOTALS_MESSAGES);
  return { cap, totals };
}

export function readExperience(value) {
  return readInteger(value, 0, MAX_SAFE, EXPERIENCE_MESSAGE);
}

export function readLevel(value, cap) {
  return readInteger(value, 1, cap, LEVEL_MESSAGE);
}

export function readGain(curve, options) {
  const source = readCurve(curve);
  if (!isObject(options)) {
    throw new TypeError(OPTIONS_MESSAGE);
  }
  const experience = readRequiredInteger(options, "experience", 0, MAX_SAFE, EXPERIENCE_MESSAGE);
  if (experience > source.totals[source.cap - 1]) {
    throw new RangeError(EXPERIENCE_CAP_MESSAGE);
  }
  const gain = readRequiredInteger(options, "gain", 0, MAX_SAFE, GAIN_MESSAGE);
  return {
    cap: source.cap,
    totals: source.totals,
    experience,
    gain
  };
}

function readTableDefinition(options, cap) {
  rejectIfPresent(options, "base", BASE_TABLE_MESSAGE);
  rejectIfPresent(options, "degree", DEGREE_TABLE_MESSAGE);
  rejectIfPresent(options, "factor", FACTOR_TABLE_MESSAGE);
  const table = readSequence(options.table, cap, TABLE_MESSAGES);
  return {
    cap,
    formula: null,
    base: null,
    degree: null,
    factor: null,
    table
  };
}

function readFormulaDefinition(options, cap) {
  const formula = readFormula(options);
  if (formula === "linear") {
    rejectIfPresent(options, "degree", DEGREE_LINEAR_MESSAGE);
    rejectIfPresent(options, "factor", FACTOR_LINEAR_MESSAGE);
    return definition(cap, formula, readBase(options), null, null);
  }
  if (formula === "polynomial") {
    rejectIfPresent(options, "factor", FACTOR_POLYNOMIAL_MESSAGE);
    return definition(cap, formula, readBase(options), readDegree(options), null);
  }
  rejectIfPresent(options, "degree", DEGREE_EXPONENTIAL_MESSAGE);
  return definition(cap, formula, readBase(options), null, readFactor(options));
}

function definition(cap, formula, base, degree, factor) {
  return {
    cap,
    formula,
    base,
    degree,
    factor,
    table: null
  };
}

function readFormula(options) {
  const value = options.formula;
  if (value !== "linear" && value !== "polynomial" && value !== "exponential") {
    throw new TypeError(FORMULA_MESSAGE);
  }
  return value;
}

function readBase(options) {
  return readRequiredInteger(options, "base", 1, MAX_SAFE, BASE_MESSAGE);
}

function readDegree(options) {
  return readRequiredInteger(options, "degree", 1, MAX_SAFE, DEGREE_MESSAGE);
}

function readFactor(options) {
  return readRequiredInteger(options, "factor", 2, MAX_SAFE, FACTOR_MESSAGE);
}

function readCap(source) {
  return readRequiredInteger(source, "cap", 1, MAX_CAP, CAP_MESSAGE);
}

function rejectIfPresent(source, key, message) {
  if (present(source, key)) {
    throw new TypeError(message);
  }
}

function present(source, key) {
  return Object.hasOwn(source, key) && source[key] !== undefined;
}

function readRequiredInteger(source, key, minimum, maximum, message) {
  if (!present(source, key)) {
    throw new RangeError(message);
  }
  return readInteger(source[key], minimum, maximum, message);
}

function readInteger(value, minimum, maximum, message) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new RangeError(message);
  }
  return normalizeZero(value);
}

function readSequence(value, length, messages) {
  if (!Array.isArray(value)) {
    throw new TypeError(messages.type);
  }
  if (value.length !== length) {
    throw new RangeError(messages.length);
  }
  const copy = [];
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    if (!Object.hasOwn(value, index)) {
      throw new RangeError(messages.entry);
    }
    const entry = readInteger(value[index], 0, MAX_SAFE, messages.entry);
    if (index === 0) {
      if (entry !== 0) {
        throw new RangeError(messages.start);
      }
    } else if (entry <= previous) {
      throw new RangeError(messages.order);
    }
    previous = entry;
    copy.push(entry);
  }
  return copy;
}
