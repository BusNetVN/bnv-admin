import type {
  Permission,
  PermissionGroup,
  PermissionGroupInput,
  PermissionGroupPayload,
  PermissionInput,
  PermissionPayload,
} from "@/types/permissions"

export const PERMISSION_CODE_PATTERN = /^[A-Z][A-Z0-9]*(?:[_-][A-Z0-9]+)*$/

export const STANDARD_PERMISSIONS = [
  { action: "CREATE", name: "Tạo" },
  { action: "UPDATE", name: "Cập nhật" },
  { action: "DELETE", name: "Xóa" },
  { action: "LIST", name: "Lấy danh sách" },
] as const;

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động"
}

export function emptyPermissionGroupInput(): PermissionGroupInput {
  return {
    code: "",
    name: "",
    description: "",
    sort_order: "",
    is_active: true,
    seed_standard_permissions: true,
  }
}

export function toPermissionGroupInput(
  group: PermissionGroup
): PermissionGroupInput {
  return {
    code: group.code,
    name: group.name,
    description: group.description,
    sort_order: String(group.sort_order),
    is_active: group.is_active,
    seed_standard_permissions: false,
  }
}

export function toPermissionGroupPayload(
  values: PermissionGroupInput,
  includeSeed: boolean
): PermissionGroupPayload {
  const sortOrder = values.sort_order.trim()
  const payload: PermissionGroupPayload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    is_active: values.is_active,
  }

  if (sortOrder) {
    payload.sort_order = Number(sortOrder)
  }

  if (includeSeed) {
    payload.seed_standard_permissions = values.seed_standard_permissions
  }

  return payload
}

export function emptyPermissionInput(groupCode?: string): PermissionInput {
  return {
    code: groupCode ? `${groupCode}_` : "",
    name: "",
    description: "",
    sort_order: "",
    is_active: true,
  }
}

export function toPermissionInput(item: Permission): PermissionInput {
  return {
    code: item.code,
    name: item.name,
    description: item.description,
    sort_order: String(item.sort_order),
    is_active: item.is_active,
  }
}

export function toPermissionPayload(values: PermissionInput): PermissionPayload {
  const sortOrder = values.sort_order.trim()
  const payload: PermissionPayload = {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    is_active: values.is_active,
  }

  if (sortOrder) {
    payload.sort_order = Number(sortOrder)
  }

  return payload
}

export function parseSortOrder(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: true as const, value: undefined }
  }

  if (!/^\d+$/.test(trimmed)) {
    return { ok: false as const }
  }

  const number = Number(trimmed)
  if (number < 0 || number > 9999) {
    return { ok: false as const }
  }

  return { ok: true as const, value: number }
}
