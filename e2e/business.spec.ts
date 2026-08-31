import { test, expect } from "./auth-fixture.js";
import { readFile } from "node:fs/promises";
import jsQR from "jsqr";
const decodeQR = jsQR as unknown as (data:Uint8ClampedArray,w:number,h:number)=>{data:string}|null;
test("preview, contacts, quotation-to-invoice-to-receipt and readable PromptPay QR",async({page},info)=>{
  // Four PDF renders plus QR pixel decoding take longer on Linux WebKit CI.
  // Keep every output assertion; allow the entire multi-document workflow to finish.
  test.setTimeout(120_000);
  await page.addInitScript(()=>localStorage.setItem("nexus-language",JSON.stringify({state:{language:"en"},version:0})));
  await page.goto("/");
  await page.getByRole("button",{name:"Open Invoice Generator",exact:true}).click();
  await page.getByRole("combobox",{name:"Document type",exact:true}).selectOption("quotation");
  await page.getByLabel("Seller / business").fill("บริษัท เน็กซัส จำกัด");
  await page.getByLabel("Customer",{exact:true}).fill("คุณสมชาย");
  await page.getByLabel("Date",{exact:true}).fill("2026-08-30");
  await page.getByLabel("Description 1").fill("บริการออกแบบเว็บไซต์");
  await page.getByLabel("Unit price").fill("100");
  await page.getByLabel("Invoice watermark (optional)").fill("สำเนา — สำหรับลูกค้าเท่านั้น");
  await page.getByRole("button",{name:"Preview document",exact:true}).click();
  await expect(page.getByRole("img",{name:"PDF 1/1",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem("nexus-tools-document-book"))).toBeNull();
  await expect(page.getByRole("link",{name:/Download quotation/})).toHaveCount(0);
  let pending=page.waitForEvent("download");
  await page.getByRole("button",{name:"Create quotation",exact:true}).click();
  const quotation=await pending;expect(quotation.suggestedFilename()).toMatch(/^quotation-QUO-/);await quotation.saveAs(info.outputPath("quotation.pdf"));
  await page.getByText("Customers, products and document history",{exact:true}).click();
  await page.getByRole("button",{name:"Save contacts and products",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"Saved customer",exact:true}).locator("option")).toHaveCount(2);
  await page.getByRole("button",{name:"Copy as invoice",exact:true}).click();
  await expect(page.getByRole("combobox",{name:"Document type",exact:true})).toHaveValue("invoice");
  await page.getByLabel("PromptPay phone (optional, THB only)").fill("0812345678");
  await page.getByRole("checkbox",{name:/I verified this registered PromptPay/}).check();
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Create invoice",exact:true}).click();
  const invoice=await pending;await invoice.saveAs(info.outputPath("invoice-promptpay.pdf"));
  const preview=page.getByRole("region",{name:"PDF preview",exact:true});
  let decoded:string|null=null;
  for(let i=0;i<4;i++){
    const canvas=preview.locator("canvas");await expect(canvas).toBeVisible();
    const pixels=await canvas.evaluate(element=>{const c=element as HTMLCanvasElement;const ctx=c.getContext("2d")!;return{width:c.width,height:c.height,data:Array.from(ctx.getImageData(0,0,c.width,c.height).data)};});
    decoded=decodeQR(new Uint8ClampedArray(pixels.data),pixels.width,pixels.height)?.data??null;
    if(decoded)break;
    const next=preview.getByRole("button",{name:"Next page",exact:true});if(await next.isDisabled())break;await next.click();
  }
  expect(decoded).toContain("0066812345678");expect(decoded).toContain("5406100.00");
  await page.getByRole("button",{name:"Copy as receipt",exact:true}).first().click();
  await page.getByRole("button",{name:"Create receipt",exact:true}).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("checkbox",{name:/I verified that payment has been received/}).check();
  await page.getByRole("checkbox",{name:/I verified this registered PromptPay/}).check();
  pending=page.waitForEvent("download");await page.getByRole("button",{name:"Create receipt",exact:true}).click();
  const receipt=await pending;expect((await readFile((await receipt.path())!)).subarray(0,5).toString()).toBe("%PDF-");await receipt.saveAs(info.outputPath("receipt.pdf"));
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("nexus-tools-document-book")!).documents.length)).toBe(3);
});
