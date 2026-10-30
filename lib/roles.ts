import type { Role, RoleInput, RolePayload } from "@/types/roles"

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động"
}

export function emptyRoleInput(companyUuid = ""): RoleInput {
  return {
    company_uuid: companyUuid,
    name: "",
    description: "",
    is_active: true,
    permission_ids: [],
  }
}

export function toRoleInput(role: Role): RoleInput {
  return {
    company_uuid: role.company_uuid,
    name: role.name,
    description: role.description,
    is_active: role.is_active,
    permission_ids: role.permissions.map((permission) => permission.id),
  }
}

export function toRolePayload(input: RoleInput): RolePayload {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    is_active: input.is_active,
    permission_ids: [...new Set(input.permission_ids)],
  }
}
