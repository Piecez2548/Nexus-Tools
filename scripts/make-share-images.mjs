// One-off: renders the social preview image and the app icons into public/.
// Run with `node scripts/make-share-images.mjs` after changing the artwork.
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const icon = readFileSync("public/favicon.svg", "utf8");
const card = `<html><body style="margin:0;width:1200px;height:630px;background:#151718;color:#f4f5f1;font-family:'Leelawadee UI',Tahoma,'Segoe UI',sans-serif;display:flex;align-items:center;gap:56px;padding:0 90px;box-sizing:border-box">
<div style="width:220px;height:220px;flex:none">${icon.replace("<svg ", '<svg width="220" height="220" ')}</div>
<div><div style="font-size:92px;font-weight:700;letter-spacing:-2px;line-height:1">Nexus Tools</div>
<div style="font-size:38px;margin-top:26px;color:#c3e88a">เครื่องมือ PDF รูปภาพ QR และงานเอกสาร</div>
<div style="font-size:28px;margin-top:18px;color:#a9aeab">ประมวลผลในเบราว์เซอร์ของคุณ</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(card);
await page.screenshot({ path: "public/og-image.png" });
for (const [size, name] of [[192, "icon-192.png"], [512, "icon-512.png"], [180, "apple-touch-icon.png"]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0">${icon.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: `public/${name}` });
}
await browser.close();
