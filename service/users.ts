import type {
  DeleteUserResponse,
  User,
  UserPayload,
} from "@/types/users"
import { request } from "@/service/core-api"

const USERS_PATH = "/api/admin/users"

/** Users of every company, or only of `companyUuid` when given. */
export function listUsers(options: { companyUuid?: string; query?: string } = {}) {
  const params = new URLSearchParams()
  if (options.companyUuid) {
    params.set("company_uuid", options.companyUuid)
  }
  const keyword = options.query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<User[]>(`${USERS_PATH}${suffix}`)
}

export function getUser(id: string) {
  return request<User>(`${USERS_PATH}/${id}`)
}

export function createUser(payload: UserPayload) {
  return request<User>(USERS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: string, payload: UserPayload) {
  return request<User>(`${USERS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: string) {
  return request<DeleteUserResponse>(`${USERS_PATH}/${id}`, {
    method: "DELETE",
  })
}
