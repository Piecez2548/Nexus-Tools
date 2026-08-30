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
              "Up to 100,000 characters. Word boundaries use your browser’s language-aware segmentation.",
              "สูงสุด 100,000 ตัวอักษร แบ่งคำตามภาษาด้วยระบบของเบราว์เซอร์",
            )}
          </small>
        </label>
        <div className="text-stats" aria-live="polite">
          {[
            [t("Words", "คำ"), counts.words],
            [t("Characters", "ตัวอักษร"), counts.characters],
            [t("Paragraphs", "ย่อหน้า"), counts.paragraphs],
            ["UTF-8 bytes", counts.bytes],
          ].map(([label, number]) => (
            <div key={label}>
              <strong>{number.toLocaleString(language)}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
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

