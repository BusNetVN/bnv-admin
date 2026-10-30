export type BusinessType = "TNHH" | "CP" | "HTX" | "HKG"

export type Company = {
  id: string
  name: string
  short_name: string
  company_code: string
  slug: string
  logo_url: string
  cover_image_url: string
  description: string
  business_type: BusinessType
  tax_code: string
  business_license_no: string
  legal_representative: string
  representative_phone: string
  email: string
  phone: string
  website: string
  is_active: boolean
  /** Username of the user who created / last updated the company (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type CompanyInput = Omit<
  Company,
  "id" | "created_by" | "updated_by" | "created_at" | "updated_at"
>

export type DeleteCompanyResponse = {
  id: string
  company_code: string
}
