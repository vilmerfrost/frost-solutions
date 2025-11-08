// app/types/materials.ts
export interface Material {
  id: string
  tenant_id: string
  sku?: string
  name: string
  category?: string
  unit: string
  price: number
  created_at: string
  updated_at: string
}

export interface MaterialFilters {
  category?: string
  search?: string
  page?: number
  limit?: number
}

