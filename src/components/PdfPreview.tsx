import { useEffect, useRef, useState } from "react";
import { pdfPreview, renderPdfPage } from "../services/pdfTools";
import { useLanguageStore } from "@/shared/languageStore";
export default function PdfPreview({ blob }: { blob: Blob }) {
  const th = useLanguageStore(s => s.language) === "th";
  const mount = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1), [count, setCount] = useState(0), [error, setError] = useState(false);
  useEffect(() => { setPage(1); }, [blob]);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    const element = mount.current; element?.replaceChildren();
    void (async () => {
      const doc = await pdfPreview(new File([blob], "preview.pdf", { type: "application/pdf" }));
      try {
        if (cancelled) return;
        setCount(doc.numPages);
        const canvas = await renderPdfPage(doc, Math.min(page, doc.numPages), 1);
        if (cancelled) return;
        canvas.style.width = "100%"; canvas.style.height = "auto";
        canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", `PDF ${page}/${doc.numPages}`);
        element?.replaceChildren(canvas);
      } finally { await doc.destroy(); }
    })().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; element?.replaceChildren(); };
  }, [blob, page]);
  return <section aria-label={th ? "พรีวิว PDF" : "PDF preview"}>
    <div className="settings-history"><button type="button" disabled={page <= 1} onClick={() => setPage(page-1)}>{th ? "ก่อนหน้า" : "Previous page"}</button><span>{page} / {count || "…"}</span><button type="button" disabled={page >= count} onClick={() => setPage(page+1)}>{th ? "ถัดไป" : "Next page"}</button></div>
    {error && <p role="alert">{th ? "แสดงพรีวิวไม่ได้ กรุณาสร้างใหม่" : "Preview unavailable. Generate again."}</p>}
    <div ref={mount} style={{ maxWidth: 680, margin: "16px auto" }} />
  </section>;
}
