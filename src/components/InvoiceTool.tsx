import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { invoiceTotals, type InvoiceItem } from "../services/calculations";
import { createInvoicePdf } from "../services/invoicePdf";
import { downloadFile } from "@/shared/download";
import { useToolRunner } from "../hooks/useToolRunner";
import ResultPanel from "./ResultPanel";
import { readDraft, saveLocal, removeLocal } from "../services/localData";
import { prepareLogo } from "../services/logo";
export default function InvoiceTool() {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const runner = useToolRunner();
  const logoController = useRef<AbortController | null>(null);
  useEffect(() => () => logoController.current?.abort(), []);
  const [watermark, setWatermark] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [logo, setLogo] = useState(""),
    [draftMessage, setDraftMessage] = useState("");

  const [seller, setSeller] = useState(""),
    [customer, setCustomer] = useState(""),
    [number, setNumber] = useState("INV-001");
  const [date, setDate] = useState(""),
    [currency, setCurrency] = useState("THB"),
    [tax, setTax] = useState("0");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: "1", price: "0" },
  ]);
  const totals = useMemo(() => {
    try {
      return invoiceTotals(items, tax);
    } catch {
      return null;
    }
  }, [items, tax]);
  const updateItem = (index: number, key: keyof InvoiceItem, value: string) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
    runner.reset();
  };
  return (
    <>
      <form
        onChange={runner.reset}
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run(async (signal) => {
            const result = await createInvoicePdf({
              logo,
              watermark,
              seller,
              customer,
              number,
              date,
              currency,
              tax,
              items,
              language,
            }, signal);
            if (!signal.aborted) downloadFile(result.filename, result.blob, "application/pdf");
            return result;
          });
        }}
      >
        <fieldset disabled={runner.busy || logoBusy} className="tool-fields">
          <div className="settings-history">
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                const ok = saveLocal("invoice-draft", {
                  seller,
                  customer,
                  number,
                  date,
                  currency,
                  tax,
                  items,
                  language,
                  logo,
              watermark,
                });
                setDraftMessage(
                  ok
                    ? t(
                        "Draft saved on this device.",
                        "บันทึกแบบร่างบนอุปกรณ์แล้ว",
                      )
                    : t("Storage unavailable.", "พื้นที่จัดเก็บไม่พร้อม"),
                );
              }}
            >
              {t("Save draft", "บันทึกแบบร่าง")}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                const v = readDraft();
                if (!v) {
                  setDraftMessage(
                    t("No valid saved draft.", "ไม่มีแบบร่างที่ใช้ได้"),
                  );
                  return;
                }
                setSeller(v.seller);
                setCustomer(v.customer);
                setNumber(v.number);
                setDate(v.date);
                setCurrency(v.currency);
                setTax(v.tax);
                setItems(v.items);
                setLogo(v.logo ?? "");
                setWatermark(v.watermark ?? "");
                runner.reset();
                setDraftMessage(t("Draft restored.", "เรียกคืนแบบร่างแล้ว"));
              }}
            >
              {t("Load draft / reuse items", "โหลดแบบร่าง / ใช้รายการเดิม")}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setDraftMessage(
                  removeLocal("invoice-draft")
                    ? t("Saved draft deleted.", "ลบแบบร่างที่บันทึกแล้ว")
                    : t("Storage unavailable.", "พื้นที่จัดเก็บไม่พร้อม"),
                );
              }}
            >
              {t("Delete saved draft", "ลบแบบร่างที่บันทึก")}
            </button>
          </div>
          <p role="status">{draftMessage}</p>
          <label className="field">
            {t("Business logo (optional)", "โลโก้ธุรกิจ (ไม่บังคับ)")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                logoController.current?.abort();
                const current = new AbortController();
                logoController.current = current;
                setLogoBusy(true);
                try {
                  const url = await prepareLogo(file, current.signal);
                  if (current.signal.aborted) return;
                  setLogo(url);
                  runner.reset();
                } catch {
                  if (current.signal.aborted) return;
                  setDraftMessage(
                    t(
                      "Cannot load logo. Use a smaller valid image.",
                      "อ่านโลโก้ไม่ได้ ลองภาพที่มีขนาดเล็กลง",
                    ),
                  );
                } finally {
                  if (!current.signal.aborted) setLogoBusy(false);
                }
              }}
            />
          </label>
          {logo && (
            <div>
              <img
                src={logo}
                alt={t("Invoice logo", "โลโก้ใบแจ้งหนี้")}
                style={{ maxWidth: 180, maxHeight: 100 }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setLogo("");
                  runner.reset();
                }}
              >
                {t("Remove logo", "ลบโลโก้")}
              </button>
            </div>
          )}
          <div className="field-row">
            <label className="field">
              {t("Seller / business", "ผู้ขาย / ธุรกิจ")}
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={seller}
                onChange={(event) => setSeller(event.target.value)}
              />
            </label>
            <label className="field">
              {t("Customer", "ลูกค้า")}
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              {t("Invoice number", "เลขที่เอกสาร")}
              <input
                required
                maxLength={100}
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
            </label>
            <label className="field">
              {t("Date", "วันที่")}
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <div className="invoice-items">
            {items.map((item, index) => (
              <div className="invoice-item" key={index}>
                <label className="field">
                  {t("Description", "รายการ")} {index + 1}
                  <input
                    required
                    maxLength={500}
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  {t("Qty", "จำนวน")}
                  <input
                    required
                    type="number"
                    min={1}
                    max={100000}
                    step={1}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  {t("Unit price", "ราคาต่อหน่วย")}
                  <input
                    required
                    type="number"
                    min={0}
                    max={10000000}
                    step={0.01}
                    value={item.price}
                    onChange={(event) =>
                      updateItem(index, "price", event.target.value)
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={items.length === 1}
                  className="icon-button"
                  aria-label={`${t("Remove item", "ลบรายการ")} ${index + 1}`}
                  onClick={() => {
                    setItems(items.filter((_, i) => i !== index));
                    runner.reset();
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button secondary"
            disabled={items.length >= 30}
            onClick={() => {
              setItems([
                ...items,
                { description: "", quantity: "1", price: "0" },
              ]);
              runner.reset();
            }}
          >
            <Plus size={16} />
            {t("Add item", "เพิ่มรายการ")}
          </button>
          <div className="field-row">
            <label className="field">
              {t("Currency", "สกุลเงิน")}
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option>THB</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </label>
            <label className="field">
              {t("Tax (%)", "ภาษี (%)")}
              <input
                required
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={tax}
                onChange={(event) => setTax(event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            {t("Invoice watermark (optional)", "ลายน้ำใบแจ้งหนี้ (ไม่บังคับ)")}
            <input maxLength={100} value={watermark} placeholder={t("COPY / For this customer only", "สำเนา / ใช้สำหรับลูกค้ารายนี้เท่านั้น")} onChange={(event) => setWatermark(event.target.value)} />
          </label>
          <p className="field-hint">{t("A faint diagonal watermark appears on every PDF page. Leave empty to omit. It identifies the document but does not encrypt it or prevent editing.", "ลายน้ำพาดเฉียงจาง 18% ทุกหน้า PDF เว้นว่างเพื่อไม่ใส่ลายน้ำ ช่วยระบุการใช้งานเอกสาร แต่ไม่ใช่การเข้ารหัสหรือป้องกันการแก้ไข")}</p>
          <div className="invoice-total" aria-live="polite">
            <span>{t("Total including tax", "รวมสุทธิหลังภาษี")}</span>
            <strong>
              {totals
                ? new Intl.NumberFormat(language, {
                    style: "currency",
                    currency,
                  }).format(totals.total / 100)
                : "—"}
            </strong>
          </div>
          <p className="field-hint">
            {t(
              "Downloads an A4 PDF directly, without a print dialog. Text is rendered as high-resolution images to preserve Thai appearance. This is not a certified tax invoice; invoice data is stored only when you choose Save draft. It remains on this device until you delete it.",
              "ดาวน์โหลดใบแจ้งหนี้ PDF ขนาด A4 โดยตรง ไม่ต้องสั่งพิมพ์ ข้อความเป็นภาพความละเอียดสูงเพื่อรักษารูปแบบภาษาไทย เอกสารนี้ไม่ใช่ใบกำกับภาษีที่ได้รับการรับรอง ข้อมูลจะบันทึกบนอุปกรณ์เฉพาะเมื่อกดบันทึกแบบร่าง และคงอยู่จนกว่าจะลบ",
            )}
          </p>
          <button className="button" type="submit">
            {t("Create invoice", "สร้างใบแจ้งหนี้")}
          </button>
        </fieldset>
      </form>
      <ResultPanel runner={runner} />
    </>
  );
}
