import type { Province, Ward } from "@/types/locations"
import { request } from "@/service/core-api"

export function listProvinces(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }
  const suffix = params.toString()
  return request<Province[]>(`/api/locations/provinces${suffix ? `?${suffix}` : ""}`)
}

export function listWards(provinceUuid: string, query?: string) {
  const params = new URLSearchParams({ province_uuid: provinceUuid })
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }
  return request<Ward[]>(`/api/locations/wards?${params.toString()}`)
}
