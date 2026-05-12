import { describe, expect, it } from "vitest";
import { getReceiptUrlFromResponse } from "./orderService";

describe("getReceiptUrlFromResponse", () => {
  it("supports direct receiptUrl responses", () => {
    expect(getReceiptUrlFromResponse({ receiptUrl: "/receipts/1.pdf" })).toBe(
      "/receipts/1.pdf",
    );
  });

  it("supports url responses", () => {
    expect(getReceiptUrlFromResponse({ url: "/receipts/2.pdf" })).toBe(
      "/receipts/2.pdf",
    );
  });

  it("supports nested data receiptUrl responses", () => {
    expect(
      getReceiptUrlFromResponse({ data: { receiptUrl: "/receipts/3.pdf" } }),
    ).toBe("/receipts/3.pdf");
  });

  it("supports nested receipt url responses", () => {
    expect(getReceiptUrlFromResponse({ receipt: { url: "/receipts/4.pdf" } })).toBe(
      "/receipts/4.pdf",
    );
  });
});
