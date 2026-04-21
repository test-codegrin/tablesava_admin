export interface RegisterPayload {
  name: string
  subdomain: string
  email: string
  password: string
  phone: string
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