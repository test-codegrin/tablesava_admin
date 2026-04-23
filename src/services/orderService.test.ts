import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus } from "./orderService";

describe("canTransitionOrderStatus", () => {
  it("allows pending to accepted", () => {
    expect(canTransitionOrderStatus(0, 1)).toBe(true);
  });

  it("allows accepted to completed", () => {
    expect(canTransitionOrderStatus(1, 2)).toBe(true);
  });

  it("rejects skipped or backwards transitions", () => {
    expect(canTransitionOrderStatus(0, 2)).toBe(false);
    expect(canTransitionOrderStatus(1, 0)).toBe(false);
    expect(canTransitionOrderStatus(2, 1)).toBe(false);
  });
});

