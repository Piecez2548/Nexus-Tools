import { ToolError } from "../services/errors";
import { useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import {
  batchImages,
  editImage,
  defaultImageOptions,
} from "../services/imageTools";
import { imagesToPdf } from "../services/pdfTools";
import { useToolRunner } from "../hooks/useToolRunner";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";
import SettingsHistory from "./SettingsHistory";
export default function ImageStudio({
  mode,
}: {
  mode: "image-studio" | "batch-images" | "images-pdf" | "remove-background";
}) {
  const th = useLanguageStore((s) => s.language) === "th";
  const [files, setFiles] = useState<File[]>([]),
    [o, setO] = useState({
      ...defaultImageOptions,
      removeBackground: mode === "remove-background",
    });
  const runner = useToolRunner();
  const numeric: [keyof typeof o, string, string, number, number, number][] = [
    ["width", "Maximum width (px)", "ความกว้างสูงสุด (px)", 1, 10000, 1],
    ["quality", "Quality", "คุณภาพ", 0.1, 1, 0.05],
    ["x", "Crop left (%)", "ครอปจากซ้าย (%)", 0, 99, 0.1],
    ["y", "Crop top (%)", "ครอปจากบน (%)", 0, 99, 0.1],
    ["cropWidth", "Crop width (%)", "ความกว้างครอป (%)", 0.1, 100, 0.1],
    ["cropHeight", "Crop height (%)", "ความสูงครอป (%)", 0.1, 100, 0.1],
  ];
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(e) => {
          e.preventDefault();
          void runner.run((signal) =>
            mode === "images-pdf"
              ? imagesToPdf(files, signal)
              : mode === "batch-images"
                ? batchImages(files, o, signal)
                : files[0]
                  ? editImage(files[0], o, signal)
                  : Promise.reject(new ToolError("files")),
          );
        }}
      >
        <fieldset className="tool-fields" disabled={runner.busy}>
          <DropFiles
            files={files}
            onChange={(v) => {
              setFiles(v);
              runner.reset();
            }}
            accept="image/png,image/jpeg,image/webp"
            multiple={mode === "batch-images" || mode === "images-pdf"}
            disabled={runner.busy}
          />
          {mode === "images-pdf" ? (
            <p>
              {th
                ? "เรียงไฟล์ด้วยลูกศร แต่ละรูปจะอยู่บนกระดาษ A4 หนึ่งหน้า โดยคงสัดส่วน"
                : "Use arrows to reorder files. Each image fits one A4 page with its aspect ratio preserved."}
            </p>
          ) : (
            <>
              <div className="field-row">
                <label className="field">
                  {th ? "รูปแบบไฟล์" : "Output format"}
                  <select
                    value={o.format}
                    disabled={mode === "remove-background"}
                    onChange={(e) => setO({ ...o, format: e.target.value })}
                  >
                    <option value="image/png">PNG</option>
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                  </select>
                </label>
              </div>
              <div className="field-row">
                {numeric.map(([key, en, thai, min, max, step]) => (
                  <label className="field" key={key}>
                    {th ? thai : en}
                    <input
                      type="number"
                      required
                      value={Number(o[key])}
                      min={min}
                      max={max}
                      step={step}
                      onChange={(e) =>
                        setO({ ...o, [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="field">
                {th
                  ? "ข้อความลายน้ำ (เว้นว่างได้)"
                  : "Watermark text (optional)"}
                <input
                  maxLength={100}
                  value={o.watermark}
                  onChange={(e) => setO({ ...o, watermark: e.target.value })}
                />
              </label>
              <p className="field-hint">
                {th
                  ? "ลายน้ำพาดเฉียงกลางหน้า ตัวใหญ่ สีจาง 18% ไม่บังเนื้อหา"
                  : "Large diagonal watermark across the center, at a subtle 18% opacity."}
              </p>
              {mode === "remove-background" && (
                <>
                  <p className="field-hint">
                    {th
                      ? "ลบเฉพาะสีที่เชื่อมต่อกับขอบภาพ เหมาะกับพื้นหลังสีเรียบ ไม่ใช่ AI แยกบุคคล/เส้นผม ส่งออก PNG โปร่งใส"
                      : "Removes matching color connected to image edges. Best for solid backgrounds; not AI person/hair segmentation. Exports transparent PNG."}
                  </p>
                  <label className="field">
                    {th ? "สีพื้นหลัง" : "Background color"}
                    <input
                      type="color"
                      value={o.color}
                      onChange={(e) => setO({ ...o, color: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    {th ? "ความคลาดเคลื่อนสี" : "Color tolerance"}
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={o.tolerance}
                      onChange={(e) =>
                        setO({ ...o, tolerance: Number(e.target.value) })
                      }
                    />
                  </label>
                </>
              )}
              <p className="field-hint">
                {th
                  ? "JPEG/PNG/WebP: ไฟล์ละ 20 MB, 24 ล้านพิกเซล ZIP ไม่เกิน 100 MB • ครอปเป็นเปอร์เซ็นต์ของต้นฉบับ • ตำแหน่ง + ขนาดต้องไม่เกิน 100% • ไม่ขยายเกินต้นฉบับ • ไม่เก็บภาพเคลื่อนไหว/เมทาดาทา"
                  : "JPEG/PNG/WebP: 20 MB each, 24 megapixels. ZIP output limit: 100 MB. Crop uses percentages of the original. Position + size must be ≤100%. No upscaling. Animation and metadata are discarded."}
              </p>
            </>
          )}
          <button className="button">
            {th ? "สร้างไฟล์" : "Generate file"}
          </button>
        </fieldset>
      </form>
      {mode !== "images-pdf" && (
        <SettingsHistory
          id={mode}
          value={o}
          onRestore={(v) => {
            setO({ ...v, removeBackground: mode === "remove-background" });
            runner.reset();
          }}
        />
      )}
      <ResultPanel runner={runner} />
    </>
  );
}
