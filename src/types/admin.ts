export type StatusFlag = 0 | 1;

export type OrderStatus = 0 | 1 | 2;

export interface VendorRegisterPayload {
  name: string;
  subdomain: string;
  email: string;
  password: string;
  phone: string;
}

export interface VendorLoginPayload {
  email: string;
  password: string;
}

export interface VendorProfile {
  vendor_id: number;
  name: string;
  email: string;
  phone: string;
  subdomain: string;
  razorpay_key_id?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateVendorProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  subdomain?: string;
}

export interface UpdateRazorpayPayload {
  razorpay_key_id: string;
  razorpay_key_secret: string;
}

export interface Category {
  categories_id: number;
  name: string;
  description: string;
  status: StatusFlag;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertCategoryPayload {
  name: string;
  description?: string;
  status: StatusFlag;
}

export interface ItemOption {
  option_id?: number;
  name: string;
  price_delta: number;
  is_deleted?: boolean;
}

export interface ItemOptionGroup {
  group_id?: number;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  options: ItemOption[];
  is_deleted?: boolean;
}

export interface Item {
  item_id: number;
  categories_id: number;
  name: string;
  description: string;
  price: number;
  status: StatusFlag;
  photo_url?: string | null;
  option_groups?: ItemOptionGroup[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemPayload {
  name: string;
  description?: string;
  price: number;
  status: StatusFlag;
  photo?: File | null;
  option_groups?: ItemOptionGroup[];
}

export type UpdateItemPayload = CreateItemPayload;

export interface ItemStatusPayload {
  status: StatusFlag;
}

export interface VendorTable {
  table_id: number;
  table_number: number;
  capacity: number;
  status?: StatusFlag;
  is_available?: StatusFlag;
  qr_code_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertTablePayload {
  table_number: number;
  capacity: number;
  status?: StatusFlag;
  is_available?: StatusFlag;
}

export interface TableQrCodeRecord {
  table_id: number;
  table_number: number;
  qr_code_url?: string | null;
}

export interface OrderLineItem {
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options_text?: string | null;
}

export interface OrderSummary {
  order_id: number;
  table_id?: number | null;
  table_number?: number | null;
  status: OrderStatus;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderDetail extends OrderSummary {
  items: OrderLineItem[];
}
