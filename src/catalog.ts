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
      "Create quotations, invoices and receipts with PDF preview and local history.",
      "ใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จ พร้อมพรีวิว PDF และประวัติ",
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
  {
    id: "pdf-studio",
    category: "pdf",
    icon: Files,
    name: copy("PDF Page Manager", "จัดการหน้า PDF"),
    description: copy(
      "Preview, reorder, rotate, delete and watermark pages.",
      "ดูตัวอย่าง จัดเรียง หมุน ลบหน้า และใส่ลายน้ำ",
    ),
  },
  {
    id: "pdf-text",
    category: "pdf",
    icon: TextCursorInput,
    name: copy("PDF Text Replacement", "แทนที่ข้อความ PDF"),
    description: copy(
      "Replace a region with text; edited pages become images.",
      "แทนที่บริเวณข้อความ โดยแปลงหน้าที่แก้เป็นภาพ",
    ),
  },
  {
    id: "images-pdf",
    category: "pdf",
    icon: Image,
    name: copy("Images to PDF", "รูปภาพเป็น PDF"),
    description: copy(
      "Combine photos into ordered A4 pages.",
      "รวมรูปภาพเป็น PDF ขนาด A4 ตามลำดับ",
    ),
  },
  {
    id: "image-studio",
    category: "image",
    icon: Image,
    name: copy("Image Crop & Watermark", "ครอปภาพและใส่ลายน้ำ"),
    description: copy(
      "Crop, resize and add a text watermark.",
      "ครอป ปรับขนาด และใส่ลายน้ำข้อความ",
    ),
  },
  {
    id: "batch-images",
    category: "image",
    icon: ImageDown,
    name: copy("Batch Images & ZIP", "จัดการรูปเป็นชุดและ ZIP"),
    description: copy(
      "Convert and resize multiple images into one ZIP.",
      "แปลงและปรับขนาดหลายรูปพร้อมดาวน์โหลด ZIP",
    ),
  },
  {
    id: "remove-background",
    category: "image",
    icon: Scissors,
    name: copy("Solid Background Remover", "ลบพื้นหลังสีเรียบ"),
    description: copy(
      "Remove edge-connected background color to transparent PNG.",
      "ลบสีพื้นหลังที่ติดขอบภาพเป็น PNG โปร่งใส",
    ),
  },
  {
    id: "ocr",
    category: "professional",
    icon: ScanText,
    name: copy("OCR \u2014 Thai & English", "OCR อ่านไทยและอังกฤษ"),
    description: copy(
      "Extract text from images or scanned PDFs on your device.",
      "อ่านข้อความจากรูปหรือ PDF สแกนบนอุปกรณ์ของคุณ",
    ),
  },
  {
    id: "text-studio",
    category: "text",
    icon: TextCursorInput,
    name: copy("Text Utilities", "จัดการข้อความ"),
    description: copy(
      "Change case, clean spaces, remove duplicates and compare.",
      "เปลี่ยนตัวพิมพ์ ล้างช่องว่าง ลบซ้ำ และเปรียบเทียบ",
    ),
  },
  {
    id: "developer-tools",
    category: "convert",
    icon: Blocks,
    name: copy("Developer Utilities", "เครื่องมือนักพัฒนา"),
    description: copy(
      "JSON formatting, URL and UTF-8 Base64 encoding.",
      "จัดรูปแบบ JSON และเข้ารหัส URL / Base64 UTF-8",
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
