export type Permission = {
  id: string
  code: string
  name: string
  description: string
  sort_order: number
  is_active: boolean
  /** Username of the user who created / last updated it (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type PermissionGroup = {
  id: string
  code: string
  name: string
  description: string
  sort_order: number
  is_active: boolean
  permissions: Permission[]
  /** Username of the user who created / last updated the group (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type PermissionGroupInput = {
  code: string
  name: string
  description: string
  sort_order: string
  is_active: boolean
  seed_standard_permissions: boolean
}

export type PermissionGroupPayload = {
  code: string
  name: string
  description: string
  sort_order?: number
  is_active: boolean
  seed_standard_permissions?: boolean
}

export type PermissionInput = {
  code: string
  name: string
  description: string
  sort_order: string
  is_active: boolean
}

export type PermissionPayload = {
  code: string
  name: string
  description: string
  sort_order?: number
  is_active: boolean
}

export type DeletePermissionResponse = {
  id: string
  code: string
  name: string
}
