import { describe, it, expect, beforeEach } from "vitest";
import { transformText, qrPayload } from "./textTools";
import { clearBackground } from "./imageTools";
import { readDraft, saveLocal, removeLocal } from "./localData";
describe("text and QR data integrity", () => {
  it("round trips Thai and emoji through UTF-8 Base64 and URL encoding", () => {
    const text = "สวัสดี 🌿 & + /";
    expect(
      transformText(transformText(text, "base64-encode"), "base64-decode"),
    ).toBe(text);
    expect(transformText(transformText(text, "url-encode"), "url-decode")).toBe(
      text,
    );
  });
  it("rejects invalid encodings and malformed JSON", () => {
    expect(() => transformText("%%%", "base64-decode")).toThrow("text");
    expect(() => transformText("%E0%A4", "url-decode")).toThrow("text");
    expect(() => transformText("{oops}", "json")).toThrow("text");
  });
  it("preserves distinct lines and cleans whitespace without merging lines", () => {
    expect(transformText(" A   B \n C ", "trim")).toBe("A B\nC");
    expect(transformText("a\nb\na\nA", "dedupe")).toBe("a\nb\nA");
    expect(transformText("a\nb", "compare", "a\nc")).toContain(
      "− 2: b\n+ 2: c",
    );
  });
  it("creates media links without permitting local files or executable URLs", () => {
    expect(qrPayload("image", { url: " https://example.com/photo.png?key=abc#view " })).toBe("https://example.com/photo.png?key=abc#view");
    expect(qrPayload("video", { url: "https://example.com/watch?v=123" })).toBe("https://example.com/watch?v=123");
    for (const url of ["", "file:///C:/photo.png", "blob:https://example.com/id", "data:image/png;base64,abc", "javascript:alert(1)", "http://example.com", "https://user:pass@example.com", "https://example.com/a\nb"]) {
      expect(() => qrPayload("image", { url })).toThrow("qr");
    }
  });
  it("escapes QR field delimiters to prevent injected fields", () => {
    expect(
      qrPayload("wifi", {
        name: "office;H:true",
        password: "a:b\\c",
        security: "WPA",
      }),
    ).toBe("WIFI:T:WPA;S:office\\;H\\:true;P:a\\:b\\\\c;;");
    expect(
      qrPayload("contact", { name: "A\nEND:VCARD", organization: "X;Y" }),
    ).toContain("FN:A\\nEND:VCARD");
    expect(() => qrPayload("phone", { phone: "javascript:alert(1)" })).toThrow(
      "qr",
    );
  });
});
describe("background removal", () => {
  it("removes the connected white border but preserves an enclosed white center", () => {
    const pixels = new Uint8ClampedArray(5 * 5 * 4).fill(255);
    for (let y = 1; y <= 3; y++)
      for (let x = 1; x <= 3; x++) {
        if (x === 2 && y === 2) continue;
        const i = (y * 5 + x) * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
      }
    clearBackground(pixels, 5, 5, [255, 255, 255], 5);
    expect(pixels[3]).toBe(0);
    expect(pixels[(2 * 5 + 2) * 4 + 3]).toBe(255);
    expect(pixels[(1 * 5 + 1) * 4 + 3]).toBe(255);
  });
});
describe("explicit local drafts", () => {
  beforeEach(() => localStorage.clear());
  it("loads only structurally valid drafts and supports deletion", () => {
    saveLocal("invoice-draft", {
      seller: "A",
      customer: "B",
      number: "1",
      date: "2026-08-30",
      currency: "THB",
      tax: "7",
      items: [{ description: "Service", quantity: "1", price: "100" }],
      language: "en",
      logo: "javascript:bad",
    });
    expect(readDraft()?.seller).toBe("A");
    expect(readDraft()?.logo).toBeUndefined();
    removeLocal("invoice-draft");
    expect(readDraft()).toBeNull();
    saveLocal("invoice-draft", { items: [null] });
    expect(readDraft()).toBeNull();
  });
});
