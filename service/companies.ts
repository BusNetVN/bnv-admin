import type {
  Company,
  CompanyInput,
  DeleteCompanyResponse,
} from "@/types/companies"
import { request } from "@/service/core-api"

const COMPANIES_PATH = "/api/admin/companies"

export function listCompanies(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<Company[]>(`${COMPANIES_PATH}${suffix}`)
}

export function getCompany(id: string) {
  return request<Company>(`${COMPANIES_PATH}/${id}`)
}

export function createCompany(payload: CompanyInput) {
  return request<Company>(COMPANIES_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCompany(id: string, payload: CompanyInput) {
  return request<Company>(`${COMPANIES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteCompany(id: string) {
  return request<DeleteCompanyResponse>(`${COMPANIES_PATH}/${id}`, {
    method: "DELETE",
  })
}
