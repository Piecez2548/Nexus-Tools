import { ToolError } from "./errors";
import { parseMoney, roundedDivide } from "./thaiTools";

export type LoanMethod = "reducing" | "flat";
export interface LoanRow {
  month: number;
  payment: bigint;
  interest: bigint;
  principal: bigint;
  balance: bigint;
}

const maxMonths = 600;

/** A percentage from 0 to 100 with at most two decimals, in basis points (1% = 100). */
function parseRate(raw: string) {
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(raw.trim());
  if (!match) throw new ToolError("loan");
  const basisPoints = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (basisPoints > 10_000n) throw new ToolError("loan");
  return basisPoints;
}

function parseMonths(raw: string) {
  if (!/^\d{1,3}$/.test(raw.trim())) throw new ToolError("loan");
  const months = Number(raw.trim());
  if (months < 1 || months > maxMonths) throw new ToolError("loan");
  return months;
}

/** The monthly rate that makes `months` equal payments of `payment` worth `principal` today. */
function monthlyRateFor(principal: number, payment: number, months: number) {
  if (payment * months <= principal) return 0;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 200; step++) {
    const mid = (low + high) / 2;
    const worth = (payment * (1 - (1 + mid) ** -months)) / mid;
    if (worth > principal) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * Instalments for a loan. `reducing` charges interest on the balance left each month.
 * `flat` charges interest on the whole amount for the whole term, as many car loans do,
 * so its real yearly rate (`effectiveRate`, in percent) is higher than the quoted one.
 * Amounts are in satang.
 */
export function calculateLoan(rawPrincipal: string, rawRate: string, rawMonths: string, method: LoanMethod) {
  const principal = parseMoney(rawPrincipal, "loan");
  const basisPoints = parseRate(rawRate);
  const months = parseMonths(rawMonths);
  const rows: LoanRow[] = [];

  if (method === "flat") {
    const totalInterest = roundedDivide(principal * basisPoints * BigInt(months), 10_000n * 12n);
    const total = principal + totalInterest;
    const payment = roundedDivide(total, BigInt(months));
    let balance = principal;
    let paidInterest = 0n;
    for (let month = 1; month <= months; month++) {
      const last = month === months;
      const interest = last ? totalInterest - paidInterest : roundedDivide(totalInterest * BigInt(month), BigInt(months)) - paidInterest;
      const paid = last ? total - payment * BigInt(months - 1) : payment;
      const part = paid - interest;
      paidInterest += interest;
      balance -= part;
      rows.push({ month, payment: paid, interest, principal: part, balance });
    }
    const effective = monthlyRateFor(Number(principal), Number(total) / months, months);
    return { principal, months, method, payment, totalInterest, total, rows, effectiveRate: effective * 12 * 100 };
  }

  const monthly = Number(basisPoints) / 120_000;
  const exact = monthly === 0 ? Number(principal) / months : (Number(principal) * monthly) / (1 - (1 + monthly) ** -months);
  const payment = BigInt(Math.round(exact));
  let balance = principal;
  let totalInterest = 0n;
  for (let month = 1; month <= months; month++) {
    const interest = roundedDivide(balance * basisPoints, 120_000n);
    const paid = month === months ? balance + interest : payment;
    const part = paid - interest;
    balance -= part;
    totalInterest += interest;
    rows.push({ month, payment: paid, interest, principal: part, balance });
  }
  return { principal, months, method, payment, totalInterest, total: principal + totalInterest, rows, effectiveRate: Number(basisPoints) / 100 };
}
