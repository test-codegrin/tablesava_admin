import { requestApi } from "@/api/apiClient";
import type {
  UpdateRazorpayPayload,
  UpdateVendorProfilePayload,
  VendorProfile,
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

const extractVendorFromAnyShape = (value: unknown): VendorProfile => {
  if (!isRecord(value)) {
    return mapVendor(value);
  }

  if (isRecord(value.vendor)) {
    return mapVendor(value.vendor);
  }

  if (isRecord(value.data)) {
    return mapVendor(value.data);
  }

  return mapVendor(value);
};

export const getVendorProfile = async () => {
  const response = await requestApi<unknown>({
    method: "get",
    url: "/vendor/profile",
  });

  return extractVendorFromAnyShape(response.data ?? response.raw);
};

export const buildVendorProfileUpdatePayload = (payload: UpdateVendorProfilePayload) => {
  const normalized: Record<string, string> = {};

  if (typeof payload.name === "string" && payload.name.trim().length > 0) {
    normalized.name = payload.name.trim();
  }
  if (typeof payload.email === "string" && payload.email.trim().length > 0) {
    normalized.email = payload.email.trim();
  }
  if (typeof payload.phone === "string" && payload.phone.trim().length > 0) {
    normalized.phone = payload.phone.trim();
  }
  if (typeof payload.subdomain === "string" && payload.subdomain.trim().length > 0) {
    normalized.subdomain = payload.subdomain.trim();
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error("Please provide at least one profile field.");
  }

  return normalized;
};

export const updateVendorProfile = async (payload: UpdateVendorProfilePayload) => {
  const response = await requestApi<unknown>({
    method: "put",
    url: "/vendor/profile",
    data: buildVendorProfileUpdatePayload(payload),
  });

  return {
    message: response.message || "Profile updated successfully.",
  };
};

export const updateRazorpayCredentials = async (payload: UpdateRazorpayPayload) => {
  const keyId = payload.razorpay_key_id.trim();
  const keySecret = payload.razorpay_key_secret.trim();

  if (!keyId || !keySecret) {
    throw new Error("Both Razorpay key ID and key secret are required.");
  }

  const response = await requestApi<unknown>({
    method: "post",
    url: "/vendor/update-razorpay",
    data: {
      razorpay_key_id: keyId,
      razorpay_key_secret: keySecret,
    },
  });

  return {
    message: response.message || "Razorpay keys updated successfully.",
  };
};

