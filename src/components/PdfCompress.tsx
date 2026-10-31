import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { compressPdf, type CompressPreset } from "../services/pdfTools";
import { useToolRunner } from "../hooks/useToolRunner";
import { ToolError } from "../services/errors";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";

export default function PdfCompress() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [files, setFiles] = useState<File[]>([]),
    [preset, setPreset] = useState<CompressPreset>("balanced");
  const runner = useToolRunner();
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run((signal) =>
            files[0] ? compressPdf(files[0], preset, signal) : Promise.reject(new ToolError("files")),
          );
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <DropFiles
            files={files}
            onChange={(value) => {
              setFiles(value);
              runner.reset();
            }}
            accept="application/pdf"
            disabled={runner.busy}
          />
          <p className="tool-warning">
            {th
              ? "วิธีนี้แปลงทุกหน้าเป็นภาพแล้วรวมเป็น PDF ใหม่ ข้อความในไฟล์จะเลือก คัดลอก หรือค้นหาไม่ได้อีก และลิงก์/ฟอร์มจะหายไป เหมาะกับไฟล์สแกนหรือไฟล์ที่เป็นภาพเป็นหลัก ไฟล์ข้อความล้วนอาจใหญ่ขึ้น ระบบจะแจ้งถ้าไฟล์ใหม่ไม่เล็กลง"
              : "This turns every page into an image and rebuilds the PDF. Text can no longer be selected, copied or searched, and links and forms are lost. It suits scans and image-heavy files; text-only PDFs may get larger, and you are told when the result is not smaller."}
          </p>
          <p className="field-hint">
            {th ? "สูงสุด 100 หน้า / 50 MB • ไม่รองรับ PDF ล็อกรหัส" : "Up to 100 pages / 50 MB. No encrypted PDFs."}
          </p>
          <label className="field">
            {th ? "คุณภาพ" : "Quality"}
            <select value={preset} onChange={(event) => setPreset(event.target.value as CompressPreset)}>
              <option value="smaller">{th ? "เล็กที่สุด (ภาพหยาบลง)" : "Smallest (rougher images)"}</option>
              <option value="balanced">{th ? "สมดุล" : "Balanced"}</option>
              <option value="sharper">{th ? "คมชัด (ไฟล์ใหญ่กว่า)" : "Sharper (larger file)"}</option>
            </select>
          </label>
          <button className="button" disabled={!files.length}>
            {th ? "บีบอัด PDF" : "Compress PDF"}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}
