import { useEffect, useRef } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useModalA11y } from "@/shared/useModalA11y";
import { useLanguageStore } from "@/shared/languageStore";
import { categories, type Tool } from "../catalog";
import FileTools from "./FileTools";
import TextTools from "./TextTools";
import InvoiceTool from "./InvoiceTool";
import QrTool from "./QrTool";
import PdfStudio from "./PdfStudio";
import ImageStudio from "./ImageStudio";
import OcrTool from "./OcrTool";
import ExtendedTextTools from "./ExtendedTextTools";
export default function ToolWorkspace({
  tool,
  onClose,
}: {
  tool: Tool;
  onClose: () => void;
}) {
  const { language } = useLanguageStore();
  const panel = useRef<HTMLElement>(null);
  useModalA11y({ open: true, onClose, containerRef: panel });
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  const group = categories.find((item) => item.id === tool.category)!;
  return (
    <div
      className="workspace-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-title"
        tabIndex={-1}
        className={`workspace tone-${group.color}`}
      >
        <div className="workspace-header">
          <span className="tool-icon">
            <tool.icon size={23} />
          </span>
          <div>
            <span className="section-kicker">
              NEXUS TOOLS / {group.name[language]}
            </span>
            <h2 id="workspace-title">{tool.name[language]}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={language === "th" ? "ปิดเครื่องมือ" : "Close tool"}
          >
            <X size={22} />
          </button>
        </div>
        <p className="workspace-description">{tool.description[language]}</p>
        {tool.id === "qr-code" ? (
          <QrTool />
        ) : tool.id === "pdf-studio" || tool.id === "pdf-text" ? (
          <PdfStudio textEditor={tool.id === "pdf-text"} />
        ) : tool.id === "image-studio" ||
          tool.id === "batch-images" ||
          tool.id === "images-pdf" ||
          tool.id === "remove-background" ? (
          <ImageStudio mode={tool.id} />
        ) : tool.id === "ocr" ? (
          <OcrTool />
        ) : tool.id === "text-studio" || tool.id === "developer-tools" ? (
          <ExtendedTextTools developer={tool.id === "developer-tools"} />
        ) : tool.id === "invoice" ? (
          <InvoiceTool />
        ) : tool.id === "unit-converter" || tool.id === "word-counter" ? (
          <TextTools mode={tool.id} />
        ) : (
          <FileTools mode={tool.id} />
        )}
        <div className="workspace-privacy">
          <ShieldCheck size={15} />
          {language === "th"
            ? "ประมวลผลในเบราว์เซอร์ของคุณ • ไม่มีการอัปโหลดไฟล์"
            : "Processed in your browser • No file uploads"}
        </div>
      </section>
    </div>
  );
}
