import type {
  DeleteRouteResponse,
  Route,
  RouteInput,
  RoutePayload,
} from "@/types/routes"
import { toRoutePayload } from "@/lib/routes"
import { request } from "@/service/core-api"

const ROUTES_PATH = "/api/admin/routes"

/** Routes of every company, or only of `companyUuid` when given. */
export function listRoutes(options: { companyUuid?: string; query?: string } = {}) {
  const params = new URLSearchParams()
  if (options.companyUuid) {
    params.set("company_uuid", options.companyUuid)
  }
  const keyword = options.query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<Route[]>(`${ROUTES_PATH}${suffix}`)
}

export function getRoute(id: string) {
  return request<Route>(`${ROUTES_PATH}/${id}`)
}

export function createRoute(input: RouteInput) {
  return request<Route>(ROUTES_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...toRoutePayload(input),
      company_uuid: input.company_uuid,
    }),
  })
}

export function updateRoute(id: string, payload: RoutePayload) {
  return request<Route>(`${ROUTES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

/** `ids` must list every route of the company, in the new display order. */
export function reorderRoutes(companyUuid: string, ids: string[]) {
  return request<Route[]>(`${ROUTES_PATH}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ company_uuid: companyUuid, ids }),
  })
}

export function deleteRoute(id: string) {
  return request<DeleteRouteResponse>(`${ROUTES_PATH}/${id}`, {
    method: "DELETE",
  })
}
