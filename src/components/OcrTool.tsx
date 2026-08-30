import { downloadFile } from "@/shared/download";
import { defaultOcrOptions, compactThaiSpacing } from "../services/ocrImage";
import { ToolError } from "../services/errors";
import { useState, useEffect } from "react";
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
  const [options, setOptions] = useState(defaultOcrOptions);
  const [preview, setPreview] = useState("");
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    if (!files[0]?.type.startsWith("image/")) { setPreview(""); return; }
    const url = URL.createObjectURL(files[0]); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);
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
              options,
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
          <label className="field">
            {th ? "เตรียมภาพก่อนอ่าน" : "Image preparation"}
            <select value={options.background} onChange={(e) => setOptions({ ...options, background: e.target.value as typeof options.background })}>
              <option value="auto">{th ? "อัตโนมัติ — ขยายและตรวจพื้นเข้ม" : "Auto — enlarge and detect dark background"}</option>
              <option value="dark">{th ? "พื้นเข้ม ตัวอักษรสว่าง" : "Dark background, light text"}</option>
              <option value="light">{th ? "พื้นสว่าง ตัวอักษรเข้ม" : "Light background, dark text"}</option>
              <option value="original">{th ? "ภาพเดิม ไม่ปรับสี" : "Original — no enhancement"}</option>
            </select>
          </label>
          <label><input type="checkbox" checked={options.crop} onChange={(e) => setOptions({ ...options, crop: e.target.checked })} /> {th ? "อ่านเฉพาะบริเวณที่เลือก (PDF ใช้กับทุกหน้า)" : "Read a selected area (applies to every PDF page)"}</label>
          {options.crop && <div className="field-row">{([ ["x", "Left %", "ซ้าย %"], ["y", "Top %", "บน %"], ["width", "Width %", "กว้าง %"], ["height", "Height %", "สูง %"] ] as const).map(([key, en, label]) => <label className="field" key={key}>{th ? label : en}<input type="number" min={key === "x" || key === "y" ? 0 : 1} max={100} value={options[key]} onChange={(e) => setOptions({ ...options, [key]: Number(e.target.value) })} /></label>)}</div>}
          {preview && <div style={{ position: "relative", maxWidth: 620, lineHeight: 0 }}>
            <img src={preview} alt={th ? "ภาพต้นฉบับสำหรับ OCR" : "OCR source image"} style={{ width: "100%", display: "block" }} />
            {options.crop && <div aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", border: "2px solid #9bcf52", boxSizing: "border-box", left: `${options.x}%`, top: `${options.y}%`, width: `${Math.min(options.width, 100-options.x)}%`, height: `${Math.min(options.height, 100-options.y)}%` }} />}
          </div>}
          <p className="field-hint">{th ? "ภาพที่มีไทยปนอังกฤษให้เลือก ไทย + English และเลือกเฉพาะเนื้อหาเพื่อลดเมนู/ไอคอนที่ถูกอ่านปน OCR อ่านได้เฉพาะข้อความที่มองเห็นในภาพ ไม่สามารถกู้ส่วนที่เลื่อนพ้นจอหรือถูกตัดได้ การขยายภาพช่วยบางกรณี แต่ยังอาจอ่านชื่อ ตัวเลข และวรรณยุกต์ผิด" : "For mixed text choose Thai + English. Select only the content to avoid menus/icons. OCR cannot recover text outside the screenshot or clipped by scrolling. Enlarging can help but names, numbers and combining marks may still be wrong."}</p>
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
      {text && <>
        <label><input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} /> {th ? "แสดงแบบรวมช่องว่างระหว่างตัวไทย" : "Show Thai spacing cleanup"}</label>
        {compact && <>
          <p className="field-hint">{th ? "ลบเฉพาะช่องว่างระหว่างตัวไทย ไม่แก้คำผิด และอาจลบช่องว่างที่ตั้งใจเว้นไว้ ข้อความดิบด้านบนยังคงเดิม" : "Removes spaces between Thai characters only; does not correct words and may remove intentional spaces. Raw OCR above is unchanged."}</p>
          <textarea aria-label={th ? "ข้อความหลังจัดช่องว่าง" : "Thai spacing preview"} readOnly rows={8} value={compactThaiSpacing(text)} />
          <button className="button secondary" onClick={() => downloadFile("nexus-ocr-thai-spacing.txt", compactThaiSpacing(text), "text/plain;charset=utf-8")}>{th ? "ดาวน์โหลดฉบับจัดช่องว่าง" : "Download spacing-cleaned text"}</button>
        </>}
      </>}
      <ResultPanel runner={runner} />
    </>
  );
}
