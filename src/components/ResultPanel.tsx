import { Check, Download, LoaderCircle, X } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { formatBytes } from "../services/files";
import { messages } from "../services/errors";
import type { useToolRunner } from "../hooks/useToolRunner";
export default function ResultPanel({
  runner,
}: {
  runner: ReturnType<typeof useToolRunner>;
}) {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const { busy, error, result, reset } = runner;
  return (
    <div aria-live="polite" className="result-container">
      {busy && (
        <div className="processing">
          <LoaderCircle className="spin" size={20} />
          <span>{t("Processing…", "กำลังประมวลผล…")}</span>
          <button className="button secondary" onClick={reset}>
            <X size={15} />
            {t("Cancel", "ยกเลิก")}
          </button>
        </div>
      )}
      {error && (
        <p className="tool-error" role="alert">
          {(messages[error] ?? messages.failed)[language]}
        </p>
      )}
      {result && (
        <div className="result-panel">
          <div className="result-heading">
            <Check size={19} />
            <strong>{t("Your file is ready", "ไฟล์ของคุณพร้อมแล้ว")}</strong>
            <span>{formatBytes(result.blob.size)}</span>
          </div>
          {result.pages !== undefined && (
            <p>
              {result.pages}{" "}
              {t("pages in the exported PDF", "หน้าใน PDF ที่ส่งออก")}
            </p>
          )}
          {result.originalSize !== undefined && (
            <p>
              {t("Original", "ต้นฉบับ")}: {formatBytes(result.originalSize)} →{" "}
              {formatBytes(result.blob.size)}
              {result.blob.size >= result.originalSize
                ? ` · ${t("Output is not smaller. Try lower quality or width.", "ไฟล์ยังไม่เล็กลง ลองลดคุณภาพหรือความกว้าง")}`
                : ""}
            </p>
          )}
          {result.blob.type.startsWith("image/") && (
            <img
              className="result-image"
              src={result.url}
              alt={t("Generated image preview", "ภาพตัวอย่างผลลัพธ์")}
            />
          )}
          <a className="button" href={result.url} download={result.filename}>
            <Download size={17} />
            {t("Download", "ดาวน์โหลด")} {result.filename}
          </a>
          {result.blob.type.startsWith("text/html") && (
            <p>
              {t(
                "Open the downloaded HTML file, then use Print → Save as PDF. Thai text is supported.",
                "เปิดไฟล์ HTML ที่ดาวน์โหลด แล้วเลือก พิมพ์ → บันทึกเป็น PDF รองรับข้อความภาษาไทย",
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

