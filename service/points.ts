import type { DeletePointResponse, Point, PointPayload } from "@/types/points"
import { request } from "@/service/core-api"

const POINTS_PATH = "/api/admin/points"

/** Shared points (scope SYSTEM), the ones managed by admins. */
export function listSharedPoints(query?: string) {
  const params = new URLSearchParams({ scope: "shared" })
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }
  return request<Point[]>(`${POINTS_PATH}?${params.toString()}`)
}

export function getPoint(id: string) {
  return request<Point>(`${POINTS_PATH}/${id}`)
}

/** The admin API always creates a shared point. */
export function createSharedPoint(input: PointPayload) {
  return request<Point>(POINTS_PATH, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/** Only shared points can be changed here; a company's own points answer 403. */
export function updatePoint(id: string, input: PointPayload) {
  return request<Point>(`${POINTS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deletePoint(id: string) {
  return request<DeletePointResponse>(`${POINTS_PATH}/${id}`, {
    method: "DELETE",
  })
}
