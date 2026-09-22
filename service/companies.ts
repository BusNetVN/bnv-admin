import type { Operator, OperatorInput } from "@/lib/operators"
import { request } from "@/service/core-api"

export function listCompanies(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<Operator[]>(`/api/companies${suffix}`)
}

export function createCompany(payload: OperatorInput) {
  return request<Operator>("/api/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCompany(id: string, payload: OperatorInput) {
  return request<Operator>(`/api/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteCompany(id: string) {
  return request<{ id: string }>(`/api/companies/${id}`, {
    method: "DELETE",
  })
}
