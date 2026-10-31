import { describe, expect, it } from "vitest";
import { qrLink } from "./qrReader";

describe("qr link", () => {
  it("accepts only web addresses", () => {
    expect(qrLink("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(qrLink(" http://example.com ")).toBe("http://example.com/");
    for (const text of ["javascript:alert(1)", "data:text/html,hi", "WIFI:T:WPA;S:a;P:b;;", "tel:+66812345678", "hello world", ""])
      expect(qrLink(text)).toBeNull();
  });
});
