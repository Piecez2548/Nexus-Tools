import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLanguageStore } from "@/shared/languageStore";
import { invoiceTotals, type InvoiceItem } from "../services/calculations";
import { createInvoice } from "../services/invoice";
import { useToolRunner } from "../hooks/useToolRunner";
import ResultPanel from "./ResultPanel";
export default function InvoiceTool() {
  const { language } = useLanguageStore();
  const t = (en: string, th: string) => (language === "th" ? th : en);
  const runner = useToolRunner();
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
          void runner.run(() =>
            createInvoice({
              seller,
              customer,
              number,
              date,
              currency,
              tax,
              items,
              language,
            }),
          );
        }}
      >
        <fieldset disabled={runner.busy} className="tool-fields">
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
              "Creates a printable HTML invoice. Open the download and print to PDF. This is not a certified tax invoice; no invoice data is saved by the app.",
              "สร้างใบแจ้งหนี้ HTML เปิดไฟล์ที่ดาวน์โหลดแล้วพิมพ์เป็น PDF เอกสารนี้ไม่ใช่ใบกำกับภาษีที่ได้รับการรับรอง และแอปไม่บันทึกข้อมูลใบแจ้งหนี้",
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

