import { beforeEach, expect, test } from "vitest";
import { crc16, promptPayPayload } from "../services/promptPay";
import { readBook, storeDocument, suggestNumber, deleteDocument, saveContacts } from "../services/documentBook";
import { validateInvoice, type Invoice } from "../services/invoice";
const invoice:Invoice={seller:"Nexus",customer:"Customer",number:"INV-2026-0001",date:"2026-08-30",currency:"THB",tax:"7",items:[{description:"Service",quantity:"1",price:"100"}],language:"en"};
beforeEach(()=>localStorage.clear());
test("PromptPay uses phone proxy, fixed THB amount and standard CRC",()=>{
  expect(crc16("123456789")).toBe("29B1");
  const qr=promptPayPayload("081-234-5678",10700);
  expect(qr).toContain("0016A00000067701011101130066812345678");
  expect(qr).toContain("53037645406107.00");
  expect(qr.slice(-4)).toBe(crc16(qr.slice(0,-4)));
  for(const phone of ["123","https://example.com","0212345678"]) expect(()=>promptPayPayload(phone,10700)).toThrow();
  for(const amount of [0,-1,NaN,1.5]) expect(()=>promptPayPayload("0812345678",amount)).toThrow();
});
test("receipt and payment QR require explicit confirmations",()=>{
  expect(()=>validateInvoice({...invoice,kind:"receipt"})).toThrow();
  expect(validateInvoice({...invoice,kind:"receipt",paidConfirmed:true}).total).toBe(10700);
  expect(()=>validateInvoice({...invoice,promptPayPhone:"0812345678"})).toThrow();
  expect(()=>validateInvoice({...invoice,promptPayPhone:"0812345678",promptPayConfirmed:true,currency:"USD"})).toThrow();
});
test("numbering, immutable history, duplicates and contact reuse",async()=>{
  expect(suggestNumber("invoice","2026-08-30")).toBe("INV-2026-0001");
  await storeDocument(invoice); await storeDocument(invoice);
  expect(readBook().documents).toHaveLength(1);
  await expect(storeDocument({...invoice,customer:"Changed"})).rejects.toThrow();
  expect(suggestNumber("invoice",invoice.date)).toBe("INV-2026-0002");
  const book=readBook(); deleteDocument(book.documents[0].id);
  expect(suggestNumber("invoice",invoice.date)).toBe("INV-2026-0002");
  saveContacts(invoice); saveContacts(invoice);
  expect(readBook().customers).toEqual(["Customer"]);expect(readBook().products).toHaveLength(1);
});
test("malformed stored records are ignored without crashing",()=>{
  localStorage.setItem("nexus-tools-document-book",JSON.stringify({documents:[null,{id:"x",savedAt:"today",document:{}}],customers:[null,4,"valid"],products:[null,{}],seller:"a",counters:{bad:4,"INV-2026":-4}}));
  expect(readBook().documents).toEqual([]);expect(readBook().customers).toEqual(["valid"]);
  expect(suggestNumber("invoice","2026-08-30")).toBe("INV-2026-0001");
});
