import {
  Blocks,
  Files,
  Scissors,
  ImageDown,
  Image,
  ArrowLeftRight,
  Calculator,
  BriefcaseBusiness,
  TextCursorInput,
  QrCode,
  ReceiptText,
  ScanText,
} from "lucide-react";
import type { Language } from "@/shared/languageStore";

export type Copy = { en: string; th: string };
export const copy = (en: string, th: string): Copy => ({ en, th });
export const categories = [
  {
    id: "all",
    name: copy("All tools", "ทั้งหมด"),
    icon: Blocks,
    color: "lime",
  },
  {
    id: "pdf",
    name: copy("PDF Tools", "เครื่องมือ PDF"),
    icon: Files,
    color: "coral",
  },
  {
    id: "image",
    name: copy("Image Tools", "เครื่องมือรูปภาพ"),
    icon: Image,
    color: "blue",
  },
  {
    id: "convert",
    name: copy("Converters", "แปลงข้อมูล"),
    icon: ArrowLeftRight,
    color: "amber",
  },
  {
    id: "calculate",
    name: copy("Calculators", "คำนวณ"),
    icon: Calculator,
    color: "green",
  },
  {
    id: "professional",
    name: copy("Professional", "งานธุรกิจ"),
    icon: BriefcaseBusiness,
    color: "purple",
  },
  {
    id: "text",
    name: copy("Text Tools", "เครื่องมือข้อความ"),
    icon: TextCursorInput,
    color: "rose",
  },
] as const;
export type CategoryId = (typeof categories)[number]["id"];
export const toolCatalog = [
  {
    id: "merge-pdf",
    category: "pdf",
    icon: Files,
    name: copy("Merge PDF", "รวมไฟล์ PDF"),
    description: copy(
      "Bring multiple PDFs together in one document.",
      "รวมเอกสาร PDF หลายไฟล์เป็นไฟล์เดียว",
    ),
  },
  {
    id: "split-pdf",
    category: "pdf",
    icon: Scissors,
    name: copy("Split PDF", "แยกหน้า PDF"),
    description: copy(
      "Extract exactly the pages you need.",
      "เลือกและแยกเฉพาะหน้าที่ต้องการ",
    ),
  },
  {
    id: "compress-image",
    category: "image",
    icon: ImageDown,
    name: copy("Image Compressor", "ย่อขนาดรูปภาพ"),
    description: copy(
      "Smaller images, with quality in your control.",
      "ลดขนาดไฟล์ พร้อมปรับคุณภาพด้วยตัวเอง",
    ),
  },
  {
    id: "convert-image",
    category: "image",
    icon: Image,
    name: copy("Image Converter", "แปลงไฟล์รูปภาพ"),
    description: copy(
      "Switch between PNG, JPEG and WebP.",
      "แปลงไฟล์ระหว่าง PNG, JPEG และ WebP",
    ),
  },
  {
    id: "qr-code",
    category: "convert",
    icon: QrCode,
    name: copy("QR Code Generator", "สร้าง QR Code"),
    description: copy(
      "Turn a link or text into a shareable code.",
      "เปลี่ยนลิงก์หรือข้อความเป็น QR Code",
    ),
  },
  {
    id: "unit-converter",
    category: "calculate",
    icon: ArrowLeftRight,
    name: copy("Unit Converter", "แปลงหน่วย"),
    description: copy(
      "Length, weight and temperature, simplified.",
      "แปลงหน่วยความยาว น้ำหนัก และอุณหภูมิ",
    ),
  },
  {
    id: "invoice",
    category: "professional",
    icon: ReceiptText,
    name: copy("Invoice Generator", "สร้างใบแจ้งหนี้"),
    description: copy(
      "Prepare a clear, print-ready invoice.",
      "จัดทำใบแจ้งหนี้ พร้อมพิมพ์หรือบันทึก PDF",
    ),
  },
  {
    id: "word-counter",
    category: "text",
    icon: ScanText,
    name: copy("Word Counter", "นับคำและตัวอักษร"),
    description: copy(
      "A little clarity for everything you write.",
      "นับคำ ตัวอักษร และย่อหน้าของข้อความ",
    ),
  },
] as const;
export type Tool = (typeof toolCatalog)[number];
export type ToolId = Tool["id"];
export function filterTools(
  query: string,
  category: CategoryId,
  favorites: string[],
  favoritesOnly: boolean,
  sort: string,
  language: Language,
) {
  const term = query.trim().toLocaleLowerCase();
  const tools = toolCatalog.filter(
    (tool) =>
      (category === "all" || tool.category === category) &&
      (!favoritesOnly || favorites.includes(tool.id)) &&
      `${tool.name.en} ${tool.name.th} ${tool.description.en} ${tool.description.th} ${tool.category}`
        .toLocaleLowerCase()
        .includes(term),
  );
  return sort === "az"
    ? [...tools].sort((a, b) =>
        a.name[language].localeCompare(b.name[language], language),
      )
    : tools;
}

