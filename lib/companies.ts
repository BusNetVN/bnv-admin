import type { BusinessType, Company, CompanyInput } from "@/types/companies"

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "TNHH", label: "Công ty TNHH" },
  { value: "CP", label: "Công ty cổ phần" },
  { value: "HTX", label: "Hợp tác xã" },
  { value: "HKG", label: "Hộ kinh doanh" },
]

export function isBusinessType(value: unknown): value is BusinessType {
  return BUSINESS_TYPES.some((item) => item.value === value)
}

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động"
}

export function businessTypeLabel(type: BusinessType) {
  return BUSINESS_TYPES.find((item) => item.value === type)?.label ?? type
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const emptyCompanyInput: CompanyInput = {
  name: "",
  short_name: "",
  company_code: "",
  slug: "",
  logo_url: "",
  cover_image_url: "",
  description: "",
  business_type: "TNHH",
  tax_code: "",
  business_license_no: "",
  legal_representative: "",
  representative_phone: "",
  email: "",
  phone: "",
  website: "",
  is_active: true,
}

export function toCompanyInput(company: Company): CompanyInput {
  return {
    name: company.name,
    short_name: company.short_name,
    company_code: company.company_code.trim().toLowerCase(),
    slug: company.slug,
    logo_url: company.logo_url,
    cover_image_url: company.cover_image_url,
    description: company.description,
    business_type: company.business_type,
    tax_code: company.tax_code,
    business_license_no: company.business_license_no,
    legal_representative: company.legal_representative,
    representative_phone: company.representative_phone,
    email: company.email,
    phone: company.phone,
    website: company.website,
    is_active: company.is_active,
  }
}
