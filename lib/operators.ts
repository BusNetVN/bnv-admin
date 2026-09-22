export type BusinessType = "llc" | "jsc" | "cooperative" | "household"

export type Operator = {
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
  status: boolean
}

export type OperatorInput = Omit<Operator, "id">

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "llc", label: "Công ty TNHH" },
  { value: "jsc", label: "Công ty cổ phần" },
  { value: "cooperative", label: "Hợp tác xã" },
  { value: "household", label: "Hộ kinh doanh" },
]

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

export const emptyOperatorInput: OperatorInput = {
  name: "",
  short_name: "",
  company_code: "",
  slug: "",
  logo_url: "",
  cover_image_url: "",
  description: "",
  business_type: "llc",
  tax_code: "",
  business_license_no: "",
  legal_representative: "",
  representative_phone: "",
  email: "",
  phone: "",
  website: "",
  status: true,
}

export function toOperatorInput(operator: Operator): OperatorInput {
  const { id: _id, ...input } = operator
  return {
    ...input,
    company_code: input.company_code.trim().toLowerCase(),
  }
}
