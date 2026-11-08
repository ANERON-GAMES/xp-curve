import { MAX_CAP } from "../src/index.js";

export const OPTIONS_MESSAGE = "options must be an object";
export const CAP_MESSAGE = `cap must be an integer greater than or equal to 1 and less than or equal to ${MAX_CAP}`;
export const MODE_MESSAGE = "curve must use a formula or a table";
export const FORMULA_MESSAGE = "formula must be linear, polynomial, or exponential";
export const BASE_MESSAGE = "base must be an integer greater than or equal to 1";
export const DEGREE_MESSAGE = "degree must be an integer greater than or equal to 1";
export const FACTOR_MESSAGE = "factor must be an integer greater than or equal to 2";
export const DEGREE_LINEAR_MESSAGE = "degree must be omitted for a linear curve";
export const FACTOR_LINEAR_MESSAGE = "factor must be omitted for a linear curve";
export const FACTOR_POLYNOMIAL_MESSAGE = "factor must be omitted for a polynomial curve";
export const DEGREE_EXPONENTIAL_MESSAGE = "degree must be omitted for an exponential curve";
export const BASE_TABLE_MESSAGE = "base must be omitted for a table curve";
export const DEGREE_TABLE_MESSAGE = "degree must be omitted for a table curve";
export const FACTOR_TABLE_MESSAGE = "factor must be omitted for a table curve";
export const TABLE_TYPE_MESSAGE = "table must be an array";
export const TABLE_LENGTH_MESSAGE = "table length must equal cap";
export const TABLE_ENTRY_MESSAGE = "table entry must be an integer greater than or equal to 0";
export const TABLE_START_MESSAGE = "table must start at 0";
export const TABLE_ORDER_MESSAGE = "table must be strictly increasing";
export const CURVE_MESSAGE = "curve must be an object";
export const TOTALS_TYPE_MESSAGE = "totals must be an array";
export const TOTALS_LENGTH_MESSAGE = "totals length must equal cap";
export const TOTALS_ENTRY_MESSAGE = "totals entry must be an integer greater than or equal to 0";
export const TOTALS_START_MESSAGE = "totals must start at 0";
export const TOTALS_ORDER_MESSAGE = "totals must be strictly increasing";
export const EXPERIENCE_MESSAGE = "experience must be an integer greater than or equal to 0";
export const EXPERIENCE_CAP_MESSAGE = "experience must be less than or equal to the cap";
export const LEVEL_MESSAGE =
  "level must be an integer greater than or equal to 1 and less than or equal to the cap";
export const GAIN_MESSAGE = "gain must be an integer greater than or equal to 0";
export const TOTAL_MESSAGE = "experience total must be a safe integer";

export const MESSAGES = [
  OPTIONS_MESSAGE,
  CAP_MESSAGE,
  MODE_MESSAGE,
  FORMULA_MESSAGE,
  BASE_MESSAGE,
  DEGREE_MESSAGE,
  FACTOR_MESSAGE,
  DEGREE_LINEAR_MESSAGE,
  FACTOR_LINEAR_MESSAGE,
  FACTOR_POLYNOMIAL_MESSAGE,
  DEGREE_EXPONENTIAL_MESSAGE,
  BASE_TABLE_MESSAGE,
  DEGREE_TABLE_MESSAGE,
  FACTOR_TABLE_MESSAGE,
  TABLE_TYPE_MESSAGE,
  TABLE_LENGTH_MESSAGE,
  TABLE_ENTRY_MESSAGE,
  TABLE_START_MESSAGE,
  TABLE_ORDER_MESSAGE,
  CURVE_MESSAGE,
  TOTALS_TYPE_MESSAGE,
  TOTALS_LENGTH_MESSAGE,
  TOTALS_ENTRY_MESSAGE,
  TOTALS_START_MESSAGE,
  TOTALS_ORDER_MESSAGE,
  EXPERIENCE_MESSAGE,
  EXPERIENCE_CAP_MESSAGE,
  LEVEL_MESSAGE,
  GAIN_MESSAGE,
  TOTAL_MESSAGE
];
