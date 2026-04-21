import api from "./apiClient"
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterPayload,
  UpdateVendorProfilePayload,
  UpdateVendorProfileResponse,
} from "../types/dataTypes"

// Register
export const registerApi = async (data: RegisterPayload) => {
  const response = await api.post("/vendor/register", data)
  return response.data
}

// Login
export const loginApi = async (data: LoginPayload): Promise<LoginResponse> => {
  const endpoints = ["/vendor/login", "/user/login"];

  for (const endpoint of endpoints) {
    try {
      const response = await api.post<LoginResponse>(endpoint, data);
      return response.data;
    } catch {
      // Try next endpoint variant.
    }
  }

  throw new Error("Login endpoint not available");
}

// Authenticated vendor profile
export const getMeApi = async (): Promise<MeResponse> => {
  const endpoints = ["/vendor/me", "/user/me"];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get<MeResponse>(endpoint);
      return response.data;
    } catch {
      // Try next endpoint variant.
    }
  }

  throw new Error("Profile endpoint not available");
}

export const updateVendorProfileApi = async (
  data: UpdateVendorProfilePayload,
): Promise<UpdateVendorProfileResponse> => {
  const response = await api.put<UpdateVendorProfileResponse>("/vendor/profile", data);
  return response.data;
}
