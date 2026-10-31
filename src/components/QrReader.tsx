import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { messages, ToolError } from "../services/errors";
import { readQrCode, type QrReading } from "../services/qrReader";
import DropFiles from "./DropFiles";

export default function QrReader() {
  const language = useLanguageStore((s) => s.language);
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const [files, setFiles] = useState<File[]>([]),
    [reading, setReading] = useState<QrReading | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState<boolean | null>(null);
  const choose = async (next: File[]) => {
    setFiles(next);
    setReading(null);
    setError("");
    setCopied(null);
    if (!next[0]) return;
    setBusy(true);
    try {
      const found = await readQrCode(next[0]);
      setReading(found);
    } catch (failure) {
      setError(failure instanceof ToolError ? failure.code : "failed");
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reading!.text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <DropFiles files={files} onChange={(value) => void choose(value)} accept="image/png,image/jpeg,image/webp" disabled={busy} />
      <p className="field-hint">
        {t(
          "PNG, JPEG or WebP up to 20 MB. The image is read in your browser and never uploaded.",
          "PNG, JPEG หรือ WebP ไม่เกิน 20 MB อ่านในเบราว์เซอร์ ไม่อัปโหลดรูป",
        )}
      </p>
      <div aria-live="polite">
        {busy && <p role="status">{t("Reading…", "กำลังอ่าน…")}</p>}
        {error && (
          <p className="tool-error" role="alert">
            {(messages[error] ?? messages.failed)[language]}
          </p>
        )}
        {reading && (
          <div className="calculation-result words">
            <strong>{t("QR code contents", "ข้อความใน QR Code")}</strong>
            <p lang="und" style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
              {reading.text}
            </p>
            <div className="field-row">
              <button type="button" className="button secondary" onClick={() => void copy()}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {t("Copy text", "คัดลอกข้อความ")}
              </button>
              {reading.link && (
                <a className="button secondary" href={reading.link} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                  {t("Open link", "เปิดลิงก์")}
                </a>
              )}
            </div>
            {reading.link && (
              <p className="field-hint">
                {t("Check the address before opening. QR links can lead to fake sites.", "ตรวจที่อยู่ลิงก์ก่อนเปิด QR อาจพาไปเว็บปลอมได้")}
              </p>
            )}
            {copied === false && (
              <p className="tool-error" role="alert">
                {t("Copy failed. Select the text and copy it yourself.", "คัดลอกไม่สำเร็จ เลือกข้อความแล้วคัดลอกเอง")}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
