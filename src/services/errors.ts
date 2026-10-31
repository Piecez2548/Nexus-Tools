export class ToolError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}
export const messages: Record<string, { en: string; th: string }> = {
  storage: { en: "Cannot save locally, or history is full (100). Export a backup and free space.", th: "จัดเก็บไม่ได้หรือประวัติเต็ม (100 เอกสาร) กรุณาสำรองข้อมูลและเพิ่มพื้นที่" },
  duplicate: { en: "This number already belongs to a different document. Use the next document number.", th: "เลขนี้ใช้กับเอกสารอื่นแล้ว กรุณากดใช้เลขเอกสารถัดไป" },
  receipt: { en: "Confirm that payment was received before issuing a receipt.", th: "ยืนยันว่าได้รับเงินแล้วก่อนออกใบเสร็จ" },
  promptpay: { en: "Verify a registered Thai mobile PromptPay number, THB currency and positive amount.", th: "ตรวจเบอร์มือถือพร้อมเพย์ที่ลงทะเบียน ยืนยันผู้รับ เลือก THB และยอดมากกว่า 0" },
  text: { en: "Invalid text format or encoding. Check JSON, URL or UTF-8 Base64 input.", th: "รูปแบบข้อความหรือรหัสไม่ถูกต้อง กรุณาตรวจ JSON, URL หรือ Base64 UTF-8" },
  files: {
    en: "Choose the required files first.",
    th: "กรุณาเลือกไฟล์ให้ครบก่อนเริ่ม",
  },
  size: {
    en: "Files exceed the displayed size or count limit.",
    th: "ไฟล์มีขนาดหรือจำนวนเกินที่กำหนด",
  },
  pdf: {
    en: "Cannot read this PDF. Use an unencrypted, valid PDF file.",
    th: "อ่าน PDF ไม่ได้ กรุณาใช้ไฟล์ PDF ที่สมบูรณ์และไม่ล็อกรหัสผ่าน",
  },
  pages: {
    en: "Enter valid pages, for example 1, 3-5. Pages must be within this PDF.",
    th: "ระบุหน้าให้ถูกต้อง เช่น 1, 3-5 และไม่เกินจำนวนหน้าใน PDF",
  },
  image: {
    en: "Cannot read this image. Choose a valid JPEG, PNG or WebP file.",
    th: "อ่านรูปภาพไม่ได้ กรุณาใช้ไฟล์ JPEG, PNG หรือ WebP ที่สมบูรณ์",
  },
  dimensions: {
    en: "Image is too large. Maximum 24 megapixels; resize it first.",
    th: "รูปภาพใหญ่เกิน 24 ล้านพิกเซล กรุณาลดขนาดก่อน",
  },
  format: {
    en: "This browser does not support the selected output format.",
    th: "เบราว์เซอร์นี้ไม่รองรับรูปแบบไฟล์ที่เลือก",
  },
  qr: {
    en: "Enter text or a link up to 1,000 UTF-8 bytes.",
    th: "กรอกข้อความหรือลิงก์ไม่เกิน 1,000 ไบต์ UTF-8",
  },
  qrread: {
    en: "No QR code found. Use a sharp, well-lit image where the whole code is visible.",
    th: "ไม่พบ QR Code ในรูป ใช้รูปที่คมชัด แสงพอ และเห็น QR ครบทั้งอัน",
  },
  number: {
    en: "Enter a finite number within the allowed range.",
    th: "กรุณากรอกตัวเลขที่ถูกต้องและอยู่ในช่วงที่กำหนด",
  },
  baht: {
    en: "Enter an amount up to 999,999,999,999.99 with at most two decimals.",
    th: "กรอกจำนวนเงินไม่เกิน 999,999,999,999.99 บาท และมีทศนิยมไม่เกิน 2 ตำแหน่ง",
  },
  year: {
    en: "Enter a whole year: 1 to 9999 for C.E., or 544 to 10542 for B.E.",
    th: "กรอกปีเป็นจำนวนเต็ม ค.ศ. 1–9999 หรือ พ.ศ. 544–10542",
  },
  date: {
    en: "Choose a real date from 1 January 1941 (B.E. 2484) onward.",
    th: "เลือกวันที่ที่มีอยู่จริง ตั้งแต่ 1 มกราคม ค.ศ. 1941 (พ.ศ. 2484) เป็นต้นไป",
  },
  tax: {
    en: "Enter an amount above 0 (up to 10,000,000,000 baht, two decimals) and a rate from 0 to 100.",
    th: "กรอกจำนวนเงินมากกว่า 0 ไม่เกิน 10,000,000,000 บาท ทศนิยมไม่เกิน 2 ตำแหน่ง และอัตราภาษี 0–100",
  },
  temperature: {
    en: "Temperature cannot be below absolute zero.",
    th: "อุณหภูมิต้องไม่ต่ำกว่าศูนย์สัมบูรณ์",
  },
  invoice: {
    en: "Fill in seller, customer, invoice number, date and item descriptions. Check quantities, prices and tax.",
    th: "กรอกผู้ขาย ลูกค้า เลขที่เอกสาร วันที่ และรายการสินค้า พร้อมตรวจจำนวน ราคา และภาษี",
  },
  failed: {
    en: "Processing failed. Try a smaller file or another browser.",
    th: "ประมวลผลไม่สำเร็จ ลองไฟล์ขนาดเล็กลงหรือเบราว์เซอร์อื่น",
  },
};

