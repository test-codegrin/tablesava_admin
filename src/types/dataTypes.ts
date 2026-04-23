export type {
  Category,
  UpdateRazorpayPayload as UpdateRazorpayKeysPayload,
  UpdateVendorProfilePayload,
  VendorLoginPayload as LoginPayload,
  VendorProfile,
  VendorRegisterPayload as RegisterPayload,
} from "./admin";

export interface LoginResponse {
  success?: boolean;
  message?: string;
  token: string;
}

export interface MeResponse {
  vendor: import("./admin").VendorProfile;
}

export interface UpdateVendorProfileResponse {
  success?: boolean;
  message: string;
}

export interface UpdateRazorpayKeysResponse {
  message: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

