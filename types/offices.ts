import type { Company } from "@/types/companies"

export type Office = {
  id: string
  company_uuid: string
  company: Pick<Company, "id" | "name" | "short_name" | "company_code">
  office_code: string
  name: string
  address: string
  phones: string[]
  note: string
  /** Username of the user who created / last updated the office (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type OfficeInput = {
  company_uuid: string
  office_code: string
  name: string
  address: string
  phones: string[]
  note: string
}

export type OfficePayload = {
  office_code: string
  name: string
  address: string
  phones: string[]
  note: string
}

export type DeleteOfficeResponse = {
  id: string
  office_code: string
}
