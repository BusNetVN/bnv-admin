import type {
  DeleteOfficeResponse,
  Office,
  OfficeInput,
  OfficePayload,
} from "@/types/offices"
import { toOfficePayload } from "@/lib/offices"
import { request } from "@/service/core-api"

const OFFICES_PATH = "/api/admin/offices"

/** Offices of every company, or only of `companyUuid` when given. */
export function listOffices(options: { companyUuid?: string; query?: string } = {}) {
  const params = new URLSearchParams()
  if (options.companyUuid) {
    params.set("company_uuid", options.companyUuid)
  }
  const keyword = options.query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<Office[]>(`${OFFICES_PATH}${suffix}`)
}

export function getOffice(id: string) {
  return request<Office>(`${OFFICES_PATH}/${id}`)
}

export function createOffice(input: OfficeInput) {
  return request<Office>(OFFICES_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...toOfficePayload(input),
      company_uuid: input.company_uuid,
    }),
  })
}

export function updateOffice(id: string, payload: OfficePayload) {
  return request<Office>(`${OFFICES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteOffice(id: string) {
  return request<DeleteOfficeResponse>(`${OFFICES_PATH}/${id}`, {
    method: "DELETE",
  })
}
