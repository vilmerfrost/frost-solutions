// app/types/materials.ts
export interface Material {
 id: string
 tenant_id: string
 sku?: string
 name: string
 category?: string
 category_type?: string
 unit: string
 price: number
 purchase_price?: number
 sale_price?: number
 package_quantity?: number
 stock_quantity?: number
 min_stock_level?: number
 supplier_id?: string
 supplier_article_number?: string
 supplier_url?: string
 is_eco_certified?: boolean
 is_recyclable?: boolean
 is_hazardous?: boolean
 notes?: string
 created_at: string
 updated_at: string
}

export interface MaterialFilters {
 category?: string
 search?: string
 page?: number
 limit?: number
}

