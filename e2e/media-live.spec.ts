import {test,expect} from "@playwright/test";
import {toBuffer} from "qrcode";
test.use({trace:"off"});
test("live private media upload, sharing, range and revocation",async({page,request})=>{
  test.skip(!process.env.MEDIA_ADMIN_KEY,"Manual production smoke test needs administrator credentials");
  test.setTimeout(120000);
  const key=process.env.MEDIA_ADMIN_KEY!;
  const ids:string[]=[];
  try {
    expect((await request.get("/api/manage-media")).status()).toBe(401);
    await page.addInitScript(()=>localStorage.setItem("nexus-language",JSON.stringify({state:{language:"en"},version:0})));
    await page.goto("/");
    await page.getByRole("button",{name:"Open QR Code Generator",exact:true}).click();
    await page.getByRole("combobox",{name:"QR type",exact:true}).selectOption("image");
    await page.getByText("Upload and manage Nexus media",{exact:true}).click();
    await page.getByLabel("Media administrator key (not saved)").fill(key);
    const png=await toBuffer("Nexus media smoke test");
    await page.getByLabel("Choose media to upload").setInputFiles({name:"smoke.png",mimeType:"image/png",buffer:png});
    await page.getByRole("button",{name:"Upload and use link",exact:true}).click();
    const input=page.getByRole("textbox",{name:"Image sharing link (HTTPS)",exact:true});
    await expect(input).toHaveValue(/\?media=/,{timeout:60000});
    const link=await input.inputValue();const id=new URL(link).searchParams.get("media")!;ids.push(id);
    const media=await request.get(`/api/media?id=${encodeURIComponent(id)}`);expect(media.status()).toBe(200);expect(await media.body()).toEqual(png);
    const ranged=await request.get(`/api/media?id=${encodeURIComponent(id)}`,{headers:{Range:"bytes=0-15"}});expect(ranged.status()).toBe(206);expect((await ranged.body()).length).toBe(16);
    const viewer=await page.context().newPage();await viewer.goto(link);await expect(viewer.getByRole("img")).toBeVisible();expect(await viewer.getByRole("img").evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.getByRole("button",{name:"List stored media",exact:true}).click();
    await expect(page.getByText(id.slice(6,18),{exact:false})).toBeVisible();
    const removed=await request.delete(`/api/manage-media?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});expect(removed.status()).toBe(200);
    expect((await request.get(`/api/media?id=${encodeURIComponent(id)}`)).status()).toBe(404);
    await viewer.reload();await expect(viewer.getByRole("alert")).toBeVisible();
  } finally {for(const id of ids)await request.delete(`/api/manage-media?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});}
});
