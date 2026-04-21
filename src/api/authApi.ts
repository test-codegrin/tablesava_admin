import api from "./apiClient"
import type { RegisterPayload } from "../types/dataTypes"

// Register
export const registerApi = async (data: RegisterPayload) => {
  const response = await api.post("/vendor/register", data)
  return response.data
}

// Login
export const loginApi = async (data: { email: string; password: string }) => {
  const response = await api.post("/vendor/login", data)
  return response.data
}

