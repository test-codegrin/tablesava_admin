import {
  getVendorMe,
  loginVendor,
  registerVendor,
} from "@/services/authService";
import { updateVendorProfile } from "@/services/vendorService";
import type {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RegisterPayload,
  UpdateVendorProfilePayload,
  UpdateVendorProfileResponse,
} from "../types/dataTypes";

export const registerApi = async (data: RegisterPayload) => registerVendor(data);

export const loginApi = async (data: LoginPayload): Promise<LoginResponse> => {
  const response = await loginVendor(data);
  return {
    success: true,
    message: response.message,
    token: response.token,
  };
};

export const getMeApi = async (): Promise<MeResponse> => {
  const vendor = await getVendorMe();
  return { vendor };
};

export const updateVendorProfileApi = async (
  data: UpdateVendorProfilePayload,
): Promise<UpdateVendorProfileResponse> => {
  const response = await updateVendorProfile(data);
  return { success: true, message: response.message };
};
