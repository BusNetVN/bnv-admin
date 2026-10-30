import type { Route, RouteInput, RoutePayload } from "@/types/routes"

export const MAX_DISTANCE_KM = 10_000
export const MAX_DURATION_MINUTES = 10_080

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động"
}

/** Same rule as the API: an empty name becomes "<origin> - <destination>". */
export function routeNameFromEndpoints(origin: string, destination: string) {
  const from = origin.trim()
  const to = destination.trim()
  return from && to ? `${from} - ${to}` : ""
}

export function itineraryLabel(route: Pick<Route, "origin" | "destination">) {
  return [route.origin, route.destination]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" → ")
}

export function formatDistance(km: number | null) {
  return km ? `${km.toLocaleString("vi-VN")} km` : "—"
}

export function formatDuration(minutes: number | null) {
  if (!minutes) {
    return "—"
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) {
    return `${rest} phút`
  }
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`
}

export function emptyRouteInput(companyUuid = ""): RouteInput {
  return {
    company_uuid: companyUuid,
    route_code: "",
    name: "",
    origin: "",
    destination: "",
    distance_km: "",
    duration_minutes: "",
    note: "",
    status: true,
  }
}

export function toRouteInput(route: Route): RouteInput {
  return {
    company_uuid: route.company_uuid,
    route_code: route.route_code.toUpperCase(),
    name: route.name,
    origin: route.origin,
    destination: route.destination,
    distance_km: route.distance_km != null ? String(route.distance_km) : "",
    duration_minutes:
      route.duration_minutes != null ? String(route.duration_minutes) : "",
    note: route.note,
    status: route.status,
  }
}

function parseOptionalInt(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

/** Returns an error message when the text is not empty and not an integer in [1, max]. */
export function optionalIntError(value: string, max: number, label: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const number = Number(trimmed)
  return /^\d+$/.test(trimmed) && number >= 1 && number <= max
    ? undefined
    : `${label} phải là số nguyên từ 1 đến ${max.toLocaleString("vi-VN")}.`
}

export function toRoutePayload(values: RouteInput): RoutePayload {
  return {
    route_code: values.route_code.trim().toUpperCase(),
    name: values.name.trim(),
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    distance_km: parseOptionalInt(values.distance_km),
    duration_minutes: parseOptionalInt(values.duration_minutes),
    note: values.note.trim(),
    status: values.status,
  }
}