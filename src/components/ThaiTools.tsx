import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { ToolError, messages } from "../services/errors";
import {
  bahtText,
  checkThaiId,
  convertYear,
  describeDate,
  formatSatang,
  incomeTax,
  vatBreakdown,
  withholdingRates,
  withholdingTax,
  type VatDirection,
  type VatMode,
  type YearDirection,
} from "../services/thaiTools";

type Mode = "baht-text" | "buddhist-year" | "withholding-tax" | "vat-calculator" | "thai-id" | "income-tax";

function attempt<T>(calculate: () => T): { value: T | null; error: string } {
  try {
    return { value: calculate(), error: "" };
  } catch (error) {
    return { value: null, error: error instanceof ToolError ? error.code : "number" };
  }
}

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function ThaiTools({ mode }: { mode: Mode }) {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const failure = (code: string) => (
    <p className="tool-error" role="alert">
      {(messages[code] ?? messages.number)[language]}
    </p>
  );
  if (mode === "baht-text") return <BahtText t={t} failure={failure} />;
  if (mode === "buddhist-year") return <BuddhistYear t={t} failure={failure} />;
  if (mode === "vat-calculator") return <VatCalculator t={t} failure={failure} />;
  if (mode === "thai-id") return <ThaiIdCheck t={t} failure={failure} />;
  if (mode === "income-tax") return <IncomeTax t={t} failure={failure} />;
  return <WithholdingTax t={t} failure={failure} language={language} />;
}

type Helpers = {
  t: (en: string, th: string) => string;
  failure: (code: string) => React.ReactNode;
};

function BahtText({ t, failure }: Helpers) {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState<{ text: string; ok: boolean } | null>(null);
  const result = amount.trim() ? attempt(() => bahtText(amount)) : null;
  const text = result?.value ?? "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ text, ok: true });
    } catch {
      setCopied({ text, ok: false });
    }
  };
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Amount in baht", "จำนวนเงิน (บาท)")}
        <input
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="1,250.75"
        />
        <small>
          {t(
            "Up to 999,999,999,999.99 with at most two decimals. Commas are fine.",
            "ไม่เกิน 999,999,999,999.99 บาท ทศนิยมไม่เกิน 2 ตำแหน่ง ใส่เครื่องหมายจุลภาคได้",
          )}
        </small>
      </label>
      <div className="calculation-result words" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : text ? (
          <>
            <span>{t("In Thai words", "เป็นตัวอักษร")}</span>
            <strong lang="th">{text}</strong>
          </>
        ) : (
          <span>{t("The amount in words appears here.", "จำนวนเงินเป็นตัวอักษรจะแสดงที่นี่")}</span>
        )}
      </div>
      <button type="button" className="button secondary" disabled={!text} onClick={copy}>
        {copied?.ok && copied.text === text ? <Check size={16} /> : <Copy size={16} />}
        {copied?.ok && copied.text === text ? t("Copied", "คัดลอกแล้ว") : t("Copy text", "คัดลอกข้อความ")}
      </button>
      {copied && !copied.ok && copied.text === text && (
        <p className="tool-error" role="alert">
          {t("This browser blocked copying. Select the text and copy it yourself.", "เบราว์เซอร์นี้ไม่อนุญาตให้คัดลอก กรุณาเลือกข้อความแล้วคัดลอกเอง")}
        </p>
      )}
      <p className="field-hint">
        {t(
          "Follows the usual reading used on cheques and the Excel BAHTTEXT function. Check the words against the figures before you rely on them.",
          "อ่านตามหลักที่ใช้กับเช็คและฟังก์ชัน BAHTTEXT ของ Excel ควรตรวจข้อความเทียบกับตัวเลขอีกครั้งก่อนนำไปใช้",
        )}
      </p>
    </div>
  );
}

