import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import {
  buildVendorAuthHeaders,
  normalizeResponse,
  parseApiError,
} from "./apiClient";

describe("normalizeResponse", () => {
  it("normalizes envelope with data", () => {
    const normalized = normalizeResponse<{ name: string }>(
      { success: true, message: "ok", data: { name: "test" } },
      200,
    );

    expect(normalized.success).toBe(true);
    expect(normalized.message).toBe("ok");
    expect(normalized.data).toEqual({ name: "test" });
  });

  it("normalizes vendor-shaped payload", () => {
    const normalized = normalizeResponse<{ vendor_id: number }>(
      { vendor: { vendor_id: 99 } },
      200,
    );

    expect(normalized.success).toBe(true);
    expect(normalized.data).toEqual({ vendor_id: 99 });
  });

  it("supports message-only success payload", () => {
    const normalized = normalizeResponse<{ never: string }>({ message: "updated" }, 200);

    expect(normalized.success).toBe(true);
    expect(normalized.message).toBe("updated");
    expect(normalized.data).toBeNull();
  });
});

describe("parseApiError", () => {
  it("uses backend error message when present", () => {
    const axiosError = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: { headers: {} },
        data: { success: false, message: "table_number already exists for this vendor" },
      } as never,
    );

    const parsed = parseApiError(axiosError);
    expect(parsed.status).toBe(409);
    expect(parsed.message).toBe("table_number already exists for this vendor");
  });

  it("falls back to status-specific message when payload has no message", () => {
    const axiosError = new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: { headers: {} },
        data: {},
      } as never,
    );

    const parsed = parseApiError(axiosError);
    expect(parsed.status).toBe(404);
    expect(parsed.message).toContain("not found");
  });
});

describe("buildVendorAuthHeaders", () => {
  it("returns bearer authorization when vendor token is provided", () => {
    expect(buildVendorAuthHeaders("token123")).toEqual({
      Authorization: "Bearer token123",
    });
  });

  it("does not include user-token headers", () => {
    const headers = buildVendorAuthHeaders("abc");
    expect(headers).not.toHaveProperty("x-user-token");
    expect(headers).not.toHaveProperty("x-user-authorization");
  });
});

