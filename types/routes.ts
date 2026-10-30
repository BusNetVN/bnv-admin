import type { Company } from "@/types/companies"

export type Route = {
  id: string
  company_uuid: string
  company: Pick<Company, "id" | "name" | "short_name" | "company_code">
  route_code: string
  name: string
  origin: string
  destination: string
  distance_km: number | null
  duration_minutes: number | null
  note: string
  status: boolean
  sort_order: number
  /** Username of the user who created / last updated the route (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

/** Form state: the numbers are kept as text while typing. */
export type RouteInput = {
  company_uuid: string
  route_code: string
  name: string
  origin: string
  destination: string
  distance_km: string
  duration_minutes: string
  note: string
  status: boolean
}

export type RoutePayload = {
  route_code: string
  name: string
  origin: string
  destination: string
  distance_km: number | null
  duration_minutes: number | null
  note: string
  status: boolean
}

export type DeleteRouteResponse = {
  id: string
  route_code: string
}
