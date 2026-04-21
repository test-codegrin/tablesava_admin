export interface RegisterPayload {
  name: string
  subdomain: string
  email: string
  password: string
  phone: string
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface VendorProfile {
  vendor_id: number;
  name: string;
  email: string;
  phone: string;
  subdomain: string;
  razorpay_key_id?: string;
  avatar_url?: string;
}

export interface MeResponse {
  vendor: VendorProfile;
}

export interface UpdateVendorProfilePayload {
  name: string;
  email: string;
  phone: string;
  subdomain: string;
}

export interface UpdateVendorProfileResponse {
  success: boolean;
  message: string;
}

export interface Category {
  categories_id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
