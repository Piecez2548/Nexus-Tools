import { ToolError } from "./errors";

// ---- Dates -------------------------------------------------------------------------------------

// Thailand moved the new year to 1 January in 1941, so earlier dates are not supported (see thaiTools).
const firstYear = 1941;

export interface Day {
  year: number;
  month: number;
  day: number;
}

export function parseDay(iso: string): Day {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new ToolError("date");
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real || year < firstYear) throw new ToolError("date");
  return { year, month, day };
}

const utc = (value: Day) => Date.UTC(value.year, value.month - 1, value.day);
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const formatDay = (value: Day) => `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;

/** Whole days from `from` to `to`, and the same gap as years, months and days. */
export function dateDifference(fromIso: string, toIso: string) {
  const from = parseDay(fromIso);
  const to = parseDay(toIso);
  const totalDays = Math.round((utc(to) - utc(from)) / 86_400_000);
  if (totalDays < 0) throw new ToolError("daterange");
  // Whole months first, then the days left over. A month that is too short for the start day
  // (31 January plus one month) ends on its last day.
  let wholeMonths = (to.year - from.year) * 12 + (to.month - from.month);
  if (to.day < from.day) wholeMonths -= 1;
  const index = from.year * 12 + (from.month - 1) + wholeMonths;
  const anchorYear = Math.floor(index / 12);
  const anchorMonth = (index % 12) + 1;
  const anchor = { year: anchorYear, month: anchorMonth, day: Math.min(from.day, daysInMonth(anchorYear, anchorMonth)) };
  const days = Math.round((utc(to) - utc(anchor)) / 86_400_000);
  return { years: Math.floor(wholeMonths / 12), months: wholeMonths % 12, days, totalDays };
}

/** The next birthday on or after `asOfIso`. A 29 February birthday falls on 1 March in other years. */
export function nextBirthday(birthIso: string, asOfIso: string) {
  const birth = parseDay(birthIso);
  const asOf = parseDay(asOfIso);
  const on = (year: number): Day =>
    birth.month === 2 && birth.day === 29 && daysInMonth(year, 2) === 28 ? { year, month: 3, day: 1 } : { year, month: birth.month, day: birth.day };
  let date = on(asOf.year);
  if (utc(date) < utc(asOf)) date = on(asOf.year + 1);
  return { date: formatDay(date), daysUntil: Math.round((utc(date) - utc(asOf)) / 86_400_000), turning: date.year - birth.year };
}

// ---- Thai digits -------------------------------------------------------------------------------

const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";

export const toThaiDigits = (text: string) => text.replace(/[0-9]/g, (digit) => thaiDigits[Number(digit)]);
export const toArabicDigits = (text: string) => text.replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)));

// ---- Passwords ---------------------------------------------------------------------------------

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  /** Leave out characters that look alike: 0 O 1 l I | */
  clearOnly: boolean;
}

const sets = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*-_=+?",
} as const;
const lookAlike = new Set("0O1lI|");
export const passwordLimits = { min: 8, max: 64 } as const;

/** A whole number from 0 to max - 1, without modulo bias. */
export function secureRandom(max: number) {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function generatePassword(options: PasswordOptions, random: (max: number) => number = secureRandom) {
  if (!Number.isInteger(options.length) || options.length < passwordLimits.min || options.length > passwordLimits.max) throw new ToolError("password");
  const chosen = (["lower", "upper", "digits", "symbols"] as const)
    .filter((name) => options[name])
    .map((name) => [...sets[name]].filter((character) => !(options.clearOnly && lookAlike.has(character))));
  if (!chosen.length || chosen.length > options.length) throw new ToolError("password");
  const pool = chosen.flat();
  // One character from every chosen kind first, so the password always contains each of them.
  const characters = chosen.map((set) => set[random(set.length)]);
  while (characters.length < options.length) characters.push(pool[random(pool.length)]);
  for (let index = characters.length - 1; index > 0; index--) {
    const other = random(index + 1);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return { password: characters.join(""), entropyBits: Math.round(options.length * Math.log2(pool.length)) };
}
