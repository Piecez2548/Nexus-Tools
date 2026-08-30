import { useMemo, useState } from "react";
import { ArrowLeftRight, Download } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { downloadFile } from "@/shared/download";
import {
  convertUnit,
  countText,
  unitGroups,
  type UnitGroup,
} from "../services/calculations";
import { ToolError, messages } from "../services/errors";
export default function TextTools({
  mode,
}: {
  mode: "unit-converter" | "word-counter";
}) {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const [text, setText] = useState(""),
    [group, setGroup] = useState<UnitGroup>("length");
  const [from, setFrom] = useState("m"),
    [to, setTo] = useState("km"),
    [value, setValue] = useState("1");
  const counts = useMemo(() => countText(text, language), [text, language]);
  const calculation = useMemo(() => {
    try {
      return { value: convertUnit(value, group, from, to), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof ToolError ? error.code : "number",
      };
    }
  }, [value, group, from, to]);
  if (mode === "word-counter")
    return (
      <div className="tool-fields">
        <label className="field">
          {t("Your text", "ข้อความของคุณ")}
          <textarea
            rows={8}
            maxLength={100000}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("Paste or type here…", "พิมพ์หรือวางข้อความที่นี่…")}
          />
          <small>
            {t(
              "Up to 100,000 UTF-16 units. Counts include spaces and line breaks; the browser normalizes line endings to LF.",
              "สูงสุด 100,000 หน่วย UTF-16 รวมช่องว่างและขึ้นบรรทัดใหม่ โดยเบราว์เซอร์แปลงการขึ้นบรรทัดเป็น LF",
            )}
          </small>
        </label>
        <div className="text-stats" aria-live="polite">
          {[
            [t("Words", "คำ"), counts.words],
            [t("Characters (UTF-16)", "ตัวอักษร (UTF-16)"), counts.characters],
            [t("Visible characters", "ตัวอักษรที่มองเห็น"), counts.graphemes],
            [t("Paragraphs", "ย่อหน้า"), counts.paragraphs],
            ["UTF-8 bytes", counts.bytes],
          ].map(([label, number]) => (
            <div key={label}>
              <strong>{number.toLocaleString(language)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="field-hint">
          {t(
            "UTF-16 counts combining marks separately; emoji can use multiple units. Visible characters combine marks and joined emoji into grapheme clusters. For example, กิ้ = 3 UTF-16 units but 1 visible character. Word segmentation depends on the browser. Compare identical text, including whitespace and line breaks.",
            "UTF-16 นับสระและวรรณยุกต์แยกกัน ส่วนอีโมจิอาจใช้หลายหน่วย ตัวอักษรที่มองเห็นจะรวมเครื่องหมายและอีโมจิที่เชื่อมกัน เช่น กิ้ = 3 หน่วย UTF-16 แต่ 1 ตัวที่มองเห็น การแบ่งคำขึ้นกับเบราว์เซอร์ หากเทียบกับโปรแกรมอื่น ต้องใช้ข้อความ ช่องว่าง และขึ้นบรรทัดที่ตรงกัน",
          )}
        </p>
        <button
          className="button secondary"
          disabled={!text}
          onClick={() =>
            downloadFile("nexus-text.txt", text, "text/plain;charset=utf-8")
          }
        >
          <Download size={16} />
          {t("Download text", "ดาวน์โหลดข้อความ")}
        </button>
      </div>
    );
  return (
    <div className="tool-fields">
      <label className="field">
        {t("Measurement", "ประเภทหน่วย")}
        <select
          value={group}
          onChange={(event) => {
            const next = event.target.value as UnitGroup;
            setGroup(next);
            const units = Object.keys(unitGroups[next]);
            setFrom(units[0]);
            setTo(units[1]);
          }}
        >
          {(["length", "weight", "temperature"] as const).map((id, index) => (
            <option value={id} key={id}>
              {
                [
                  t("Length", "ความยาว"),
                  t("Weight", "น้ำหนัก"),
                  t("Temperature", "อุณหภูมิ"),
                ][index]
              }
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t("Value", "ค่า")}
        <input
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <div className="unit-row">
        <label className="field">
          {t("From", "จาก")}
          <select
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          >
            {Object.keys(unitGroups[group]).map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <button
          className="icon-button"
          aria-label={t("Swap units", "สลับหน่วย")}
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          <ArrowLeftRight size={20} />
        </button>
        <label className="field">
          {t("To", "เป็น")}
          <select value={to} onChange={(event) => setTo(event.target.value)}>
            {Object.keys(unitGroups[group]).map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="calculation-result" aria-live="polite">
        {calculation.error ? (
          <p className="tool-error">{messages[calculation.error][language]}</p>
        ) : (
          <>
            <span>{t("Result", "ผลลัพธ์")}</span>
            <strong>
              {calculation.value?.toLocaleString(language, {
                maximumSignificantDigits: 12,
              })}{" "}
              <small>{to}</small>
            </strong>
          </>
        )}
      </div>
    </div>
  );
}

