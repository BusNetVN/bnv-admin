import type {
  DeletePermissionResponse,
  Permission,
  PermissionGroup,
  PermissionGroupPayload,
  PermissionPayload,
} from "@/types/permissions"
import { request } from "@/service/core-api"

const PERMISSION_GROUPS_PATH = "/api/admin/permission-groups"
const PERMISSIONS_PATH = "/api/admin/permissions"

export function listPermissionGroups(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return request<PermissionGroup[]>(`${PERMISSION_GROUPS_PATH}${suffix}`)
}

export function createPermissionGroup(payload: PermissionGroupPayload) {
  return request<PermissionGroup>(PERMISSION_GROUPS_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updatePermissionGroup(
  id: string,
  payload: PermissionGroupPayload
) {
  return request<PermissionGroup>(`${PERMISSION_GROUPS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deletePermissionGroup(id: string) {
  return request<DeletePermissionResponse>(`${PERMISSION_GROUPS_PATH}/${id}`, {
    method: "DELETE",
  })
}

export function createPermission(groupId: string, payload: PermissionPayload) {
  return request<Permission>(`${PERMISSION_GROUPS_PATH}/${groupId}/permissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updatePermission(id: string, payload: PermissionPayload) {
  return request<Permission>(`${PERMISSIONS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deletePermission(id: string) {
  return request<DeletePermissionResponse>(`${PERMISSIONS_PATH}/${id}`, {
    method: "DELETE",
  })
}
