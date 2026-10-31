import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { ToolError, messages } from "../services/errors";
import {
  bahtText,
  convertYear,
  describeDate,
  formatSatang,
  withholdingRates,
  withholdingTax,
  type VatMode,
  type YearDirection,
} from "../services/thaiTools";

type Mode = "baht-text" | "buddhist-year" | "withholding-tax";

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
