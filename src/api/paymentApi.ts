import { updateRazorpayCredentials } from "@/services/vendorService";
import type {
  UpdateRazorpayKeysPayload,
  UpdateRazorpayKeysResponse,
} from "../types/dataTypes";

export const updateRazorpayKeysApi = async (
  data: UpdateRazorpayKeysPayload,
): Promise<UpdateRazorpayKeysResponse> => {
  const response = await updateRazorpayCredentials(data);
  return { message: response.message };
};
