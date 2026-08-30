import { useState } from "react";
import { ArrowDown, ArrowUp, FileUp, Play, Trash2 } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { useToolRunner } from "../hooks/useToolRunner";
import {
  formatBytes,
  generateQr,
  processImage,
  runPdf,
} from "../services/files";
import ResultPanel from "./ResultPanel";
type Mode =
  "merge-pdf" | "split-pdf" | "compress-image" | "convert-image" | "qr-code";
export default function FileTools({ mode }: { mode: Mode }) {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const runner = useToolRunner();
  const [files, setFiles] = useState<File[]>([]),
    [pages, setPages] = useState("");
  const [format, setFormat] = useState(
    mode === "compress-image" ? "image/jpeg" : "image/png",
  );
  const [quality, setQuality] = useState(0.8),
    [width, setWidth] = useState(1920),
    [qrText, setQrText] = useState("");
  const pdf = mode === "merge-pdf" || mode === "split-pdf",
    image = mode === "compress-image" || mode === "convert-image";
  const move = (index: number, direction: number) => {
    const next = [...files];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    setFiles(next);
    runner.reset();
  };
  const submit = () =>
    void runner.run((signal) =>
      pdf
        ? runPdf(files, mode, pages, signal)
        : image
          ? processImage(files[0], format, quality, width, signal)
          : generateQr(qrText),
    );
  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={runner.busy} className="tool-fields">
          {mode === "qr-code" ? (
            <label className="field">
              {t("Text or link", "ข้อความหรือลิงก์")}
              <textarea
                required
                rows={4}
                value={qrText}
                onChange={(event) => {
                  setQrText(event.target.value);
                  runner.reset();
                }}
                maxLength={1000}
                placeholder="https://example.com"
              />
              <small>
                {t(
                  "Up to 1,000 UTF-8 bytes. Exported as a scalable SVG with a white background.",
                  "สูงสุด 1,000 ไบต์ UTF-8 ส่งออกเป็น SVG พื้นขาวที่ขยายได้",
                )}
              </small>
            </label>
          ) : (
            <>
              <label className="file-drop">
                <FileUp size={28} />
                <strong>
                  {t(
                    "Choose files to get started",
                    "เลือกไฟล์เพื่อเริ่มใช้งาน",
                  )}
                </strong>
                <span>
                  {pdf
                    ? t(
                        "PDF · 50 MB total · 500 pages · up to 20 files",
                        "PDF · รวม 50 MB · 500 หน้า · สูงสุด 20 ไฟล์",
                      )
                    : t(
                        "JPEG, PNG or WebP · up to 20 MB · 24 megapixels",
                        "JPEG, PNG หรือ WebP · สูงสุด 20 MB · 24 ล้านพิกเซล",
                      )}
                </span>
                <input
                  type="file"
                  aria-label={t("Choose files", "เลือกไฟล์")}
                  accept={
                    pdf
                      ? ".pdf,application/pdf"
                      : "image/png,image/jpeg,image/webp"
                  }
                  multiple={mode === "merge-pdf"}
                  onChange={(event) => {
                    const chosen = Array.from(event.target.files ?? []);
                    setFiles(
                      mode === "merge-pdf" ? [...files, ...chosen] : chosen,
                    );
                    runner.reset();
                    event.target.value = "";
                  }}
                />
              </label>
              {files.length > 0 && (
                <ol className="file-list">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span>
                        <strong>
                          {index + 1}. {file.name}
                        </strong>
                        <small>{formatBytes(file.size)}</small>
                      </span>
                      {mode === "merge-pdf" && (
                        <>
                          <button
                            type="button"
                            className="icon-button"
                            disabled={index === 0}
                            aria-label={`${t("Move up", "เลื่อนขึ้น")} ${file.name}`}
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            disabled={index === files.length - 1}
                            aria-label={`${t("Move down", "เลื่อนลง")} ${file.name}`}
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown size={15} />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`${t("Remove", "ลบ")} ${file.name}`}
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== index));
                          runner.reset();
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              {mode === "merge-pdf" && (
                <p className="field-hint">
                  {t(
                    "Choose at least two PDFs. Use the arrows to set page order. PDF forms are flattened; bookmarks and digital signatures are not preserved.",
                    "เลือกอย่างน้อย 2 ไฟล์ ใช้ลูกศรจัดลำดับ ฟอร์ม PDF จะถูกแปลงเป็นเนื้อหาคงที่ ไม่เก็บบุ๊กมาร์กและลายเซ็นดิจิทัล",
                  )}
                </p>
              )}
              {mode === "split-pdf" && (
                <label className="field">
                  {t("Pages to extract", "หน้าที่ต้องการแยก")}
                  <input
                    required
                    value={pages}
                    onChange={(event) => {
                      setPages(event.target.value);
                      runner.reset();
                    }}
                    placeholder="1, 3-5"
                    maxLength={2000}
                  />
                  <small>
                    {t(
                      "One-based page numbers; preserves the order you enter. Produces one PDF.",
                      "เริ่มนับจากหน้า 1 เรียงตามที่กรอก ส่งออกเป็น PDF หนึ่งไฟล์",
                    )}
                  </small>
                </label>
              )}
              {image && (
                <>
                  <div className="field-row">
                    <label className="field">
                      {t("Output format", "รูปแบบไฟล์")}
                      <select
                        value={format}
                        onChange={(event) => {
                          setFormat(event.target.value);
                          runner.reset();
                        }}
                      >
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </label>
                    <label className="field">
                      {t("Maximum width (px)", "ความกว้างสูงสุด (px)")}
                      <input
                        type="number"
                        required
                        min={1}
                        max={10000}
                        step={1}
                        value={width}
                        onChange={(event) => {
                          setWidth(Number(event.target.value));
                          runner.reset();
                        }}
                      />
                    </label>
                  </div>
                  <label className="field">
                    {t("Quality", "คุณภาพ")} — {Math.round(quality * 100)}%
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      disabled={format === "image/png"}
                      value={quality}
                      onChange={(event) => {
                        setQuality(Number(event.target.value));
                        runner.reset();
                      }}
                    />
                  </label>
                  <p className="field-hint">
                    {t(
                      "Aspect ratio is preserved. PNG ignores quality. JPEG uses a white background. Animation and metadata are not preserved. Output size depends on the image.",
                      "รักษาสัดส่วนภาพ PNG ไม่ใช้ค่าคุณภาพ JPEG จะใช้พื้นขาว ไม่เก็บภาพเคลื่อนไหวและเมทาดาทา ขนาดผลลัพธ์ขึ้นอยู่กับภาพ",
                    )}
                  </p>
                </>
              )}
            </>
          )}
          <button type="submit" className="button">
            <Play size={16} />
            {t("Generate file", "สร้างไฟล์")}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}

