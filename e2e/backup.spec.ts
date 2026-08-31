import { test, expect } from "./auth-fixture.js";
test("backup restore previews, rejects invalid data and preserves counters",async({page})=>{
  await page.addInitScript(()=>localStorage.setItem("nexus-language",JSON.stringify({state:{language:"en"},version:0})));
  await page.goto("/");
  await page.getByRole("button",{name:"Open Invoice Generator",exact:true}).click();
  await page.getByText("Customers, products and document history",{exact:true}).click();
  const upload=page.getByLabel("Restore JSON backup (merge with existing data)");
  await upload.setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from('{"documents":[]}')});
  await expect(page.getByText(/Invalid\/unsupported backup/)).toBeVisible();
  const book={documents:[],customers:["Restored customer"],products:[],seller:"Restored seller",counters:{"INV-2026":12}};
  await upload.setInputFiles({name:"backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(book))});
  expect(await page.evaluate(()=>localStorage.getItem("nexus-tools-document-book"))).toBeNull();
  await page.getByRole("button",{name:"Confirm restore",exact:true}).click();
  await expect(page.getByText("Backup restored without overwriting existing documents.",{exact:true})).toBeVisible();
  await expect(page.getByRole("combobox",{name:"Saved customer",exact:true}).locator("option")).toHaveCount(2);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("nexus-tools-document-book")!).counters["INV-2026"])).toBe(12);
});
