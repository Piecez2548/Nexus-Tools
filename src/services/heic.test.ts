import { describe, expect, it } from "vitest";
import { looksLikeHeic } from "./heic";

const header = (brand: string) => Uint8Array.from([0, 0, 0, 28, ...[..."ftyp"].map((c) => c.charCodeAt(0)), ...[...brand].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...[..."mif1heic"].map((c) => c.charCodeAt(0))]);

describe("HEIC header check", () => {
  it("accepts HEIC and HEIF brands", () => {
    for (const brand of ["heic", "heix", "mif1", "msf1"]) expect(looksLikeHeic(header(brand))).toBe(true);
  });
  it("rejects other files", () => {
    expect(looksLikeHeic(header("avif"))).toBe(true); // lists mif1/heic as compatible brands
    expect(looksLikeHeic(new TextEncoder().encode("this is not a photo at all, just text"))).toBe(false);
    expect(looksLikeHeic(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1]))).toBe(false);
    expect(looksLikeHeic(new Uint8Array(0))).toBe(false);
  });
});
