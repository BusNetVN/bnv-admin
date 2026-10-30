import type {
  DeleteRoleResponse,
  Role,
  RoleInput,
  RolePayload,
} from "@/types/roles"
import { toRolePayload } from "@/lib/roles"
import { request } from "@/service/core-api"

const ROLES_PATH = "/api/admin/roles"

/** Roles of every company, or only of `companyUuid` when given. */
export function listRoles(options: { companyUuid?: string; query?: string } = {}) {
  const params = new URLSearchParams()
  if (options.companyUuid) {
    params.set("company_uuid", options.companyUuid)
  }
  const keyword = options.query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<Role[]>(`${ROLES_PATH}${suffix}`)
}

export function getRole(id: string) {
  return request<Role>(`${ROLES_PATH}/${id}`)
}

export function createRole(input: RoleInput) {
  return request<Role>(ROLES_PATH, {
    method: "POST",
    body: JSON.stringify({
      ...toRolePayload(input),
      company_uuid: input.company_uuid,
    }),
  })
}

/** `permission_ids` replaces the role's whole permission list. */
export function updateRole(id: string, payload: RolePayload) {
  return request<Role>(`${ROLES_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteRole(id: string) {
  return request<DeleteRoleResponse>(`${ROLES_PATH}/${id}`, {
    method: "DELETE",
  })
}
