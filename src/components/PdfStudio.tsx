import { useEffect, useRef, useState } from "react";
import { useLanguageStore } from "@/shared/languageStore";
import {
  editPdf,
  pdfPreview,
  renderPdfPage,
  type PdfPageEdit,
  type PdfTextEdit,
  type PreviewDocument,
} from "../services/pdfTools";
import { useToolRunner } from "../hooks/useToolRunner";
import { messages, ToolError } from "../services/errors";
import DropFiles from "./DropFiles";
import ResultPanel from "./ResultPanel";
export default function PdfStudio({
  textEditor = false,
}: {
  textEditor?: boolean;
}) {
  const language = useLanguageStore((s) => s.language),
    th = language === "th";
  const [files, setFiles] = useState<File[]>([]),
    [order, setOrder] = useState<PdfPageEdit[]>([]),
    [selected, setSelected] = useState(0),
    [preview, setPreview] = useState(""),
    [watermark, setWatermark] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [doc, setDoc] = useState<PreviewDocument | null>(null),
    [edits, setEdits] = useState<PdfTextEdit[]>([]),
    [edit, setEdit] = useState<PdfTextEdit>({
      page: 0,
      x: 5,
      y: 5,
      width: 60,
      height: 10,
      text: "",
      size: 16,
    });
  const drag = useRef<number | null>(null);
  const runner = useToolRunner();
  useEffect(() => {
    let disposed = false;
    let loaded: PreviewDocument | undefined;
    setDoc(null);
    setOrder([]);
    setPreview("");
    setEdits([]);
    setError("");
    setLoading(false);
    if (!files[0]) return;
    setLoading(true);
    void pdfPreview(files[0])
      .then(async (d) => {
        loaded = d;
        if (disposed) {
          await d.destroy();
          return;
        }
        setDoc(d);
        setOrder(
          Array.from({ length: d.numPages }, (_, index) => ({
            index,
            rotation: 0,
          })),
        );
        setSelected(0);
      })
      .catch((error) => {
        if (!disposed)
          setError(error instanceof ToolError ? error.code : "pdf");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
      void loaded?.destroy();
    };
  }, [files]);
  const previewRotation = textEditor
    ? 0
    : (order.find((p) => p.index === selected)?.rotation ?? 0);
  useEffect(() => {
    let disposed = false;
    setPreview("");
    if (doc)
      void renderPdfPage(doc, selected + 1, 0.9, previewRotation)
        .then((canvas) => {
          if (!disposed) setPreview(canvas.toDataURL());
        })
        .catch(() => {
          if (!disposed) setError("pdf");
        });
    return () => {
      disposed = true;
    };
  }, [doc, selected, previewRotation]);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
    runner.reset();
  };
  const numbers: [keyof PdfTextEdit, string, string, number, number][] = [
    ["x", "Left (%)", "จากซ้าย (%)", 0, 99],
    ["y", "Top (%)", "จากบน (%)", 0, 99],
    ["width", "Box width (%)", "ความกว้างกล่อง (%)", 0.1, 100],
    ["height", "Box height (%)", "ความสูงกล่อง (%)", 0.1, 100],
    ["size", "Font size (pt)", "ขนาดตัวอักษร (pt)", 4, 200],
  ];
  return (
    <>
      <DropFiles
        files={files}
        onChange={(v) => {
          setFiles(v);
          runner.reset();
        }}
        accept="application/pdf"
        disabled={runner.busy}
      />
      <p className="field-hint">
        {th
          ? "สูงสุด 100 หน้า / 50 MB • ไม่รองรับ PDF ล็อกรหัส • ฟอร์มจะถูกทำให้คงที่ ไม่เก็บลายเซ็นดิจิทัล/บุ๊กมาร์ก"
          : "Up to 100 pages / 50 MB. No encrypted PDFs. Forms are flattened; signatures and bookmarks are not preserved."}
      </p>
      {loading && <p role="status">{th ? "กำลังอ่าน PDF…" : "Loading PDF…"}</p>}
      {error && (
        <p role="alert" className="tool-error">
          {messages[error][language]}
        </p>
      )}
      {order.length > 0 && (
        <>
          <div
            className="pdf-page-list"
            aria-label={th ? "ลำดับหน้า PDF" : "PDF page order"}
          >
            {order.map((p, i) => (
              <div
                className="pdf-page-chip"
                key={p.index}
                draggable={!runner.busy}
                onDragStart={() => {
                  drag.current = i;
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!runner.busy && drag.current !== null)
                    move(drag.current, i);
                  drag.current = null;
                }}
              >
                <button
                  type="button"
                  aria-pressed={selected === p.index}
                  onClick={() => {
                    setSelected(p.index);
                    setEdit({ ...edit, page: p.index });
                  }}
                >
                  {th ? "หน้า" : "Page"} {p.index + 1} · {p.rotation}°
                </button>
                <button
                  disabled={runner.busy || i === 0}
                  aria-label={`Move page ${p.index + 1} up`}
                  onClick={() => move(i, i - 1)}
                >
                  ↑
                </button>
                <button
                  disabled={runner.busy || i === order.length - 1}
                  aria-label={`Move page ${p.index + 1} down`}
                  onClick={() => move(i, i + 1)}
                >
                  ↓
                </button>
                <button
                  disabled={runner.busy}
                  aria-label={`Rotate page ${p.index + 1}`}
                  onClick={() => {
                    setOrder(
                      order.map((v, n) =>
                        n === i
                          ? { ...v, rotation: (v.rotation + 90) % 360 }
                          : v,
                      ),
                    );
                    runner.reset();
                  }}
                >
                  ↻
                </button>
                <button
                  disabled={runner.busy || order.length === 1}
                  aria-label={`Delete page ${p.index + 1}`}
                  onClick={() => {
                    const next = order.filter((_, n) => n !== i);
                    setOrder(next);
                    if (selected === p.index) setSelected(next[0].index);
                    runner.reset();
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {preview && (
            <div className="pdf-preview">
              <img
                src={preview}
                alt={th ? "ภาพตัวอย่างหน้า PDF" : "PDF page preview"}
                onClick={(e) => {
                  if (!textEditor) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = Math.min(
                      95,
                      Math.max(0, ((e.clientX - r.left) / r.width) * 100),
                    ),
                    y = Math.min(
                      95,
                      Math.max(0, ((e.clientY - r.top) / r.height) * 100),
                    );
                  setEdit({
                    ...edit,
                    page: selected,
                    x: Math.round(x),
                    y: Math.round(y),
                    width: Math.min(edit.width, 100 - Math.round(x)),
                    height: Math.min(edit.height, 100 - Math.round(y)),
                  });
                }}
              />
              {textEditor && (
                <div
                  className="pdf-edit-box"
                  style={{
                    left: `${edit.x}%`,
                    top: `${edit.y}%`,
                    width: `${edit.width}%`,
                    height: `${edit.height}%`,
                  }}
                >
                  {edit.text}
                </div>
              )}
            </div>
          )}
          {textEditor && (
            <fieldset className="tool-fields" disabled={runner.busy}>
              <p className="tool-warning">
                {th
                  ? "คลิกภาพเพื่อเลือกตำแหน่ง แล้วกำหนดกล่องสีขาวและข้อความใหม่ (เว้นว่างเพื่อลบ) หน้าที่แก้จะถูกแปลงเป็นภาพ: ข้อความเดิมไม่ซ่อนอยู่ด้านหลัง แต่ไม่สามารถค้นหา/เลือกข้อความทั้งหน้านั้นได้อีก ไม่ใช่การแก้ฟอนต์ต้นฉบับ และไม่ควรใช้แทนเครื่องมือปกปิดข้อมูลลับที่ผ่านการรับรอง"
                  : "Click the preview to position a white replacement box. Leave text empty to erase. Edited pages become images: original page text is removed, but the entire edited page loses text search/selection. Original fonts are not edited. This is not a certified sensitive-data redaction tool."}
              </p>
              <div className="field-row">
                {numbers.map(([key, en, thai, min, max]) => (
                  <label className="field" key={key}>
                    {th ? thai : en}
                    <input
                      type="number"
                      step={0.1}
                      min={min}
                      max={max}
                      value={Number(edit[key])}
                      onChange={(e) =>
                        setEdit({ ...edit, [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="field">
                {th ? "ข้อความแทนที่" : "Replacement text"}
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={edit.text}
                  onChange={(e) => setEdit({ ...edit, text: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setEdits([...edits, { ...edit, page: selected }]);
                  runner.reset();
                }}
                disabled={edits.length >= 100}
              >
                {th ? "เพิ่มการแก้ไขในหน้านี้" : "Add edit to this page"}
              </button>
              <ol>
                {edits.map((e, i) => (
                  <li key={i}>
                    {th ? "หน้า" : "Page"} {e.page + 1}: {e.text || "(erase)"}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setEdits(edits.filter((_, n) => n !== i));
                        runner.reset();
                      }}
                    >
                      {th ? "ลบการแก้ไข" : "Remove edit"}
                    </button>
                  </li>
                ))}
              </ol>
            </fieldset>
          )}
          <form
            onChange={runner.reset}
            onSubmit={(e) => {
              e.preventDefault();
              void runner.run((signal) =>
                editPdf(files[0], order, watermark, edits, signal),
              );
            }}
          >
            <fieldset className="tool-fields" disabled={runner.busy}>
              <label className="field">
                {th
                  ? "ลายน้ำทุกหน้า (เว้นว่างได้)"
                  : "Watermark on every page (optional)"}
                <input
                  maxLength={100}
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                />
              </label>
              <button className="button">
                {th ? "ส่งออก PDF" : "Export PDF"}
              </button>
            </fieldset>
          </form>
        </>
      )}
      <ResultPanel runner={runner} />
    </>
  );
}
