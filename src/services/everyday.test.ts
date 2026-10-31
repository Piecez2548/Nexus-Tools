import { describe, expect, it } from "vitest";
import { dateDifference, generatePassword, nextBirthday, secureRandom, toArabicDigits, toThaiDigits, type PasswordOptions } from "./everyday";

describe("date difference", () => {
  it("gives years, months, days and the total number of days", () => {
    expect(dateDifference("1990-05-20", "2026-10-31")).toEqual({ years: 36, months: 5, days: 11, totalDays: 13_313 });
    expect(dateDifference("2026-01-01", "2026-01-01")).toEqual({ years: 0, months: 0, days: 0, totalDays: 0 });
    expect(dateDifference("2026-10-30", "2026-10-31")).toEqual({ years: 0, months: 0, days: 1, totalDays: 1 });
  });
  it("borrows the length of the month before the end date", () => {
    expect(dateDifference("2026-01-31", "2026-03-01")).toEqual({ years: 0, months: 1, days: 1, totalDays: 29 });
    expect(dateDifference("2024-01-31", "2024-03-01")).toEqual({ years: 0, months: 1, days: 1, totalDays: 30 });
    expect(dateDifference("2025-12-25", "2026-01-05")).toEqual({ years: 0, months: 0, days: 11, totalDays: 11 });
  });
  it("counts leap days", () => {
    expect(dateDifference("2024-02-29", "2025-02-28")).toMatchObject({ years: 0, months: 11, days: 30, totalDays: 365 });
    expect(dateDifference("2000-02-29", "2024-02-29")).toMatchObject({ years: 24, months: 0, days: 0 });
    expect(dateDifference("2023-03-01", "2024-03-01").totalDays).toBe(366);
  });
  it("rejects bad dates and an end before the start", () => {
    for (const [from, to] of [["2026-02-30", "2026-03-01"], ["1940-12-31", "2026-01-01"], ["abcd", "2026-01-01"], ["", ""]]) expect(() => dateDifference(from, to)).toThrow("date");
    expect(() => dateDifference("2026-10-31", "2026-10-30")).toThrow("daterange");
  });
});

describe("next birthday", () => {
  it("counts the days until the next one and the age reached", () => {
    expect(nextBirthday("1990-05-20", "2026-10-31")).toEqual({ date: "2027-05-20", daysUntil: 201, turning: 37 });
    expect(nextBirthday("1990-12-25", "2026-10-31")).toEqual({ date: "2026-12-25", daysUntil: 55, turning: 36 });
  });
  it("counts today as a birthday", () => {
    expect(nextBirthday("1990-10-31", "2026-10-31")).toEqual({ date: "2026-10-31", daysUntil: 0, turning: 36 });
  });
  it("moves a 29 February birthday to 1 March in other years", () => {
    expect(nextBirthday("2000-02-29", "2026-10-31")).toMatchObject({ date: "2027-03-01", turning: 27 });
    expect(nextBirthday("2000-02-29", "2027-10-31")).toMatchObject({ date: "2028-02-29", turning: 28 });
  });
});

describe("Thai digits", () => {
  it("converts both ways and leaves other text alone", () => {
    expect(toThaiDigits("วันที่ 31 ตุลาคม 2569 โทร 081-234-5678")).toBe("วันที่ ๓๑ ตุลาคม ๒๕๖๙ โทร ๐๘๑-๒๓๔-๕๖๗๘");
    expect(toArabicDigits("๓๑ ตุลาคม ๒๕๖๙ ๐๑๒๓๔๕๖๗๘๙")).toBe("31 ตุลาคม 2569 0123456789");
    expect(toArabicDigits(toThaiDigits("1,234.50"))).toBe("1,234.50");
    expect(toThaiDigits("")).toBe("");
  });
});

describe("password generator", () => {
  const all: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, clearOnly: false };
  it("makes passwords of the right length with every chosen kind of character", () => {
    for (let run = 0; run < 200; run++) {
      const { password } = generatePassword(all);
      expect(password).toHaveLength(16);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*\-_=+?]/);
    }
  });
  it("uses only the chosen kinds and can leave out look-alike characters", () => {
    for (let run = 0; run < 200; run++) {
      expect(generatePassword({ ...all, upper: false, symbols: false, length: 12 }).password).toMatch(/^[a-z0-9]{12}$/);
      expect(generatePassword({ ...all, clearOnly: true, length: 64 }).password).not.toMatch(/[0O1lI|]/);
    }
  });
  it("reports the strength in bits", () => {
    expect(generatePassword({ ...all, length: 10, upper: false, symbols: false, digits: true }).entropyBits).toBe(Math.round(10 * Math.log2(36)));
    expect(generatePassword({ ...all, length: 8, lower: false, upper: false, symbols: false }).entropyBits).toBe(Math.round(8 * Math.log2(10)));
  });
  it("is deterministic for a given source of randomness", () => {
    const counter = () => {
      let next = 0;
      return (max: number) => next++ % max;
    };
    expect(generatePassword(all, counter()).password).toBe(generatePassword(all, counter()).password);
  });
  it("rejects impossible settings", () => {
    expect(() => generatePassword({ ...all, length: 7 })).toThrow("password");
    expect(() => generatePassword({ ...all, length: 65 })).toThrow("password");
    expect(() => generatePassword({ ...all, length: 12.5 })).toThrow("password");
    expect(() => generatePassword({ ...all, lower: false, upper: false, digits: false, symbols: false })).toThrow("password");
  });
  it("draws evenly from a range", () => {
    const counts = new Array(6).fill(0);
    for (let draw = 0; draw < 6000; draw++) counts[secureRandom(6)]++;
    for (const count of counts) expect(count).toBeGreaterThan(800);
    expect(Math.max(...counts)).toBeLessThan(1200);
  });
});
