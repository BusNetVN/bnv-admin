export type AccountType =
  | "CUSTOMER"
  | "COMPANY_STAFF"
  | "SYSTEM_ADMIN"
  | "AGENCY"

export type StaffRole = "ADMIN" | "STAFF" | "DRIVER" | "ASSISTANT"

export type Account = {
  id: string
  username: string
  full_name: string
  email: string
  phone: string
  company_uuid: string | null
  account_type: AccountType
  staff_role: StaffRole | null
  status: boolean
  created_at?: string
  updated_at?: string
}

export type AccountInput = {
  username: string
  password: string
  confirm_password: string
  full_name: string
  email: string
  phone: string
  company_uuid: string
  account_type: AccountType
  staff_role: StaffRole | ""
  status: boolean
}

export type AccountPayload = {
  username: string
  password?: string
  full_name: string
  email: string
  phone: string
  company_uuid: string | null
  account_type: AccountType
  staff_role: StaffRole | null
  status: boolean
}

export const NONE_COMPANY = "__none__"

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
  { value: "COMPANY_STAFF", label: "Nhân viên nhà xe" },
  { value: "AGENCY", label: "Đại lý" },
  { value: "CUSTOMER", label: "Khách hàng" },
]

export const STAFF_ROLES: { value: StaffRole; label: string }[] = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "STAFF", label: "Nhân viên" },
  { value: "DRIVER", label: "Tài xế" },
  { value: "ASSISTANT", label: "Phụ xe" },
]

export function accountTypeLabel(type: AccountType) {
  return ACCOUNT_TYPES.find((item) => item.value === type)?.label ?? type
}

export function staffRoleLabel(role: StaffRole | null | "") {
  if (!role) {
    return "—"
  }
  return STAFF_ROLES.find((item) => item.value === role)?.label ?? role
}

export function needsCompany(type: AccountType) {
  return type === "COMPANY_STAFF" || type === "AGENCY"
}

export function needsStaffRole(type: AccountType) {
  return type === "COMPANY_STAFF"
}

export function statusLabel(status: boolean) {
  return status ? "Đang hoạt động" : "Ngưng hoạt động"
}

export const emptyAccountInput: AccountInput = {
  username: "",
  password: "",
  confirm_password: "",
  full_name: "",
  email: "",
  phone: "",
  company_uuid: NONE_COMPANY,
  account_type: "COMPANY_STAFF",
  staff_role: "STAFF",
  status: true,
}

export function toAccountInput(account: Account): AccountInput {
  return {
    username: account.username,
    password: "",
    confirm_password: "",
    full_name: account.full_name,
    email: account.email,
    phone: account.phone,
    company_uuid: account.company_uuid || NONE_COMPANY,
    account_type: account.account_type,
    staff_role: needsStaffRole(account.account_type)
      ? account.staff_role || "STAFF"
      : "",
    status: account.status,
  }
}

export function toAccountPayload(
  values: AccountInput,
  includePassword: boolean
): AccountPayload {
  const payload: AccountPayload = {
    username: values.username.trim().toLowerCase(),
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    company_uuid:
      values.company_uuid && values.company_uuid !== NONE_COMPANY
        ? values.company_uuid
        : null,
    account_type: values.account_type,
    staff_role: needsStaffRole(values.account_type)
      ? values.staff_role || null
      : null,
    status: values.status,
  }

  if (includePassword) {
    payload.password = values.password
  }

  return payload
}
