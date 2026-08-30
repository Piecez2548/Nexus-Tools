import { ToolError } from "../services/errors";
import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { recognizeFile } from "../services/ocr";
import { useToolRunner } from "../hooks/useToolRunner";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";
export default function OcrTool() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [files, setFiles] = useState<File[]>([]),
    [language, setLanguage] = useState("eng+tha"),
    [text, setText] = useState(""),
    [progress, setProgress] = useState(0);
  const runner = useToolRunner();
  return (
    <>
      <form
        onChange={() => {
          runner.reset();
          setText("");
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setText("");
          setProgress(0);
          void runner.run(async (signal) => {
            if (!files[0]) throw new ToolError("files");
            const output = await recognizeFile(
              files[0],
              language,
              signal,
              setProgress,
            );
            if (!signal.aborted) setText(output);
            return {
              blob: new Blob([output], { type: "text/plain;charset=utf-8" }),
              filename: "nexus-ocr.txt",
            };
          });
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <DropFiles
            files={files}
            onChange={(v) => {
              setFiles(v);
              runner.reset();
              setText("");
            }}
            accept="image/png,image/jpeg,image/webp,application/pdf"
            disabled={runner.busy}
          />
          <label className="field">
            {th ? "ภาษาเอกสาร" : "Document language"}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="eng+tha">ไทย + English</option>
              <option value="eng">English</option>
              <option value="tha">ไทย</option>
            </select>
          </label>
          <p className="field-hint">
            {th
              ? "ภาพหรือ PDF สูงสุด 10 หน้า / 20 MB • ดาวน์โหลดโมเดลภาษาเมื่อใช้ครั้งแรก • ตรวจทานผลลัพธ์เสมอ โดยเฉพาะลายมือและภาพไม่ชัด • ไม่มีการส่งไฟล์ออกจากเครื่อง"
              : "Images or PDFs up to 10 pages / 20 MB. Language models download on first use. Proofread results, especially handwriting or blurry scans. Files stay on your device."}
          </p>
          <button className="button">
            {th ? "อ่านข้อความจากไฟล์" : "Recognize text"}
          </button>
        </fieldset>
      </form>
      {runner.busy && <p role="status">OCR: {Math.round(progress * 100)}%</p>}
      {text && (
        <label className="field">
          {th
            ? "ข้อความที่อ่านได้ (ตรวจทานก่อนใช้)"
            : "Recognized text (proofread before use)"}
          <textarea readOnly rows={10} value={text} />
        </label>
      )}
      <ResultPanel runner={runner} />
    </>
  );
}
