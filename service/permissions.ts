import type {
  Permission,
  PermissionGroup,
  PermissionGroupPayload,
  PermissionPayload,
} from "@/lib/permissions"
import { identityRequest } from "@/service/core-api"

export function listPermissionGroups(query?: string) {
  const params = new URLSearchParams()
  const keyword = query?.trim()
  if (keyword) {
    params.set("q", keyword)
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return identityRequest<PermissionGroup[]>(`/api/permission-groups${suffix}`)
}

export function createPermissionGroup(payload: PermissionGroupPayload) {
  return identityRequest<PermissionGroup>("/api/permission-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updatePermissionGroup(
  id: string,
  payload: PermissionGroupPayload
) {
  return identityRequest<PermissionGroup>(`/api/permission-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deletePermissionGroup(id: string) {
  return identityRequest<{ id: string; code: string; name: string }>(
    `/api/permission-groups/${id}`,
    { method: "DELETE" }
  )
}

export function createPermission(groupId: string, payload: PermissionPayload) {
  return identityRequest<Permission>(
    `/api/permission-groups/${groupId}/permissions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export function updatePermission(id: string, payload: PermissionPayload) {
  return identityRequest<Permission>(`/api/permissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deletePermission(id: string) {
  return identityRequest<{ id: string; code: string; name: string }>(
    `/api/permissions/${id}`,
    { method: "DELETE" }
  )
}
