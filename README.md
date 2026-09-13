# Nexus Tools

[![Live Demo](https://img.shields.io/badge/demo-live-7c3aed)](https://nexus-tools-chi.vercel.app/)
[![CI](https://github.com/Piecez2548/Nexus-Tools/actions/workflows/ci.yml/badge.svg)](https://github.com/Piecez2548/Nexus-Tools/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)

Production-ready bilingual web workspace for PDF, image, OCR, QR, text, and business-document workflows. It combines client-side file processing with authenticated cloud sync, protected media delivery, responsive accessibility, and automated cross-browser release checks.

เว็บรวมเครื่องมือสำหรับ PDF รูปภาพ OCR ข้อความ QR Code และเอกสารธุรกิจ รองรับภาษาไทยและอังกฤษ พร้อมระบบบัญชี ซิงก์ข้อมูล ธีมสว่าง/มืด การค้นหา หมวดหมู่ รายการโปรด และประวัติการใช้งานล่าสุด

- **Live demo:** [nexus-tools-chi.vercel.app](https://nexus-tools-chi.vercel.app/)
- **Source code:** [github.com/Piecez2548/Nexus-Tools](https://github.com/Piecez2548/Nexus-Tools)
- **โปรเจกต์ Vercel:** `nexus-tools` แยกจากโปรเจกต์ `nexus`
- **อัปเดตเอกสาร:** 13 กันยายน 2026

## Portfolio highlights

- 17 practical tools with lazy-loaded workspaces to keep the initial interface lightweight
- Direct A4 PDF generation for quotations, invoices, and receipts with Thai text, watermarks, logos, signatures, tax, and PromptPay QR
- Browser-local PDF/image/OCR processing with explicit limits, validation, recoverable errors, and no upload for ordinary tools
- Supabase authentication with email verification and MFA enforcement, plus a nonce-bound cross-origin session handoff from Nexus
- Private Vercel Blob storage for cloud books and expiring media, protected by server-side identity checks, ETag conflict control, and scoped access cookies
- CI covering TypeScript builds, ESLint, dependency audit/SBOM, unit/API tests, accessibility, performance budgets, and Chromium/Firefox/WebKit workflows

## Tech stack

`React 19` · `TypeScript` · `Vite` · `Zustand` · `Supabase Auth` · `Vercel Functions/Blob` · `pdf-lib` · `PDF.js` · `Tesseract.js` · `Playwright` · `Vitest`

> This repository is published for portfolio review. No open-source license is granted; all rights are reserved by the author.

> Performance regression checks run separately from the functional browser matrix via `npx playwright test --config=e2e/performance.config.ts` (Chromium, one worker). CI runs both groups locally and against production so CPU/network throttling does not compete with functional tests.

> เครื่องมือทั่วไปประมวลผลไฟล์ในเบราว์เซอร์ ส่วน **อัปโหลดสื่อ Nexus** และ **ซิงก์ข้อมูลธุรกิจ** จะส่งข้อมูลไป private Vercel Blob เมื่อผู้ใช้ยืนยัน เลือกสิทธิ์สื่อและวันหมดอายุก่อนแชร์ ข้อมูลคลาวด์ไม่ได้เข้ารหัสแบบ end-to-end

## ฟังก์ชันที่มีแล้ว

รายการในหน้าเว็บมี 17 เครื่องมือ โดยเครื่องมือเอกสารธุรกิจรองรับเอกสาร 3 ประเภทในฟอร์มเดียว

| เครื่องมือ | การทำงาน | ข้อจำกัดหลัก |
| --- | --- | --- |
| รวมไฟล์ PDF | เรียงลำดับและรวมหลายไฟล์ | 2–20 ไฟล์ รวมไม่เกิน 50 MB / 500 หน้า |
| แยกหน้า PDF | เลือกช่วงหน้า เช่น `3, 1-2` และดาวน์โหลด PDF ใหม่ | 1 ไฟล์ ไม่เกิน 50 MB / 500 หน้า |
| ย่อขนาดรูปภาพ | ปรับคุณภาพและความกว้างของ JPEG, PNG, WebP | 20 MB / 24 ล้านพิกเซลต่อรูป; PNG ไม่ใช้ค่าคุณภาพ |
| แปลงไฟล์รูปภาพ | แปลงระหว่าง JPEG, PNG และ WebP | ไม่ขยายเกินต้นฉบับ; JPEG ใช้พื้นขาวแทนความโปร่งใส |
| สร้าง QR Code | ข้อความ ลิงก์ รูปภาพ วิดีโอ Wi-Fi อีเมล โทรศัพท์ และ vCard | ข้อมูลใน QR ไม่เกิน 1,000 UTF-8 bytes; ส่งออก PNG/SVG |
| แปลงหน่วย | ความยาว น้ำหนัก และอุณหภูมิ | ตรวจค่าตัวเลขและอุณหภูมิต่ำกว่าศูนย์สัมบูรณ์ |
| สร้างใบแจ้งหนี้ | ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ พรีวิว PDF ลายน้ำ และ PromptPay | ไม่เกิน 30 รายการ; THB/USD/EUR; จำนวนเต็มและราคาสูงสุด 2 ตำแหน่งทศนิยม |
| นับคำและตัวอักษร | นับคำ UTF-16 units ตัวอักษรที่มองเห็น ย่อหน้า และ UTF-8 bytes | ข้อความไม่เกิน 100,000 UTF-16 units |
| จัดการหน้า PDF | พรีวิว เรียงลำดับ หมุน ลบหน้า และใส่ลายน้ำ | 1 ไฟล์ ไม่เกิน 50 MB / 100 หน้า; ต้องเหลืออย่างน้อย 1 หน้า |
| แทนที่ข้อความ PDF | ปิดบริเวณที่เลือกด้วยพื้นขาวและใส่ข้อความใหม่ | หน้าที่แก้ไขกลายเป็นภาพ; ไม่ใช่การแก้ฟอนต์เดิมหรือการปกปิดข้อมูลที่รับรองความปลอดภัย |
| รูปภาพเป็น PDF | เรียงรูปและรวมเป็น PDF ขนาด A4 | ไม่เกิน 20 รูป / รวม 50 MB; ต่อรูปไม่เกิน 20 MB / 24 ล้านพิกเซล |
| ครอปภาพและใส่ลายน้ำ | ครอป ปรับขนาด และใส่ลายน้ำแนวทแยง | JPEG/PNG/WebP; จำกัดตามขนาดต้นฉบับและไม่ขยายเกินต้นฉบับ |
| จัดการรูปเป็นชุดและ ZIP | แปลง ปรับขนาด ครอป และใส่ลายน้ำหลายรูป | ไม่เกิน 20 รูป / รวม 50 MB; ผลลัพธ์ก่อนบีบอัด ZIP ไม่เกิน 100 MB |
| ลบพื้นหลังสีเรียบ | ลบสีพื้นหลังที่เชื่อมต่อกับขอบภาพเป็น PNG โปร่งใส | เหมาะกับพื้นหลังสีเรียบ ไม่ใช่ AI แยกคนหรือเส้นผม |
| OCR อ่านไทยและอังกฤษ | อ่านรูป/PDF สแกน พร้อมเทียบต้นฉบับและแก้ข้อความ | ไม่เกิน 20 MB / PDF 10 หน้า; ต้องตรวจทานผลลัพธ์ |
| จัดการข้อความ | เปลี่ยนตัวพิมพ์ จัดช่องว่าง ลบบรรทัดซ้ำ และเทียบข้อความ | ไม่เกิน 100,000 UTF-16 units; เทียบบรรทัดตามตำแหน่ง |
| เครื่องมือนักพัฒนา | จัดรูปแบบ JSON และแปลง URL/Base64 UTF-8 | ไม่เกิน 100,000 UTF-16 units; JSON ใช้ความแม่นยำตัวเลขของ JavaScript |

ไฟล์ PDF ที่มีรหัสผ่านหรือการป้องกันจะถูกปฏิเสธ การส่งออก PDF ไม่รับประกันการคงบุ๊กมาร์ก ลายเซ็นดิจิทัล หรือฟอร์มโต้ตอบ ส่วนรูปภาพที่แปลงแล้วไม่คงภาพเคลื่อนไหว/metadata และขนาดไฟล์อาจไม่เล็กลงเสมอไป

## เอกสารธุรกิจ

เปิดเครื่องมือ **สร้างใบแจ้งหนี้** แล้วเลือกประเภทเอกสารที่ต้องการ

1. กรอกผู้ขาย ลูกค้า เลขที่ วันที่ และรายการสินค้า/บริการ
2. เพิ่มรูปหรือโลโก้ โครงการ/แพ็กเกจ ช่องทางชำระเงิน หมายเหตุ และชื่อผู้ลงนามได้
3. ใส่ข้อความลายน้ำหากต้องการ ลายน้ำปรากฏบนทุกหน้า
4. กด **พรีวิวก่อนดาวน์โหลด** เพื่อตรวจเอกสารโดยยังไม่บันทึกประวัติ
5. กดสร้างเอกสารเพื่อบันทึกประวัติและดาวน์โหลด PDF โดยตรง ไม่ต้องเปิดคำสั่งพิมพ์

เอกสารใช้ธีมทางการ **ขาว–กรมท่า–เทา ไม่มีขอบเหลือง** รูปส่วนหัวรักษาสัดส่วน ไม่ครอป และมีกรอบขนาดสูงสุด 340 × 204 พิกเซลบนแคนวาสที่ใช้สร้าง PDF เส้นคั่นขยับตามความสูงรูปพร้อมระยะห่างอย่างน้อย 28 พิกเซล การปรับธีม/ขนาดรูปมีผลกับ PDF ที่สร้างใหม่ ไม่เปลี่ยนไฟล์ที่ดาวน์โหลดไปแล้ว

### สมุดข้อมูลและประวัติ

- บันทึกผู้ขาย ลูกค้า และสินค้าเพื่อนำกลับมาใช้ได้ โดยต้องกดบันทึกสมุดข้อมูลเอง
- รองรับประวัติ 100 เอกสาร ลูกค้า 100 รายการ และสินค้า 200 รายการ ทั้งนี้ยังขึ้นกับพื้นที่จัดเก็บของเบราว์เซอร์
- เลขอัตโนมัติใช้รูปแบบ `QUO-2026-0001`, `INV-2026-0001` และ `REC-2026-0001` แยกตามประเภทและปี
- ระบบไม่ยอมเขียนทับประวัติเดิมด้วยข้อมูลต่างกันแต่ใช้เลขเดียวกัน
- เปิดเอกสารเดิมหรือคัดลอกเป็นประเภทอื่นได้ พร้อมเลขอ้างอิงเอกสารต้นทาง
- ลบประวัติ/สมุดข้อมูลได้จากเครื่องมือ และส่งออกสำรองเป็น JSON ได้ กู้คืน JSON รุ่นเดิมและรุ่น 1 ได้ (ไม่เกิน 10 MB) โดยแสดงจำนวนก่อนยืนยันรวมข้อมูล ไม่ทับเอกสารที่เลขซ้ำแต่เนื้อหาต่างกัน
- ข้อมูลหลักอยู่ใน `localStorage` ของเบราว์เซอร์และโดเมนที่ใช้งาน ซิงก์ข้ามเครื่องได้เมื่อเข้าสู่บัญชี Nexus และกดยืนยันซิงก์ การล้างข้อมูลเว็บไซต์อาจทำให้ประวัติหาย ควรเก็บทั้งไฟล์ PDF และ JSON สำรอง
- เลขเอกสารไม่ได้ใช้ฐานข้อมูลกลางร่วมกันระหว่างเครื่อง หลีกเลี่ยงการออกเลขชุดเดียวกันจากหลายอุปกรณ์

### ใบเสร็จและ PromptPay

ใบเสร็จต้องให้ผู้ใช้งานยืนยันว่าได้รับเงินจริงแล้ว เป็นการบันทึกด้วยตนเอง ไม่ใช่ผลยืนยันจากธนาคาร และเอกสารที่สร้าง **ไม่ใช่ใบกำกับภาษีอิเล็กทรอนิกส์ที่ได้รับการรับรอง**

PromptPay รองรับเบอร์มือถือไทยที่ลงทะเบียนและยอดชำระเป็น THB เท่านั้น QR จะระบุยอดรวมของเอกสาร ผู้จ่ายต้องตรวจชื่อผู้รับและยอดในแอปธนาคารก่อนโอน เว็บไซต์ไม่ตรวจเจ้าของบัญชีหรือสถานะการชำระเงิน โค้ดอ้างอิง [มาตรฐาน Thai QR Code ของธนาคารแห่งประเทศไทย](https://www.bot.or.th/content/dam/bot/documents/th/our-roles/payment-systems/about-payment-systems/ThaiQRCode_Payment_Standard.pdf)

ข้อความภาษาไทยใน PDF ถูกจัดรูปโดยเบราว์เซอร์แล้วฝังเป็นภาพความละเอียดสูง จึงไม่สามารถเลือกหรือค้นหาข้อความใน PDF ได้ ลายน้ำเป็นเครื่องหมายที่มองเห็น ไม่ใช่การเข้ารหัสหรือการป้องกันแก้ไขเอกสาร

## QR สำหรับรูปภาพและวิดีโอ

เปิด **สร้าง QR Code** แล้วเลือก **รูปภาพ** หรือ **วิดีโอ** มีสองวิธีใช้งาน

| วิธี | ที่เก็บสื่อ | ผู้กำหนดสิทธิ์ |
| --- | --- | --- |
| วางลิงก์ HTTPS จากบริการภายนอก | บริการต้นทาง เช่น Drive หรือ YouTube | ตั้งสิทธิ์ที่บริการต้นทาง; Nexus ไม่ตรวจว่าสื่อเปิดได้จริง |
| อัปโหลดสื่อ Nexus | Private Vercel Blob ของโปรเจกต์ | ต้องใช้รหัสผู้ดูแลเพื่ออัปโหลด/จัดการ; เลือกผู้มีลิงก์หรือเฉพาะบัญชีเจ้าของ และวันหมดอายุ 1–365 วัน |

สำหรับการอัปโหลด Nexus:

1. เปิดส่วน **อัปโหลดและจัดการสื่อ Nexus** แล้วกรอกรหัสผู้ดูแลสื่อ
2. เลือก JPEG/PNG/WebP หรือ MP4/WebM ขนาดไม่เกิน 50 MB ต่อไฟล์
3. เลือกสิทธิ์และอายุลิงก์ (ค่าเริ่มต้น 7 วัน) ถ้าเลือกเฉพาะเจ้าของ ให้เข้าสู่บัญชี Nexus ก่อน จากนั้นอัปโหลดและสร้าง QR
4. ทดลองเปิดลิงก์หรือสแกน QR ก่อนแจกให้ผู้อื่น การดูสื่อต้องใช้อินเทอร์เน็ต และวิดีโออาจต้องกดเล่น
5. ใช้ปุ่มแสดงสื่อที่จัดเก็บเพื่อเปิดดู ใช้ลิงก์เดิม หรือลบไฟล์

QR เก็บ **ลิงก์** ไม่ได้บรรจุไฟล์ภาพ/วิดีโอไว้ภายใน ลิงก์ Nexus ใช้ ID สุ่ม 256 บิต โหมดผู้มีลิงก์ส่งต่อได้ ส่วนโหมดเฉพาะเจ้าของต้องเข้าสู่บัญชีเดิมและยืนยัน MFA (ถ้าเปิดไว้) API ออก cookie อายุไม่เกิน 15 นาที เป็น HttpOnly/Secure/SameSite=Strict ผูกกับไฟล์และเจ้าของ

ไฟล์อยู่จนกว่าผู้ดูแลจะลบ แต่ API ปิดการเปิดลิงก์ใหม่ทันทีเมื่อหมดอายุ สื่อรุ่น `media/v2/` ไม่มี metadata จะปฏิเสธการเข้าถึง ลิงก์รุ่นเดิมยังใช้สิทธิ์เดิมและไม่มีวันหมดอายุ การลบทำให้คำขอเปิดไฟล์ใหม่ใช้ไม่ได้ แต่เรียกคืนสำเนาที่ดาวน์โหลดไปแล้วหรือหยุดการรับส่งข้อมูลที่เริ่มไปแล้วไม่ได้ พื้นที่และปริมาณรับส่งข้อมูลอยู่ภายใต้โควตาของ Vercel

## บัญชี Nexus และการซิงก์

- ตั้ง `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ให้ตรง Nexus หลัก ทั้งตอน build และ Vercel server environment ค่านี้เป็น public project configuration ไม่ใช่ service-role key
- Tools บังคับล็อกอินก่อนเปิดเครื่องมือ สมัครสมาชิกและยืนยันอีเมลด้วย OTP ใน Tools ได้โดยตรง ใช้บัญชีเดียวกับ Nexus All และยืนยัน TOTP ถ้าเปิด MFA ไว้ การกู้คืนรหัสผ่านยังทำที่ Nexus หลัก
- ไม่มีการอัปโหลดสมุดข้อมูลจากการเข้าสู่ระบบเพียงอย่างเดียว กดยืนยันซิงก์เพื่อรวมข้อมูลและเก็บตัวนับเลขสูงสุด ไม่ส่งแบบร่างและค่าตั้งอื่น
- API ตรวจ access token กับ Supabase และบังคับ aal2 สำหรับผู้เปิด MFA เก็บหนังสือใน `books/<verified-user-id>.json` แบบ private จำกัด payload 3 MB ข้อมูลนี้ **ไม่ได้เข้ารหัส end-to-end**
- การบันทึกใช้ ETag/If-Match ป้องกันการทับการแก้ไขของอีกเครื่อง หากเลขเอกสารซ้ำแต่เนื้อหาต่างกันจะหยุดให้แก้ความขัดแย้ง ไม่เลือกทับเอง การซิงก์แบบรวมอาจนำเอกสารที่ลบเฉพาะเครื่องกลับมา ไม่มี tombstone ซิงก์การลบ
- ใช้ **จองเลขเอกสารบนคลาวด์** ในฟอร์มธุรกิจเพื่อซิงก์และจองเลขแบบ atomic ก่อนสร้าง เอกสารที่ยกเลิกอาจทิ้งช่องว่างเลขไว้ เลขที่พิมพ์เองหรือใช้ตัวนับในเครื่องยังอาจชนกับอีกเครื่อง
- ออกจากระบบแล้วข้อมูลธุรกิจเดิมยังอยู่ในเบราว์เซอร์ โปรดสำรอง/ลบก่อนส่งเครื่องให้ผู้อื่น การซิงก์จะถามยืนยันบัญชีปลายทางทุกครั้ง
- เปิด Tools ด้วยการคลิกปกติจาก Nexus All / เมนู Nexus จะรับเซสชันผ่าน postMessage ตรวจ origin, หน้าต่างต้นทาง และ nonce สุ่มแบบใช้ครั้งเดียว แล้วตรวจบัญชีกับ Supabase อีกครั้ง ไม่ส่ง token ผ่าน URL และตัด opener เมื่อจบ หาก popup ถูกบล็อกหรือหมดเวลาให้ล็อกอินใน Tools โดยตรง
- SSO รองรับเฉพาะโดเมน production ของ Nexus และ Tools ที่กำหนดใน services/sso.ts และ Nexus features/sync/toolsSession.ts ไม่รับต้นทางจาก query parameter ต้องปรับทั้งคู่เมื่อเปลี่ยนโดเมน
- การออกจาก Tools ซ่อนเครื่องมือทันที แต่ไม่ออกจากบัญชี Nexus All และไม่ลบข้อมูลธุรกิจในเครื่อง ลิงก์สื่อที่แชร์ยังใช้สิทธิ์และวันหมดอายุเดิม
- บัญชี Nexus ที่ยืนยัน MFA ด้วย backup code อย่างเดียว ต้องยืนยัน TOTP ใน Tools ให้ได้ aal2 ก่อน ไม่ลดระดับการตรวจสอบความปลอดภัย
- ชุดทดสอบล็อกอินใช้การจำลองคำตอบ Supabase ในเบราว์เซอร์ ไม่มีรหัสลัดข้ามล็อกอินใน production และไม่ได้ใช้บัญชีลูกค้าจริง

## OCR และการนับตัวอักษร

OCR รองรับภาษาไทย อังกฤษ หรือทั้งสองภาษา มีการเตรียมภาพ ขยายแบบจำกัดขนาด แปลงระดับสี และตรวจพื้นหลังเข้ม ผู้ใช้เลือกพื้นหลังหรือครอปพื้นที่เป็นเปอร์เซ็นต์เองได้ สำหรับ PDF พื้นที่ครอปเดียวกันจะใช้กับทุกหน้า

หลังอ่านไฟล์ สามารถเทียบรูป/PDF ต้นฉบับกับข้อความ แก้ไขข้อความ ดาวน์โหลดฉบับที่แก้แล้ว หรือคืนข้อความดิบได้ ตัวเลือกจัดช่องว่างภาษาไทยอาจลบช่องว่างที่ตั้งใจเว้นไว้ และไม่ได้แก้คำสะกด

ชื่อบุคคล ตัวเลข วรรณยุกต์ ลายมือ ภาพไม่ชัด และภาพติดลายน้ำยังต้องตรวจทาน OCR ไม่สามารถอ่านส่วนที่อยู่นอกภาพหรือถูกตัดออกจากภาพหน้าจอได้

ตัวนับข้อความรวมช่องว่างด้วย โดยแยก UTF-16 units ออกจากตัวอักษรที่มองเห็น (grapheme clusters) สระ/วรรณยุกต์และ emoji จึงอาจทำให้สองจำนวนนี้ต่างกัน เบราว์เซอร์ปรับการขึ้นบรรทัดเป็น LF ควรใช้ข้อความและรูปแบบขึ้นบรรทัดเดียวกันเมื่อตรวจเทียบกับโปรแกรมอื่น

## เทคโนโลยีและโครงสร้าง

ใช้ React 19, TypeScript และ Vite สำหรับหน้าเว็บ, Zustand สำหรับสถานะที่บันทึกในเครื่อง, PDF.js / pdf-lib สำหรับ PDF, Tesseract.js สำหรับ OCR, qrcode สำหรับ QR และ fflate สำหรับ ZIP ส่วนแชร์สื่อใช้ Vercel Functions และ `@vercel/blob`

```text
Nexus-Tools/
├── api/                     # API อัปโหลด เปิดสื่อ และจัดการสื่อ
├── server/mediaPolicy.ts    # ตรวจรหัสผู้ดูแล ชนิดไฟล์ และ path
├── src/
│   ├── main.tsx             # จุดเริ่มต้นและหน้าสื่อที่แชร์
│   ├── ToolsApp.tsx         # หน้ารวมเครื่องมือ
│   ├── catalog.ts          # รายการเครื่องมือและหมวดหมู่
│   ├── store.ts            # การตั้งค่า/รายการโปรด/เครื่องมือล่าสุด
│   ├── components/         # ฟอร์มและการแสดงผล
│   ├── services/           # ประมวลผล ตรวจข้อมูล และสร้างไฟล์
│   ├── hooks/              # งานประมวลผล การยกเลิก และข้อผิดพลาด
│   ├── shared/             # ภาษา ดาวน์โหลด และส่วนที่ใช้ร่วมกัน
│   └── tests/              # Unit และ API tests
├── e2e/                    # ทดสอบหน้าเว็บด้วย Playwright
├── scripts/                # เตรียม assets และ deploy
├── .github/workflows/ci.yml
├── package.json
├── vercel.json
└── README.md
```

Business logic อยู่ใน `services/` และนโยบาย API อยู่ใน `server/` ฟอร์มเรียกใช้บริการเดิมผ่าน components/hooks ใช้ Supabase Auth โปรเจกต์เดียวกับ Nexus แต่ไม่แตะฐานข้อมูลธุรกิจ/ระบบเข้ารหัส/service worker ของ Nexus หลัก หนังสือธุรกิจบนคลาวด์อยู่ใน private Vercel Blob แยกตาม user ID ที่เซิร์ฟเวอร์ตรวจแล้ว

การรวม/แยก PDF ใช้ Web Worker พร้อม timeout 2 นาที PDF.js มี worker สำหรับพรีวิว และ OCR รองรับการยกเลิกพร้อม timeout 3 นาที

## ติดตั้งและรันในเครื่อง

ใช้ **Node.js 22** ให้ตรงกับ CI พร้อม npm และ Git ผู้ clone ต้องมีสิทธิ์เข้าถึง repository แบบ Private

```powershell
git clone https://github.com/Piecez2548/Nexus-Tools.git
Set-Location Nexus-Tools
npm ci
npm run dev
```

เปิด `http://127.0.0.1:5174/` สำหรับพัฒนา ถ้ามีโฟลเดอร์เดิมแล้ว ให้เข้าโฟลเดอร์นั้นและเริ่มจาก `npm ci` ไม่ต้อง clone ซ้ำ

`npm run dev` และ `npm run preview` ให้บริการ frontend เท่านั้น การอัปโหลดสื่อ ซิงก์ และจองเลขบนคลาวด์ต้องใช้ Vercel deployment หรือ `vercel dev` พร้อม environment ที่ตั้งค่าแล้ว

```powershell
npm run build
npm run preview
```

พรีวิว build อยู่ที่ `http://127.0.0.1:4174/` และไฟล์สำหรับเผยแพร่อยู่ใน `dist/`

`predev` และ `prebuild` เรียก `scripts/prepare-assets.mjs` เพื่อคัดลอก worker, WASM, โมเดล OCR ไทย/อังกฤษ และไฟล์สนับสนุน PDF.js จาก dependencies ไปยัง `public/ocr/` และ `public/pdfjs/` โดยไม่ commit assets ที่สร้างขึ้นเหล่านี้ โมเดลภาษาจะดาวน์โหลดจากเว็บไซต์เมื่อใช้งานครั้งแรกและอาจถูก cache ในเบราว์เซอร์ จึงไม่รับประกันว่าการใช้ครั้งแรกจะทำงานแบบออฟไลน์

> `npm run dev` และ `npm run preview` รันเฉพาะส่วนหน้าเว็บ ไม่ได้รัน Vercel Functions เครื่องมือทั่วไปไม่ต้องมี secret แต่การทดสอบ API ต้องใช้ Vercel deployment หรือ `vercel dev` ที่ตั้งค่า environment ไว้ ส่วนลิงก์แชร์สื่อสำหรับสร้าง QR ต้องเป็น HTTPS และเข้าถึงได้จากอุปกรณ์ผู้สแกน

## Environment และรหัสผู้ดูแล

| ชื่อ | ใช้ที่ไหน | หน้าที่ |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Functions | เข้าถึง Private Blob store |
| `MEDIA_ADMIN_KEY` | Vercel Functions | ตรวจสิทธิ์อัปโหลด แสดงรายการ และลบสื่อ; ใช้รหัสสุ่มที่มีความยาวอย่างน้อย 32 ตัวอักษร |
| `VERCEL_TOKEN` | GitHub Actions Secret | เผยแพร่โปรเจกต์ `nexus-tools` |
| `PRODUCTION_DEPLOY_ENABLED` | GitHub Actions Variable | ตั้งเป็น `true` เพื่ออนุญาต job เผยแพร่หลัง validation ผ่าน |
| `TOOLS_BASE_URL` | Playwright | เปลี่ยนจากพรีวิวในเครื่องไปทดสอบ URL ที่กำหนด |

Store ที่ตั้งค่าไว้สำหรับโปรเจกต์คือ `nexus-tools-media` แบบ Private ใน region `sin1` ให้เชื่อม store และตัวแปรฝั่ง server กับ environment ที่ใช้งาน ก่อนทดสอบอัปโหลด

ห้ามใส่ secret ใน source code, README, log หรือชื่อตัวแปรที่ขึ้นต้นด้วย `VITE_` เพราะค่าฝั่ง client อาจถูกฝังใน JavaScript ที่ส่งให้ผู้ใช้ โฟลเดอร์ `.vercel/`, ไฟล์ `.env*` และ `.media-admin-key` ถูก ignore ไว้

เครื่องที่ตั้งค่าระบบเดิมเก็บรหัสผู้ดูแลไว้ใน `.media-admin-key` ไฟล์นี้ไม่ได้อยู่ใน Git และจะไม่ติดไปกับการ clone หน้าเว็บเก็บรหัสที่กรอกไว้ในหน่วยความจำของ component เท่านั้น ปิดเครื่องมือหรือกดล้างรหัสเพื่อเอาออก ไม่บันทึกใน `localStorage`

ถ้ารหัสรั่วไหล ให้เปลี่ยน `MEDIA_ADMIN_KEY` บน Vercel และ deploy ใหม่ token อัปโหลดที่ออกก่อนเปลี่ยนรหัสมีอายุไม่เกิน 5 นาที ส่วนรหัสเข้า Blob และ deployment token ต้องดูแล/หมุนเวียนแยกกัน ไม่ควรนำรหัส production ไปใช้ใน environment ทดสอบทั่วไป

ตามบันทึกการตั้งค่าเมื่อ 30 สิงหาคม 2026 deployment token เดิมกำหนดหมดอายุ **26 กุมภาพันธ์ 2027** ให้ตรวจและเปลี่ยน GitHub Secret ก่อนวันหมดอายุ หากเปลี่ยน token แล้วควรปรับบันทึกนี้ให้ตรงกัน

## การทดสอบ

```powershell
npm run lint
npm run build
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
```

`npm run build` เรียก `tsc -b` ก่อน Vite จึงตรวจ TypeScript ด้วย ต้อง build ใหม่ก่อน E2E เพราะชุดทดสอบใช้ไฟล์ใน `dist/` Playwright จะเปิด preview server ให้อัตโนมัติหากไม่ได้กำหนด `TOOLS_BASE_URL`

ชุดทดสอบมี 46 unit/hook/API tests และ 60 กรณีเบราว์เซอร์ใน 5 โปรไฟล์ รวมกรณีกู้คืนข้อมูล สิทธิ์บัญชี MFA วันหมดอายุ cookie และการจองเลขพร้อมกัน รวมทั้ง browser workflows บน Chromium, Firefox และ WebKit ครอบคลุมไฟล์ PDF/รูป/ZIP, QR, เอกสารธุรกิจ, การอ่าน QR จาก PDF, ข้อมูลในเครื่อง, OCR, การยกเลิกงาน, keyboard focus และหน้าจอมือถือ นอกจากนี้มี live media test อีก 1 รายการที่ถูกข้ามเมื่อไม่มี `MEDIA_ADMIN_KEY`

ผู้ดูแลที่ต้องการทดสอบการอัปโหลด/เปิดวิดีโอ/ลบสื่อจริง ต้องเตรียม `MEDIA_ADMIN_KEY` ใน environment ของ process อย่างปลอดภัยก่อน แล้วระบุเว็บไซต์เป้าหมาย:

```powershell
$env:TOOLS_BASE_URL = 'https://nexus-tools-chi.vercel.app'
npx playwright test e2e/media-live.spec.ts
Remove-Item Env:TOOLS_BASE_URL
Remove-Item Env:MEDIA_ADMIN_KEY -ErrorAction SilentlyContinue
```

live media test อัปโหลดไฟล์ตัวอย่างและพยายามลบใน `finally` หลังจบควรตรวจว่าไม่มีไฟล์ตัวอย่างค้างอยู่ ไม่เปิด trace สำหรับ test นี้ และไม่ส่งรหัสผู้ดูแลสื่อเข้า CI ปกติ คำสั่งข้างต้นจะถูกข้ามหากไม่ได้เตรียมรหัสไว้

ใช้ `npm audit` เพื่อตรวจรายงานช่องโหว่ของ dependencies ณ เวลาที่รัน การทดสอบผ่านไม่ได้รับประกันว่าจะไม่มีข้อผิดพลาดบนทุกอุปกรณ์หรือทุกไฟล์

## การเผยแพร่

ใช้ [GitHub Actions workflow](.github/workflows/ci.yml) เป็นเส้นทางหลัก:

1. Pull request และ push เข้า `main` รันติดตั้ง dependencies, ESLint, TypeScript/build, unit tests และ Chromium/Firefox/WebKit E2E รวมเคสมือถือที่เกี่ยวข้อง
2. เมื่อ validation ผ่านบน `main` และ `PRODUCTION_DEPLOY_ENABLED=true` จึงเริ่ม deployment
3. Job ใช้ Vercel CLI `59.10.0` กับ `VERCEL_TOKEN` เพื่อ deploy commit เดียวกับที่ตรวจแล้ว
4. หลัง deploy รัน browser workflows บน production อีกครั้ง; live media test ยังคงข้ามเพราะไม่มีรหัสผู้ดูแลสื่อ

Deployments ของ branch เดียวกันเรียงคิว ไม่ยกเลิกงานเดิมอัตโนมัติ Workflow เก็บ trace เมื่อ browser test ล้มเหลวไว้ 7 วัน และ **ไม่ rollback deployment อัตโนมัติ** หากการตรวจ production ล้มเหลว ให้ตรวจข้อผิดพลาดและคืนเวอร์ชันที่ทราบว่าใช้งานได้เมื่อจำเป็น

โปรเจกต์ใช้ GitHub Actions ควบคุม deployment ไม่ใช้ Vercel Git auto-deployment แยกอีกทาง หลีกเลี่ยงการเปลี่ยนเป็น `vercel pull`/prebuilt โดยไม่ตรวจสิทธิ์ เพราะ deployment token ที่จำกัดเฉพาะโปรเจกต์อาจไม่มีสิทธิ์ค้นข้อมูลระดับทีม

สำหรับเครื่องใหม่ที่ต้อง deploy ด้วยตนเอง:

```powershell
npx vercel link
# เลือกโปรเจกต์ nexus-tools เท่านั้น
npm run deploy
```

สคริปต์ตรวจชื่อใน `.vercel/project.json` และปฏิเสธหากไม่ใช่ `nexus-tools` คำสั่งนี้ข้าม validation ของ CI จึงควรใช้ workflow ปกติเป็นหลัก และห้าม link ไปยังโปรเจกต์ Nexus หลัก

## ข้อมูล ความเป็นส่วนตัว และข้อจำกัด

| ข้อมูล | ที่จัดเก็บ / การส่งออก |
| --- | --- |
| ไฟล์ที่ประมวลผลด้วย PDF, รูปภาพ และ OCR ทั่วไป | ประมวลผลในเบราว์เซอร์ ไม่ส่งไปยังบริการประมวลผลไฟล์ |
| ภาษา ธีม รายการโปรด และเครื่องมือล่าสุด | เบราว์เซอร์/โดเมนนี้ |
| แบบร่างและค่าตั้งเครื่องมือ | เบราว์เซอร์/โดเมนนี้ |
| สมุดลูกค้า สินค้า ประวัติและตัวนับเลขเอกสาร | ในเครื่อง; ส่งสำเนาขึ้น private Blob เฉพาะเมื่อยืนยันซิงก์/จองเลขผ่านบัญชี Nexus |
| เซสชันบัญชี Nexus | Supabase Auth และ localStorage ของโดเมน Tools; ออกจากระบบแล้วข้อมูลธุรกิจในเครื่องยังอยู่ |
| ไฟล์ที่ดาวน์โหลดแล้ว | ตำแหน่งดาวน์โหลดที่ผู้ใช้หรือเบราว์เซอร์เลือก |
| สื่อที่อัปโหลดผ่าน Nexus | Private Vercel Blob; API ตรวจวันหมดอายุและสิทธิ์ก่อนส่งไฟล์ |
| สื่อที่วางเป็นลิงก์ภายนอก | บริการเจ้าของลิงก์และสิทธิ์ที่ตั้งไว้ที่บริการนั้น |

API ตรวจรหัสผู้ดูแลก่อนออก token อัปโหลด โดยจำกัด path ชนิดไฟล์ ขนาด และอายุ token ไม่อนุญาต HTML/SVG การอ่านสื่อใช้ `no-store` รองรับ HTTP Range สำหรับวิดีโอ และตรวจรูปแบบ path ก่อนเข้าถึง store การป้องกันนี้ไม่เท่ากับระบบสมาชิกหรือการรับรองความปลอดภัยของเนื้อหาที่อัปโหลด

หากพบปัญหา:

- **PDF ยังเป็นรูปแบบเก่า:** รีเฟรชเว็บไซต์และสร้าง PDF ใหม่ ไฟล์ที่ดาวน์โหลดไว้ไม่เปลี่ยนตาม deployment
- **บันทึกเอกสารไม่ได้:** ตรวจเลขซ้ำ จำนวนประวัติ และพื้นที่จัดเก็บของเบราว์เซอร์ สำรองก่อนลบข้อมูล
- **OCR ผิดหรือขาดข้อความ:** เลือกภาษา/พื้นหลังให้ตรง ครอปเฉพาะเนื้อหา และตรวจว่าภาพมีข้อความครบ ใช้หน้าตรวจแก้ก่อนดาวน์โหลด
- **อัปโหลดสื่อไม่ได้:** ตรวจรหัส ชนิด/ขนาดไฟล์ การเชื่อมต่อ และ environment ของ Vercel ถ้าแก้ SDK หรือ CSP ต้องตรวจ endpoint อัปโหลดจริงด้วย
- **QR เปิดสื่อไม่ได้:** ตรวจลิงก์ สิทธิ์บริการต้นทาง การลบไฟล์ และการเข้าถึงอินเทอร์เน็ต

## งานที่ยังไม่รองรับ

รายการต่อไปนี้มีสถานะ **Planned** ไม่มีการรับรองวันเสร็จ:

- แชร์สื่อแบบรายชื่อผู้รับหลายบัญชี (ปัจจุบันมีผู้มีลิงก์/เจ้าของเท่านั้น)
- ลบไฟล์หมดอายุออกจาก storage อัตโนมัติ (ปัจจุบันปิดสิทธิ์เปิดแล้ว แต่ผู้ดูแลต้องลบไฟล์เอง)
- ซิงก์อัตโนมัติและ single logout ระหว่างทุกโดเมน
- ตรวจการชำระเงินกับธนาคารอัตโนมัติ
- ลบพื้นหลังซับซ้อนด้วย AI และแก้โครงสร้างข้อความ/ฟอนต์ PDF แบบ native
- Semantic text diff และการทดสอบบน Safari/iPhone เครื่องจริง (มี WebKit และ viewport จำลองแล้ว)
- Branch protection ตามนโยบาย repository

## การดูแล dependencies

ใช้ `package-lock.json` และ `npm ci` เพื่อให้ติดตั้งตรงกัน ทดสอบ build, unit tests และ E2E หลังปรับ dependencies ที่เกี่ยวกับไฟล์/worker/API

PDF.js และ Tesseract.js ใช้ Apache-2.0 ส่วนแพ็กเกจข้อมูลภาษาที่ใช้อยู่ระบุ MIT สคริปต์เตรียม assets คัดลอกประกาศสิทธิ์ไปกับ runtime assets ให้เก็บประกาศเหล่านี้ไว้เมื่อนำไฟล์ไปเผยแพร่ต่อ สิทธิ์ของ dependency แต่ละรายการเป็นไปตาม license ของแพ็กเกจนั้น

### Shared Nexus theme (2026-08-31)

All Tools surfaces, including authentication and shared media, inherit `src/nexusTheme.css`. This file and the Manrope/Noto Sans Thai fonts are vendored from the sibling Nexus application. Run `node scripts/sync-theme.mjs` to update them or append `--check` to detect drift. Keep layout in `tools.css` and use shared tokens for new UI. Preferences remain local between independent visits; a verified Main session handoff now carries Dark/Light/System/Mono to Tools. This synchronizes on launch, not continuously between tabs. Semantic category/status colors and document previews retain their meaning.

### Current access policy (2026-09-01)

Tools local PDF/image/QR/document utilities render immediately without login, including direct visits and account-verification failures. Optional account initialization and secure SSO remain. Verified identity and enrolled MFA protect cloud functions and private APIs, not the public catalogue. Signing out leaves local utilities and documents available; no cloud data is uploaded automatically. Main/All sign-in and Main PIN remain independent. Historical central-entry redirects below are superseded. Deployment/validation evidence is in the Main repository's `docs/AUDIT_REMEDIATION_2026-09-01.md`.

### Historical central sign-in at Nexus All (2026-08-31; superseded)

Tools no longer renders a separate sign-in page at its entry. It first attempts the existing secure Nexus opener handoff and validates the account/MFA. A verified session opens Tools immediately without a Main PIN. Direct visits without a session redirect to `https://nexus-lemon-eight-32.vercel.app/projects`; after signing in, launch Tools from All. Verification failures stay closed and offer a link to All. Existing valid sessions may be reused, and explicit public media-sharing links remain unchanged. A URL marker or referrer never grants access. This change has not been deployed.

### Neutral palette production release (2026-08-31)

Deployed as `dpl_9J4khd2MVsxRdKDNzdD2FEuQpQk1` to https://nexus-tools-chi.vercel.app. This release includes the shared neutral charcoal palette and the previously local central sign-in behavior. It supersedes earlier not-deployed notes. Build, TypeScript, ESLint, 52 unit tests and 10 theme/auth browser cases passed; a clean production browser was redirected to All on anonymous entry.

### Formal workspace changes — deployed 2026-08-31

Shared action dimensions, larger metadata, minimum 44px controls, and lazy per-tool modules. ToolWorkspace shell is now approximately 3.9 kB minified instead of the previous 515 kB combined module; feature/vendor payloads still load when required. Accessibility regression checks use axe-core in the local mocked-auth fixture.

Current production: `dpl_HGpCihcZJ959BW2kBwQzumRyicmR` at https://nexus-tools-chi.vercel.app. The shared nested-modal hook now closes only the top overlay. Root TypeScript lib/target matches the ES2023 app/server configs for Vercel function compilation. Final cloud build has no TS2550 errors.


Black–purple palette deployed 2026-08-31: `dpl_B9XR9t56jitVRGA51uv9HoTWxhPn` (READY). Shared canonical tokens remain synchronized with Main/All; semantic category colors are preserved. Build/TypeScript, ESLint, 53 unit tests and 7 theme/accessibility browser tests passed.
