import type {
  AccountType,
  StaffRole,
  User,
  UserInput,
  UserPayload,
} from "@/types/users"

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

export const emptyUserInput: UserInput = {
  username: "",
  password: "",
  confirm_password: "",
  full_name: "",
  email: "",
  phone: "",
  company_uuid: NONE_COMPANY,
  account_type: "COMPANY_STAFF",
  staff_role: "STAFF",
  role_ids: [],
  status: true,
}

export function toUserInput(user: User): UserInput {
  return {
    username: user.username,
    password: "",
    confirm_password: "",
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    company_uuid: user.company_uuid || NONE_COMPANY,
    account_type: user.account_type,
    staff_role: needsStaffRole(user.account_type)
      ? user.staff_role || "STAFF"
      : "",
    role_ids: (user.roles ?? []).map((role) => role.id),
    status: user.status,
  }
}

export function toUserPayload(
  values: UserInput,
  includePassword: boolean
): UserPayload {
  const payload: UserPayload = {
    username: values.username.trim().toLowerCase(),
    full_name: values.full_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    company_uuid:
      needsCompany(values.account_type) &&
      values.company_uuid &&
      values.company_uuid !== NONE_COMPANY
        ? values.company_uuid
        : null,
    account_type: values.account_type,
    staff_role: needsStaffRole(values.account_type)
      ? values.staff_role || null
      : null,
    role_ids: needsCompany(values.account_type) ? values.role_ids : [],
    status: values.status,
  }

  if (includePassword) {
    payload.password = values.password
  }

  return payload
}
