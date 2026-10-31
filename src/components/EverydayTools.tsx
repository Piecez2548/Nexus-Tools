import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { ToolError, messages } from "../services/errors";
import { calculateLoan, type LoanMethod } from "../services/loan";
import { describeDate, formatSatang } from "../services/thaiTools";
import { dateDifference, generatePassword, nextBirthday, passwordLimits, toArabicDigits, toThaiDigits, type PasswordOptions } from "../services/everyday";

type Mode = "loan-calculator" | "date-calculator" | "thai-digits" | "password-generator";
type T = (en: string, th: string) => string;

function attempt<T>(work: () => T): { value: T | null; error: string } {
  try {
    return { value: work(), error: "" };
  } catch (error) {
    return { value: null, error: error instanceof ToolError ? error.code : "number" };
  }
}

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function EverydayTools({ mode }: { mode: Mode }) {
  const { language } = useLanguageStore();
  const t: T = (en, th) => (language === "th" ? th : en);
  const failure = (code: string) => (
    <p className="tool-error" role="alert">
      {(messages[code] ?? messages.number)[language]}
    </p>
  );
  if (mode === "loan-calculator") return <LoanCalculator t={t} failure={failure} />;
  if (mode === "date-calculator") return <DateCalculator t={t} failure={failure} />;
  if (mode === "thai-digits") return <ThaiDigits t={t} />;
  return <PasswordGenerator t={t} />;
}

type Helpers = { t: T; failure: (code: string) => React.ReactNode };

function CopyButton({ t, text, label }: { t: T; text: string; label: string }) {
  const [state, setState] = useState<{ text: string; ok: boolean } | null>(null);
  const done = state?.ok && state.text === text;
  return (
    <>
      <button
        type="button"
        className="button secondary"
        disabled={!text}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState({ text, ok: true });
          } catch {
            setState({ text, ok: false });
          }
        }}
      >
        {done ? <Check size={16} /> : <Copy size={16} />}
        {done ? t("Copied", "คัดลอกแล้ว") : label}
      </button>
      {state && !state.ok && state.text === text && (
        <p className="tool-error" role="alert">
          {t("This browser blocked copying. Select the text and copy it yourself.", "เบราว์เซอร์นี้ไม่อนุญาตให้คัดลอก กรุณาเลือกข้อความแล้วคัดลอกเอง")}
        </p>
      )}
    </>
  );
}

