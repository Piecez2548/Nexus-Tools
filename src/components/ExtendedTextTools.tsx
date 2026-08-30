import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { transformText, type TextAction } from "../services/textTools";
import { useToolRunner } from "../hooks/useToolRunner";
import ResultPanel from "./ResultPanel";
import SettingsHistory from "./SettingsHistory";
export default function ExtendedTextTools({
  developer = false,
}: {
  developer?: boolean;
}) {
  const th = useLanguageStore((s) => s.language) === "th";
  const [input, setInput] = useState(""),
    [other, setOther] = useState(""),
    [result, setResult] = useState(""),
    [action, setAction] = useState<TextAction>(developer ? "json" : "upper");
  const runner = useToolRunner();
  const actions: [TextAction, string, string][] = developer
    ? [
        ["json", "Format / validate JSON", "จัดรูปแบบ / ตรวจ JSON"],
        ["url-encode", "URL Encode", "เข้ารหัส URL"],
        ["url-decode", "URL Decode", "ถอดรหัส URL"],
        ["base64-encode", "Base64 Encode (UTF-8)", "เข้ารหัส Base64 (UTF-8)"],
        ["base64-decode", "Base64 Decode (UTF-8)", "ถอดรหัส Base64 (UTF-8)"],
      ]
    : [
        ["upper", "UPPERCASE", "ตัวพิมพ์ใหญ่"],
        ["lower", "lowercase", "ตัวพิมพ์เล็ก"],
        ["trim", "Clean whitespace", "ล้างช่องว่าง"],
        ["dedupe", "Remove duplicate lines", "ลบบรรทัดซ้ำ"],
        ["compare", "Compare lines by position", "เปรียบเทียบข้อความตามบรรทัด"],
      ];
  return (
    <>
      <form
        onChange={() => {
          runner.reset();
          setResult("");
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void runner.run(() => {
            const output = transformText(input, action, other);
            setResult(output);
            return {
              blob: new Blob([output], { type: "text/plain;charset=utf-8" }),
              filename: action === "json" ? "nexus.json" : "nexus-text.txt",
            };
          });
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <label className="field">
            {th ? "การทำงาน" : "Operation"}
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as TextAction)}
            >
              {actions.map(([id, en, thai]) => (
                <option key={id} value={id}>
                  {th ? thai : en}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {th ? "ข้อความต้นฉบับ" : "Input text"}
            <textarea
              rows={7}
              maxLength={100000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          {action === "compare" && (
            <label className="field">
              {th ? "ข้อความเปรียบเทียบ" : "Comparison text"}
              <textarea
                rows={7}
                maxLength={100000}
                value={other}
                onChange={(e) => setOther(e.target.value)}
              />
            </label>
          )}
          <button className="button">
            {th ? "ประมวลผลข้อความ" : "Process text"}
          </button>
        </fieldset>
      </form>
      <SettingsHistory
        id={developer ? "developer" : "text"}
        value={{ action }}
        onRestore={(v) => {
          if (actions.some((a) => a[0] === v.action)) setAction(v.action);
          runner.reset();
          setResult("");
        }}
      />
      {result && (
        <label className="field">
          {th ? "ผลลัพธ์" : "Output"}
          <textarea readOnly rows={8} value={result} />
        </label>
      )}
      <ResultPanel runner={runner} />
    </>
  );
}
