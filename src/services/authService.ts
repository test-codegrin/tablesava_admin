import { requestApi } from "@/api/apiClient";
import type {
  VendorLoginPayload,
  VendorProfile,
  VendorRegisterPayload,
} from "@/types/admin";
import { isRecord, toNullableString, toNumber, toString } from "./shared";

const mapVendor = (value: unknown): VendorProfile => {
  const payload = isRecord(value) ? value : {};
  return {
    vendor_id: toNumber(payload.vendor_id),
    name: toString(payload.name),
    email: toString(payload.email),
    phone: toString(payload.phone),
    subdomain: toString(payload.subdomain),
    razorpay_key_id: toNullableString(payload.razorpay_key_id),
    avatar_url: toNullableString(payload.avatar_url),
    created_at: toNullableString(payload.created_at) ?? undefined,
    updated_at: toNullableString(payload.updated_at) ?? undefined,
  };
};

const extractVendor = (value: unknown): VendorProfile => {
  if (!isRecord(value)) {
    return mapVendor(value);
  }

  if (isRecord(value.vendor)) {
    return mapVendor(value.vendor);
  }

  return mapVendor(value);
};

export const registerVendor = async (payload: VendorRegisterPayload) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: "/vendor/register",
    data: payload,
  });

  return {
    message: response.message || "Vendor registered successfully.",
  };
};

export const loginVendor = async (payload: VendorLoginPayload) => {
  const response = await requestApi<unknown>({
    method: "post",
    url: "/vendor/login",
    data: payload,
  });

  const data = isRecord(response.data) ? response.data : {};
  const token =
    (typeof data.token === "string" ? data.token : null) ||
    (isRecord(response.raw) && typeof response.raw.token === "string"
      ? response.raw.token
      : null);

  if (!token) {
    throw new Error("Token not found in login response.");
  }

  return {
    token,
    message: response.message || (typeof data.message === "string" ? data.message : undefined),
  };
};

export const getVendorMe = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/vendor/me",
  });

  return extractVendor(response.data ?? response.raw);
};

