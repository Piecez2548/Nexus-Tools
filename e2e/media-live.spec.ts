import {test,expect} from "./auth-fixture.js";
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
    const videoBytes=await page.evaluate(async()=>{
      const canvas=document.createElement("canvas");canvas.width=160;canvas.height=120;
      const ctx=canvas.getContext("2d")!;const stream=canvas.captureStream(10);
      const recorder=new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp8"});const chunks:Blob[]=[];
      recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise<void>(resolve=>{recorder.onstop=()=>resolve();});
      recorder.start();for(let i=0;i<5;i++){ctx.fillStyle=i%2?"green":"blue";ctx.fillRect(0,0,160,120);await new Promise(resolve=>setTimeout(resolve,100));}
      recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    });
    await page.getByRole("combobox",{name:"QR type",exact:true}).selectOption("video");
    await page.getByLabel("Choose media to upload").setInputFiles({name:"smoke.webm",mimeType:"video/webm",buffer:Buffer.from(videoBytes)});
    await page.getByRole("button",{name:"Upload and use link",exact:true}).click();
    const videoInput=page.getByRole("textbox",{name:"Video sharing link (HTTPS)",exact:true});await expect(videoInput).toHaveValue(/\?media=/,{timeout:60000});
    const videoLink=await videoInput.inputValue();ids.push(new URL(videoLink).searchParams.get("media")!);
    const videoViewer=await page.context().newPage();await videoViewer.goto(videoLink);
    await expect.poll(()=>videoViewer.locator("video").evaluate(e=>(e as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(1);
    await page.getByRole("button",{name:"List stored media",exact:true}).click();
    await expect(page.getByText(id.slice(6,18),{exact:false})).toBeVisible();
    const removed=await request.delete(`/api/manage-media?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});expect(removed.status()).toBe(200);
    expect((await request.get(`/api/media?id=${encodeURIComponent(id)}`)).status()).toBe(404);
    await viewer.reload();await expect(viewer.getByRole("alert")).toBeVisible();
  } finally {for(const id of ids)await request.delete(`/api/manage-media?id=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`}});}
});
