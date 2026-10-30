export type AccountType =
  | "CUSTOMER"
  | "COMPANY_STAFF"
  | "SYSTEM_ADMIN"
  | "AGENCY"

export type StaffRole = "ADMIN" | "STAFF" | "DRIVER" | "ASSISTANT"

/** A role (nhóm quyền) of the user's company. */
export type UserRole = {
  id: string
  name: string
}

export type User = {
  id: string
  username: string
  full_name: string
  email: string
  phone: string
  company_uuid: string | null
  account_type: AccountType
  staff_role: StaffRole | null
  /** Missing when the API predates role assignment. */
  roles?: UserRole[]
  status: boolean
  /** Username of the admin who created / last updated the account (null for older rows). */
  created_by?: string | null
  updated_by?: string | null
  created_at?: string
  updated_at?: string
}

export type UserInput = {
  username: string
  password: string
  confirm_password: string
  full_name: string
  email: string
  phone: string
  company_uuid: string
  account_type: AccountType
  staff_role: StaffRole | ""
  role_ids: string[]
  status: boolean
}

export type UserPayload = {
  username: string
  password?: string
  full_name: string
  email: string
  phone: string
  company_uuid: string | null
  account_type: AccountType
  staff_role: StaffRole | null
  role_ids: string[]
  status: boolean
}

export type DeleteUserResponse = {
  id: string
  username: string
}
