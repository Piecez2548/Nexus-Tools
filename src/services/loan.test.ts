import { describe, expect, it } from "vitest";
import { calculateLoan } from "./loan";
import { formatSatang } from "./thaiTools";

describe("loan with interest on the reducing balance", () => {
  it("matches the standard instalment for a 30 year home loan", () => {
    const loan = calculateLoan("1,000,000", "6", "360", "reducing");
    expect(formatSatang(loan.payment)).toBe("5,995.51");
    expect(loan.rows).toHaveLength(360);
  });
  it("pays the loan off exactly and splits every instalment into interest and principal", () => {
    for (const [amount, rate, months] of [["1000000", "6", "360"], ["250000", "3.25", "48"], ["99999.99", "19.99", "13"], ["1000", "0", "7"], ["500000", "7.5", "1"]]) {
      const loan = calculateLoan(amount, rate, months, "reducing");
      expect(loan.rows.at(-1)!.balance).toBe(0n);
      expect(loan.rows.reduce((sum, row) => sum + row.principal, 0n)).toBe(loan.principal);
      expect(loan.rows.reduce((sum, row) => sum + row.interest, 0n)).toBe(loan.totalInterest);
      expect(loan.rows.reduce((sum, row) => sum + row.payment, 0n)).toBe(loan.total);
      for (const row of loan.rows) expect(row.payment).toBe(row.interest + row.principal);
    }
  });
  it("charges the first instalment interest on the whole amount", () => {
    const loan = calculateLoan("1000000", "6", "360", "reducing");
    expect(formatSatang(loan.rows[0].interest)).toBe("5,000.00");
    expect(formatSatang(loan.rows[0].principal)).toBe("995.51");
  });
  it("splits an interest-free loan evenly", () => {
    const loan = calculateLoan("1200", "0", "12", "reducing");
    expect(formatSatang(loan.payment)).toBe("100.00");
    expect(loan.totalInterest).toBe(0n);
    expect(loan.effectiveRate).toBe(0);
  });
});

describe("loan with a flat rate", () => {
  it("charges interest on the whole amount for the whole term", () => {
    const loan = calculateLoan("500,000", "3", "60", "flat");
    expect(formatSatang(loan.totalInterest)).toBe("75,000.00");
    expect(formatSatang(loan.total)).toBe("575,000.00");
    expect(formatSatang(loan.payment)).toBe("9,583.33");
  });
  it("shows that the real yearly rate is much higher than the flat rate", () => {
    const flat = calculateLoan("500000", "3", "60", "flat");
    expect(flat.effectiveRate).toBeGreaterThan(5.3);
    expect(flat.effectiveRate).toBeLessThan(5.7);
    // A reducing-balance loan at that real rate asks for almost the same instalment.
    const reducing = calculateLoan("500000", flat.effectiveRate.toFixed(2), "60", "reducing");
    expect(Math.abs(Number(reducing.payment - flat.payment))).toBeLessThan(300);
  });
  it("adds up exactly, with the last instalment absorbing rounding", () => {
    for (const [amount, rate, months] of [["100000", "2.99", "7"], ["12345.67", "1.5", "11"], ["500000", "0", "24"]]) {
      const loan = calculateLoan(amount, rate, months, "flat");
      expect(loan.rows.at(-1)!.balance).toBe(0n);
      expect(loan.rows.reduce((sum, row) => sum + row.payment, 0n)).toBe(loan.total);
      expect(loan.rows.reduce((sum, row) => sum + row.interest, 0n)).toBe(loan.totalInterest);
    }
  });
});

describe("loan input checks", () => {
  it.each([
    ["", "5", "12"],
    ["0", "5", "12"],
    ["-1", "5", "12"],
    ["1000", "", "12"],
    ["1000", "101", "12"],
    ["1000", "5.123", "12"],
    ["1000", "abc", "12"],
    ["1000", "5", "0"],
    ["1000", "5", "601"],
    ["1000", "5", "1.5"],
    ["1000", "5", ""],
    ["10000000001", "5", "12"],
  ])("rejects %j, rate %j, months %j", (amount, rate, months) => {
    expect(() => calculateLoan(amount, rate, months, "reducing")).toThrow("loan");
  });
});
