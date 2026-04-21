import api from "./apiClient"

// ─── Categories ───────────────────────────────────────────────────────────────

// Get all categories
export const getCategoriesApi = async () => {
  const response = await api.get("/categories")
  return response.data
}

// Create category
export const createCategoryApi = async (data: {
  name: string
  description: string
  status: string
}) => {
  const response = await api.post("/categories", data)
  return response.data
}

// Update category
export const updateCategoryApi = async (
  id: number,
  data: { name: string; description: string; status: string }
) => {
  const response = await api.put(`/categories/${id}`, data)
  return response.data
}

// Delete category
export const deleteCategoryApi = async (id: number) => {
  const response = await api.delete(`/categories/${id}`)
  return response.data
}