function LoanCalculator({ t, failure }: Helpers) {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");
  const [method, setMethod] = useState<LoanMethod>("reducing");
  const filled = amount.trim() && rate.trim() && months.trim();
  const result = filled ? attempt(() => calculateLoan(amount, rate, months, method)) : null;
  const loan = result?.value;
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Loan amount (baht)", "ยอดเงินกู้ (บาท)")}
        <input inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500,000" />
      </label>
      <div className="field-row">
        <label className="field">
          {t("Interest rate (% per year)", "อัตราดอกเบี้ย (% ต่อปี)")}
          <input inputMode="decimal" autoComplete="off" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="3" />
        </label>
        <label className="field">
          {t("Number of months", "จำนวนงวด (เดือน)")}
          <input inputMode="numeric" autoComplete="off" value={months} onChange={(event) => setMonths(event.target.value)} placeholder="60" />
        </label>
      </div>
      <label className="field">
        {t("How interest is charged", "วิธีคิดดอกเบี้ย")}
        <select value={method} onChange={(event) => setMethod(event.target.value as LoanMethod)}>
          <option value="reducing">{t("On the balance left (reducing balance)", "คิดจากเงินต้นคงเหลือ (ลดต้นลดดอก) เช่น สินเชื่อบ้าน")}</option>
          <option value="flat">{t("On the full amount (flat rate)", "คิดจากเงินต้นเต็มจำนวน (Flat rate) เช่น เช่าซื้อรถ")}</option>
        </select>
      </label>
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : loan ? (
          <dl className="date-rows">
            <div>
              <dt>{t("Monthly instalment", "ค่างวดต่อเดือน")}</dt>
              <dd>{formatSatang(loan.payment)}</dd>
            </div>
            <div>
              <dt>{t("Total interest", "ดอกเบี้ยรวม")}</dt>
              <dd>{formatSatang(loan.totalInterest)}</dd>
            </div>
            <div>
              <dt>{t("Total paid", "ยอดชำระรวม")}</dt>
              <dd>{formatSatang(loan.total)}</dd>
            </div>
            {loan.method === "flat" && (
              <div>
                <dt>{t("Real yearly rate (EIR)", "อัตราดอกเบี้ยที่แท้จริง (EIR) ต่อปี")}</dt>
                <dd>{loan.effectiveRate.toFixed(2)}%</dd>
              </div>
            )}
          </dl>
        ) : (
          <span>{t("Fill in the amount, rate and months to see the instalment.", "กรอกยอดเงินกู้ อัตราดอกเบี้ย และจำนวนงวดเพื่อดูค่างวด")}</span>
        )}
      </div>
      {loan && loan.method === "flat" && (
        <p className="field-hint">
          {t(
            `A flat rate of ${rate}% looks low, but you keep paying interest on the full amount while the debt shrinks. The real yearly rate is about ${loan.effectiveRate.toFixed(2)}%, which is what a reducing-balance loan would need to cost the same.`,
            `ดอกเบี้ย Flat ${rate}% ดูต่ำ แต่คิดจากเงินต้นเต็มจำนวนตลอดสัญญา ทั้งที่หนี้ลดลงเรื่อยๆ อัตราที่แท้จริงอยู่ที่ประมาณ ${loan.effectiveRate.toFixed(2)}% ต่อปี ซึ่งเป็นอัตราแบบลดต้นลดดอกที่จะให้ค่างวดเท่ากัน`,
          )}
        </p>
      )}
      {loan && (
        <details>
          <summary>{t(`Payment schedule (${loan.rows.length} months)`, `ตารางผ่อนชำระ (${loan.rows.length} งวด)`)}</summary>
          <div className="table-scroll" tabIndex={0} role="region" aria-label={t("Payment schedule", "ตารางผ่อนชำระ")}>
            <table className="loan-table">
              <thead>
                <tr>
                  <th scope="col">{t("Month", "งวด")}</th>
                  <th scope="col">{t("Instalment", "ค่างวด")}</th>
                  <th scope="col">{t("Interest", "ดอกเบี้ย")}</th>
                  <th scope="col">{t("Principal", "เงินต้น")}</th>
                  <th scope="col">{t("Balance", "คงเหลือ")}</th>
                </tr>
              </thead>
              <tbody>
                {loan.rows.map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{row.month}</th>
                    <td>{formatSatang(row.payment)}</td>
                    <td>{formatSatang(row.interest)}</td>
                    <td>{formatSatang(row.principal)}</td>
                    <td>{formatSatang(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="field-hint">
        {t(
          "Instalments are rounded to the satang and the last one settles the rounding. Fees, insurance and a changing rate are not included, so the lender's figures can differ. This is a calculator, not financial advice.",
          "ค่างวดปัดเป็นสตางค์ และงวดสุดท้ายปรับเศษให้ลงตัว ไม่รวมค่าธรรมเนียม ประกัน หรืออัตราดอกเบี้ยที่เปลี่ยนตามสัญญา ตัวเลขของผู้ให้กู้อาจต่างไปเล็กน้อย เครื่องมือนี้ช่วยคำนวณ ไม่ใช่คำแนะนำทางการเงิน",
        )}
      </p>
    </div>
  );
}

function DateCalculator({ t, failure }: Helpers) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(today);
  const result = from && to ? attempt(() => ({ gap: dateDifference(from, to), birthday: nextBirthday(from, to), fromText: describeDate(from), toText: describeDate(to) })) : null;
  const value = result?.value;
  return (
    <div className="tool-fields">
      <div className="field-row">
        <label className="field">
          {t("From (or date of birth)", "จากวันที่ (หรือวันเกิด)")}
          <input type="date" min="1941-01-01" max="9999-12-31" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="field">
          {t("To (today by default)", "ถึงวันที่ (ค่าเริ่มต้นคือวันนี้)")}
          <input type="date" min="1941-01-01" max="9999-12-31" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : value ? (
          <>
            <dl className="date-rows">
              <div>
                <dt>{t("Time between", "ระยะเวลา")}</dt>
                <dd>
                  {value.gap.years} {t("years", "ปี")} {value.gap.months} {t("months", "เดือน")} {value.gap.days} {t("days", "วัน")}
                </dd>
              </div>
              <div>
                <dt>{t("Total days", "รวมทั้งหมด (วัน)")}</dt>
                <dd>{value.gap.totalDays.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt>{t("Weeks", "สัปดาห์")}</dt>
                <dd>
                  {Math.floor(value.gap.totalDays / 7).toLocaleString("en-US")} {t("weeks", "สัปดาห์")} {value.gap.totalDays % 7} {t("days", "วัน")}
                </dd>
              </div>
              <div>
                <dt>{t("Next birthday (if the first date is a birth date)", "วันเกิดครั้งถัดไป (ถ้าวันแรกคือวันเกิด)")}</dt>
                <dd>
                  {value.birthday.daysUntil === 0
                    ? t(`Today, turning ${value.birthday.turning}`, `วันนี้ ครบ ${value.birthday.turning} ปี`)
                    : t(`In ${value.birthday.daysUntil} days, turning ${value.birthday.turning}`, `อีก ${value.birthday.daysUntil} วัน ครบ ${value.birthday.turning} ปี`)}
                </dd>
              </div>
              <div>
                <dt>{t("From", "จากวันที่")}</dt>
                <dd lang="th">{value.fromText.thaiLong}</dd>
              </div>
              <div>
                <dt>{t("To", "ถึงวันที่")}</dt>
                <dd lang="th">{value.toText.thaiLong}</dd>
              </div>
            </dl>
          </>
        ) : (
          <span>{t("Choose the first date to see the time between.", "เลือกวันที่แรกเพื่อดูระยะเวลา")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "To find an age, enter the date of birth and leave the second date as today. Dates are supported from 1 January 1941 (B.E. 2484).",
          "ถ้าจะหาอายุ ให้ใส่วันเกิดและปล่อยวันที่สองเป็นวันนี้ รองรับวันที่ตั้งแต่ 1 มกราคม ค.ศ. 1941 (พ.ศ. 2484) เป็นต้นไป",
        )}
      </p>
    </div>
  );
}

function ThaiDigits({ t }: { t: T }) {
  const [text, setText] = useState("");
  const thai = toThaiDigits(text);
  const arabic = toArabicDigits(text);
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Text", "ข้อความ")}
        <textarea rows={5} maxLength={20000} value={text} onChange={(event) => setText(event.target.value)} placeholder="วันที่ 31 ตุลาคม 2569 / ๓๑ ตุลาคม ๒๕๖๙" />
      </label>
      <div className="calculation-result words" aria-live="polite">
        <span>{t("With Thai digits (๐-๙)", "เป็นเลขไทย (๐-๙)")}</span>
        <strong lang="th" style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
          {thai || "—"}
        </strong>
      </div>
      <CopyButton t={t} text={thai} label={t("Copy Thai digits", "คัดลอกเลขไทย")} />
      <div className="calculation-result words" aria-live="polite">
        <span>{t("With Arabic digits (0-9)", "เป็นเลขอารบิก (0-9)")}</span>
        <strong lang="th" style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
          {arabic || "—"}
        </strong>
      </div>
      <CopyButton t={t} text={arabic} label={t("Copy Arabic digits", "คัดลอกเลขอารบิก")} />
      <p className="field-hint">{t("Only digits change; letters, spaces and punctuation stay as they are.", "เปลี่ยนเฉพาะตัวเลข ตัวอักษร ช่องว่างและเครื่องหมายคงเดิม")}</p>
    </div>
  );
}

const strength = (bits: number, t: T) => (bits < 40 ? t("Weak", "อ่อน") : bits < 60 ? t("Fair", "พอใช้") : bits < 80 ? t("Strong", "แข็งแรง") : t("Very strong", "แข็งแรงมาก"));

function PasswordGenerator({ t }: { t: T }) {
  const language = useLanguageStore((state) => state.language);
  const [options, setOptions] = useState<PasswordOptions>({ length: 16, lower: true, upper: true, digits: true, symbols: true, clearOnly: false });
  const [result, setResult] = useState<{ password: string; entropyBits: number } | null>(null);
  const [error, setError] = useState("");
  const generate = (next: PasswordOptions) => {
    try {
      setResult(generatePassword(next));
      setError("");
    } catch (failure) {
      setResult(null);
      setError(failure instanceof ToolError ? failure.code : "password");
    }
  };
  useEffect(() => generate(options), []);
  const change = (patch: Partial<PasswordOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    generate(next);
  };
  const kinds: [keyof PasswordOptions, string, string][] = [
    ["lower", "Lowercase (a-z)", "ตัวพิมพ์เล็ก (a-z)"],
    ["upper", "Uppercase (A-Z)", "ตัวพิมพ์ใหญ่ (A-Z)"],
    ["digits", "Digits (0-9)", "ตัวเลข (0-9)"],
    ["symbols", "Symbols (!@#$%…)", "สัญลักษณ์ (!@#$%…)"],
    ["clearOnly", "Avoid look-alikes (0 O 1 l I |)", "เลี่ยงตัวที่ดูคล้ายกัน (0 O 1 l I |)"],
  ];
  return (
    <div className="tool-fields">
      <div className="calculation-result words" aria-live="polite">
        {error ? (
          <p className="tool-error" role="alert">
            {(messages[error] ?? messages.password)[language]}
          </p>
        ) : result ? (
          <>
            <span>
              {t("Your password", "รหัสผ่านของคุณ")} · {strength(result.entropyBits, t)} ({result.entropyBits} {t("bits", "บิต")})
            </span>
            <strong>
              <code data-testid="password" style={{ overflowWrap: "anywhere" }}>
                {result.password}
              </code>
            </strong>
          </>
        ) : null}
      </div>
      <div className="field-row">
        <CopyButton t={t} text={result?.password ?? ""} label={t("Copy password", "คัดลอกรหัสผ่าน")} />
        <button type="button" className="button secondary" onClick={() => generate(options)}>
          <RefreshCw size={16} />
          {t("Make another", "สร้างใหม่")}
        </button>
      </div>
      <label className="field">
        {t(`Length: ${options.length}`, `ความยาว: ${options.length}`)}
        <input type="range" min={passwordLimits.min} max={passwordLimits.max} value={options.length} onChange={(event) => change({ length: Number(event.target.value) })} />
      </label>
      <fieldset className="tool-fields">
        <legend>{t("Include", "ประกอบด้วย")}</legend>
        {kinds.map(([key, en, th]) => (
          <label key={key} className="check-field">
            <input type="checkbox" checked={Boolean(options[key])} onChange={(event) => change({ [key]: event.target.checked } as Partial<PasswordOptions>)} />
            {t(en, th)}
          </label>
        ))}
      </fieldset>
      <p className="field-hint">
        {t(
          "Made in your browser with its secure random generator. Nothing is sent or saved; copy it into a password manager.",
          "สร้างในเบราว์เซอร์ด้วยตัวสุ่มที่ปลอดภัยของเบราว์เซอร์ ไม่มีการส่งหรือบันทึกที่ไหน ควรคัดลอกไปเก็บในโปรแกรมจัดการรหัสผ่าน",
        )}
      </p>
    </div>
  );
}
