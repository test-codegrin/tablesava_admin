import { AxiosError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildVendorAuthHeaders,
  getStoredVendorToken,
  normalizeResponse,
  parseApiError,
} from "./apiClient";
import { AUTH_STORAGE_KEY, LEGACY_AUTH_STORAGE_KEY } from "@/constants/auth";

const storage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
});

afterEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

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

describe("getStoredVendorToken", () => {
  it("reads the canonical vendor token key first", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, "vendor-token");
    localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, "legacy-token");

    expect(getStoredVendorToken()).toBe("vendor-token");
  });

  it("falls back to the legacy admin token key", () => {
    localStorage.setItem(LEGACY_AUTH_STORAGE_KEY, "legacy-token");

    expect(getStoredVendorToken()).toBe("legacy-token");
  });
});