function BuddhistYear({ t, failure }: Helpers) {
  const [year, setYear] = useState("");
  const [direction, setDirection] = useState<YearDirection>("be-to-ce");
  const [date, setDate] = useState(today);
  const yearResult = year.trim() ? attempt(() => convertYear(year, direction)) : null;
  const dateResult = date ? attempt(() => describeDate(date)) : null;
  const rows = dateResult?.value
    ? ([
        [t("Thai, full", "แบบไทย (เต็ม)"), dateResult.value.thaiLong, "th"],
        [t("Thai, short", "แบบไทย (ย่อ)"), dateResult.value.thaiShort, "th"],
        [t("Thai, numeric (D/M/B.E.)", "แบบไทย (ตัวเลข วว/ดด/พ.ศ.)"), dateResult.value.thaiNumeric, undefined],
        [t("Gregorian, full", "แบบสากล (เต็ม)"), dateResult.value.gregorianLong, "en"],
        [t("Gregorian, numeric (D/M/C.E.)", "แบบสากล (ตัวเลข วว/ดด/ค.ศ.)"), dateResult.value.gregorianNumeric, undefined],
      ] as const)
    : [];
  return (
    <div className="tool-fields">
      <div className="unit-row year-row">
        <label className="field">
          {t("Year", "ปี")}
          <input
            inputMode="numeric"
            autoComplete="off"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder="2569"
          />
        </label>
        <span aria-hidden="true" />
        <label className="field">
          {t("Convert", "แปลง")}
          <select value={direction} onChange={(event) => setDirection(event.target.value as YearDirection)}>
            <option value="be-to-ce">{t("B.E. to C.E.", "พ.ศ. เป็น ค.ศ.")}</option>
            <option value="ce-to-be">{t("C.E. to B.E.", "ค.ศ. เป็น พ.ศ.")}</option>
          </select>
        </label>
      </div>
      <div className="calculation-result" aria-live="polite">
        {yearResult?.error ? (
          failure(yearResult.error)
        ) : yearResult ? (
          <>
            <span>{direction === "be-to-ce" ? t("Christian era (C.E.)", "คริสต์ศักราช (ค.ศ.)") : t("Buddhist era (B.E.)", "พุทธศักราช (พ.ศ.)")}</span>
            <strong>{yearResult.value}</strong>
          </>
        ) : (
          <span>{t("Enter a year to convert it.", "กรอกปีเพื่อแปลง")}</span>
        )}
      </div>
      <label className="field">
        {t("Date", "วันที่")}
        <input type="date" value={date} min="1941-01-01" max="9999-12-31" onChange={(event) => setDate(event.target.value)} />
      </label>
      <div className="calculation-result" aria-live="polite">
        {dateResult?.error ? (
          failure(dateResult.error)
        ) : rows.length ? (
          <dl className="date-rows">
            {rows.map(([label, value, lang]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd lang={lang}>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <span>{t("Choose a date to write it in both eras.", "เลือกวันที่เพื่อดูทั้งสองระบบศักราช")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "B.E. is C.E. plus 543. Before 1 January 1941 (B.E. 2484) the Thai year began on 1 April, so January to March dates then differ by one year. Dates are supported from 1941.",
          "พ.ศ. คือ ค.ศ. บวก 543 ก่อน 1 มกราคม พ.ศ. 2484 (ค.ศ. 1941) ปีไทยเริ่มวันที่ 1 เมษายน วันที่ช่วงมกราคม–มีนาคมก่อนหน้านั้นจึงต่างไปหนึ่งปี เครื่องมือนี้รองรับวันที่ตั้งแต่ ค.ศ. 1941",
        )}
      </p>
    </div>
  );
}

function WithholdingTax({ t, failure, language }: Helpers & { language: "en" | "th" }) {
  const [amount, setAmount] = useState("");
  const [vat, setVat] = useState<VatMode>("none");
  const [preset, setPreset] = useState<string>("contract");
  const [custom, setCustom] = useState("");
  const rate = preset === "custom" ? custom : (withholdingRates.find((item) => item.id === preset)?.percent ?? "");
  const result = amount.trim() ? attempt(() => withholdingTax(amount, vat, rate)) : null;
  const figures = result?.value
    ? [
        [t("Amount before VAT (tax base)", "ยอดก่อน VAT (ฐานภาษี)"), result.value.base],
        ...(vat === "none"
          ? []
          : [
              [t("VAT 7%", "VAT 7%"), result.value.vat],
              [t("Invoice total", "ยอดตามใบกำกับ"), result.value.invoiceTotal],
            ]),
        [t("Tax to withhold", "ภาษีที่หัก ณ ที่จ่าย"), result.value.withheld],
        [t("Amount to pay out", "ยอดที่ต้องโอนจ่าย"), result.value.netPayment],
      ] as [string, bigint][]
    : [];
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Amount (baht)", "จำนวนเงิน (บาท)")}
        <input
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="10,000"
        />
      </label>
      <label className="field">
        {t("VAT", "ภาษีมูลค่าเพิ่ม")}
        <select value={vat} onChange={(event) => setVat(event.target.value as VatMode)}>
          <option value="none">{t("No VAT", "ไม่มี VAT")}</option>
          <option value="separate">{t("VAT 7% is added on top of this amount", "VAT 7% แยกต่างหาก (ยอดนี้ยังไม่รวม VAT)")}</option>
          <option value="included">{t("This amount already includes VAT 7%", "ยอดนี้รวม VAT 7% แล้ว")}</option>
        </select>
      </label>
      <label className="field">
        {t("Type of payment", "ประเภทเงินได้")}
        <select value={preset} onChange={(event) => setPreset(event.target.value)}>
          {withholdingRates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.percent}% — {item[language]}
            </option>
          ))}
          <option value="custom">{t("Other rate", "อัตราอื่น (กำหนดเอง)")}</option>
        </select>
      </label>
      {preset === "custom" && (
        <label className="field">
          {t("Rate (%)", "อัตรา (%)")}
          <input inputMode="decimal" autoComplete="off" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="1" />
        </label>
      )}
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : figures.length ? (
          <dl className="date-rows">
            {figures.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatSatang(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <span>{t("Enter an amount to see the tax.", "กรอกจำนวนเงินเพื่อดูภาษี")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "Tax is worked out on the amount before VAT when VAT is shown separately, and rounded to the satang (half up). The listed rates come from the Revenue Department notice on section 3 tredecim; the right rate depends on the kind of income and who receives it, and some payments have other rates. This is a calculator, not tax advice. Check with the Revenue Department or your accountant.",
          "คิดภาษีจากยอดก่อน VAT เมื่อแยกแสดง VAT ชัดเจน และปัดเศษเป็นสตางค์แบบปัดขึ้นตั้งแต่ครึ่ง อัตราที่แสดงอ้างอิงประกาศกรมสรรพากรเรื่องการหักภาษี ณ ที่จ่ายตามมาตรา 3 เตรส อัตราที่ถูกต้องขึ้นกับประเภทเงินได้และผู้รับเงิน และบางรายการมีอัตราอื่น เครื่องมือนี้ช่วยคำนวณ ไม่ใช่คำแนะนำด้านภาษี ควรตรวจกับกรมสรรพากรหรือนักบัญชี",
        )}
      </p>
      <p className="field-hint">
        {t(
          "The payer files form P.N.D. 3 (individual recipient) or P.N.D. 53 (company recipient) within 7 days after the end of the month of payment.",
          "ผู้จ่ายยื่น ภ.ง.ด.3 (ผู้รับเป็นบุคคลธรรมดา) หรือ ภ.ง.ด.53 (ผู้รับเป็นนิติบุคคล) ภายใน 7 วันนับแต่สิ้นเดือนที่จ่ายเงิน",
        )}
      </p>
    </div>
  );
}

function VatCalculator({ t, failure }: Helpers) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<VatDirection>("add");
  const result = amount.trim() ? attempt(() => vatBreakdown(amount, direction)) : null;
  const figures = result?.value
    ? ([
        [t("Price before VAT", "ราคาก่อน VAT"), result.value.base],
        [t("VAT 7%", "VAT 7%"), result.value.vat],
        [t("Price including VAT", "ราคารวม VAT"), result.value.total],
      ] as [string, bigint][])
    : [];
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Amount (baht)", "จำนวนเงิน (บาท)")}
        <input inputMode="decimal" autoComplete="off" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1,000" />
      </label>
      <label className="field">
        {t("Calculate", "วิธีคำนวณ")}
        <select value={direction} onChange={(event) => setDirection(event.target.value as VatDirection)}>
          <option value="add">{t("Add VAT 7% to this price", "บวก VAT 7% เข้ากับราคานี้")}</option>
          <option value="extract">{t("This price already includes VAT 7%", "ราคานี้รวม VAT 7% แล้ว (แยก VAT ออก)")}</option>
        </select>
      </label>
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : figures.length ? (
          <dl className="date-rows">
            {figures.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{formatSatang(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <span>{t("Enter an amount to see the VAT.", "กรอกจำนวนเงินเพื่อดู VAT")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "Uses the 7% rate and rounds to the satang (half up). Some goods and services are zero-rated or exempt. This is a calculator, not tax advice.",
          "ใช้อัตรา 7% และปัดเศษเป็นสตางค์แบบปัดขึ้นตั้งแต่ครึ่ง สินค้าและบริการบางประเภทเสียอัตรา 0% หรือได้รับยกเว้น เครื่องมือนี้ช่วยคำนวณ ไม่ใช่คำแนะนำด้านภาษี",
        )}
      </p>
    </div>
  );
}

function ThaiIdCheck({ t, failure }: Helpers) {
  const [id, setId] = useState("");
  const result = id.trim() ? attempt(() => checkThaiId(id)) : null;
  return (
    <div className="tool-fields">
      <label className="field">
        {t("National ID number (13 digits)", "เลขบัตรประชาชน (13 หลัก)")}
        <input inputMode="numeric" autoComplete="off" maxLength={17} value={id} onChange={(event) => setId(event.target.value)} placeholder="1-2345-67890-12-3" />
      </label>
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : result?.value ? (
          <>
            <span>{result.value.formatted}</span>
            <strong>
              {result.value.valid
                ? t("The check digit is correct", "เลขตรวจสอบ (หลักที่ 13) ถูกต้อง")
                : t(`The check digit is wrong; it should be ${result.value.expected}`, `เลขตรวจสอบไม่ถูกต้อง ควรเป็น ${result.value.expected}`)}
            </strong>
          </>
        ) : (
          <span>{t("Enter the 13 digits to check them.", "กรอกเลข 13 หลักเพื่อตรวจสอบ")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "This only checks the format and the last (check) digit. It cannot tell whether the number was issued or who it belongs to. The number is checked in your browser and is not sent or saved anywhere.",
          "ตรวจเฉพาะรูปแบบและเลขตรวจสอบหลักสุดท้าย ไม่สามารถบอกได้ว่าเลขนี้ถูกออกให้ใครจริงหรือไม่ เลขถูกตรวจในเบราว์เซอร์ ไม่ถูกส่งหรือบันทึกที่ไหน",
        )}
      </p>
    </div>
  );
}

function IncomeTax({ t, failure }: Helpers) {
  const [income, setIncome] = useState("");
  const result = income.trim() ? attempt(() => incomeTax(income)) : null;
  const bandLabel = (from: bigint, to: bigint | null) =>
    to === null ? t(`Over ${from.toLocaleString("en-US")}`, `เกิน ${from.toLocaleString("en-US")}`) : `${from.toLocaleString("en-US")} – ${to.toLocaleString("en-US")}`;
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Net income for the year (baht)", "เงินได้สุทธิทั้งปี (บาท)")}
        <input inputMode="decimal" autoComplete="off" value={income} onChange={(event) => setIncome(event.target.value)} placeholder="620,000" />
        <small>
          {t(
            "Net income is what remains after expenses and allowances (ค่าใช้จ่ายและค่าลดหย่อน).",
            "เงินได้สุทธิ คือเงินได้หลังหักค่าใช้จ่ายและค่าลดหย่อนแล้ว",
          )}
        </small>
      </label>
      <div className="calculation-result" aria-live="polite">
        {result?.error ? (
          failure(result.error)
        ) : result?.value ? (
          <>
            <dl className="date-rows">
              {result.value.rows
                .filter((row) => row.taxable > 0n)
                .map((row) => (
                  <div key={row.from.toString()}>
                    <dt>
                      {bandLabel(row.from, row.to)} ({row.percent.toString()}%)
                    </dt>
                    <dd>{formatSatang(row.tax)}</dd>
                  </div>
                ))}
            </dl>
            <span>{t("Income tax for the year", "ภาษีเงินได้บุคคลธรรมดาทั้งปี")}</span>
            <strong>{formatSatang(result.value.tax)}</strong>
          </>
        ) : (
          <span>{t("Enter net income to see the tax.", "กรอกเงินได้สุทธิเพื่อดูภาษี")}</span>
        )}
      </div>
      <p className="field-hint">
        {t(
          "Uses the progressive rates in force since tax year 2017: 0% up to 150,000 baht, then 5%, 10%, 15%, 20%, 25%, 30% and 35% above 5,000,000 baht. It does not work out expenses or allowances, minimum tax or credits already withheld. This is a calculator, not tax advice. Check with the Revenue Department (rd.go.th) or your accountant.",
          "ใช้อัตราก้าวหน้าที่ใช้มาตั้งแต่ปีภาษี 2560: ไม่เกิน 150,000 บาท ได้รับยกเว้น จากนั้น 5%, 10%, 15%, 20%, 25%, 30% และ 35% สำหรับส่วนที่เกิน 5,000,000 บาท ไม่ได้คำนวณค่าใช้จ่าย ค่าลดหย่อน ภาษีขั้นต่ำ หรือภาษีที่ถูกหักไว้แล้ว เครื่องมือนี้ช่วยคำนวณ ไม่ใช่คำแนะนำด้านภาษี ควรตรวจกับกรมสรรพากร (rd.go.th) หรือนักบัญชี",
        )}
      </p>
    </div>
  );
}
