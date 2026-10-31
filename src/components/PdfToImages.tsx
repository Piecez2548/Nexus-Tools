import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import { pageImageScales, pdfToImages, type PageImageFormat } from "../services/pdfTools";
import { useToolRunner } from "../hooks/useToolRunner";
import { ToolError } from "../services/errors";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";

export default function PdfToImages() {
  const th = useLanguageStore((s) => s.language) === "th";
  const [files, setFiles] = useState<File[]>([]),
    [pages, setPages] = useState(""),
    [format, setFormat] = useState<PageImageFormat>("image/png"),
    [scale, setScale] = useState(2);
  const runner = useToolRunner();
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run((signal) =>
            files[0] ? pdfToImages(files[0], pages, format, scale, signal) : Promise.reject(new ToolError("files")),
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
          <p className="field-hint">
            {th
              ? "สูงสุด 100 หน้า / 50 MB • ไม่รองรับ PDF ล็อกรหัส • หลายหน้าจะได้เป็นไฟล์ ZIP"
              : "Up to 100 pages / 50 MB. No encrypted PDFs. Several pages download as one ZIP."}
          </p>
          <label className="field">
            {th ? "หน้าที่ต้องการ (เว้นว่าง = ทุกหน้า)" : "Pages (empty = all pages)"}
            <input value={pages} maxLength={200} placeholder="1, 3-5" onChange={(event) => setPages(event.target.value)} />
          </label>
          <div className="field-row">
            <label className="field">
              {th ? "รูปแบบไฟล์" : "Output format"}
              <select value={format} onChange={(event) => setFormat(event.target.value as PageImageFormat)}>
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </label>
            <label className="field">
              {th ? "ความละเอียด" : "Resolution"}
              <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                {pageImageScales.map((value) => (
                  <option key={value} value={value}>
                    {value}× ({Math.round(value * 72)} DPI)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="button" disabled={!files.length}>
            {th ? "แปลงเป็นรูป" : "Convert to images"}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}
