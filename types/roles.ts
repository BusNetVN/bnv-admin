export type RolePermission = {
  id: string
  code: string
  name: string
}

export type Role = {
  id: string
  company_uuid: string
  name: string
  description: string
  is_active: boolean
  permissions: RolePermission[]
  /** Username of the user who created / last updated the role. */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type RoleInput = {
  company_uuid: string
  name: string
  description: string
  is_active: boolean
  permission_ids: string[]
}

export type RolePayload = {
  name: string
  description: string
  is_active: boolean
  permission_ids: string[]
}

export type DeleteRoleResponse = {
  id: string
  name: string
}
