"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { AuditInfo } from "@/components/audit-info"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ACCOUNT_TYPES,
  accountTypeLabel,
  emptyUserInput,
  needsCompany,
  needsStaffRole,
  NONE_COMPANY,
  STAFF_ROLES,
  staffRoleLabel,
  statusLabel,
  toUserInput,
  toUserPayload,
} from "@/lib/users"
import type {
  User,
  UserInput,
  AccountType,
  StaffRole,
} from "@/types/users"
import type { Company } from "@/types/companies"
import type { Role } from "@/types/roles"
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/service/users"
import { apiErrorMessage } from "@/service/core-api"

type FormMode = "create" | "edit" | "view"

type UsersCrudProps = {
  users: User[]
  companies: Company[]
  /** Roles (nhóm quyền) that can be granted; only those of the user's company are offered. */
  roles: Role[]
  /**
   * Set when the page lists the users of one company (`company` is missing when it failed
   * to load): new users are created in it and only account types that belong to a
   * company can be chosen.
   */
  scope?: { company?: Company }
  loadError?: string
  onRefresh?: () => Promise<void>
}

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-]?[a-z0-9]+)*$/

function isAccountType(value: string | null): value is AccountType {
  return typeof value === "string" && ACCOUNT_TYPES.some((item) => item.value === value)
}

function isStaffRole(value: string | null): value is StaffRole {
  return typeof value === "string" && STAFF_ROLES.some((item) => item.value === value)
}

function roleNames(user: User) {
  return (user.roles ?? []).map((role) => role.name).join(", ")
}

export function UsersCrud({
  users,
  companies,
  roles,
  scope,
  loadError,
  onRefresh,
}: UsersCrudProps) {
  const scopedCompany = scope?.company
  const scopedCompanyName = scopedCompany
    ? scopedCompany.short_name || scopedCompany.name
    : ""
  const accountTypes = scope
    ? ACCOUNT_TYPES.filter((type) => needsCompany(type.value))
    : ACCOUNT_TYPES
  const canCreate = !loadError && (!scope || Boolean(scopedCompany))
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserInput>(emptyUserInput)
  const [errors, setErrors] = useState<Partial<Record<keyof UserInput, string>>>(
    {}
  )
  const [deleting, setDeleting] = useState<User | null>(null)
  const [pending, setPending] = useState(false)

  const roleNameById = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles]
  )

  const roleOptions = useMemo(
    () =>
      roles.filter(
        (role) =>
          role.company_uuid === form.company_uuid &&
          (role.is_active || form.role_ids.includes(role.id))
      ),
    [roles, form.company_uuid, form.role_ids]
  )

  const companyNameById = useMemo(() => {
    return new Map(
      companies.map((company) => [
        company.id,
        company.short_name || company.name,
      ])
    )
  }, [companies])

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return users
    }

    return users.filter((user) =>
      [
        user.username,
        user.full_name,
        user.email,
        user.phone,
        accountTypeLabel(user.account_type),
        staffRoleLabel(user.staff_role),
        user.company_uuid
          ? companyNameById.get(user.company_uuid)
          : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [users, companyNameById, query])

  const isReadOnly = formMode === "view"
  const companyItems = {
    [NONE_COMPANY]: "Không gắn nhà xe",
    ...Object.fromEntries(
      companies.map((company) => [
        company.id,
        company.short_name || company.name,
      ])
    ),
  }

  function companyLabel(uuid: string | null) {
    if (!uuid) {
      return "—"
    }
    return companyNameById.get(uuid) || "—"
  }

  function updateField<K extends keyof UserInput>(
    key: K,
    value: UserInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    if (scope && !scopedCompany) {
      return
    }
    setFormMode("create")
    setEditingId(null)
    setForm(
      scopedCompany
        ? { ...emptyUserInput, company_uuid: scopedCompany.id }
        : emptyUserInput
    )
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(user: User) {
    setFormMode("edit")
    setEditingId(user.id)
    setForm(toUserInput(user))
    setErrors({})
    setFormOpen(true)
  }

  function openView(user: User) {
    setFormMode("view")
    setEditingId(user.id)
    setForm(toUserInput(user))
    setErrors({})
    setFormOpen(true)
  }

  function validate(values: UserInput) {
    const nextErrors: Partial<Record<keyof UserInput, string>> = {}
    const username = values.username.trim().toLowerCase()

    if (!username) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập."
    } else if (!USERNAME_PATTERN.test(username)) {
      nextErrors.username =
        "Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới."
    } else {
      const duplicated = users.some(
        (user) =>
          user.username.toLowerCase() === username && user.id !== editingId
      )
      if (duplicated) {
        nextErrors.username = "Tên đăng nhập đã tồn tại."
      }
    }

    if (formMode === "create" && !values.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu."
    } else if (values.password && values.password.length < 8) {
      nextErrors.password = "Mật khẩu tối thiểu 8 ký tự."
    }

    if (values.password && values.password !== values.confirm_password) {
      nextErrors.confirm_password = "Xác nhận mật khẩu không khớp."
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Email không hợp lệ."
    } else if (values.email.trim()) {
      const duplicated = users.some(
        (user) =>
          user.email.toLowerCase() === values.email.trim().toLowerCase() &&
          user.id !== editingId
      )
      if (duplicated) {
        nextErrors.email = "Email đã tồn tại."
      }
    }

    if (
      needsCompany(values.account_type) &&
      (!values.company_uuid || values.company_uuid === NONE_COMPANY)
    ) {
      nextErrors.company_uuid = "Vui lòng chọn nhà xe cho loại tài khoản này."
    }

    if (needsStaffRole(values.account_type) && !values.staff_role) {
      nextErrors.staff_role = "Vui lòng chọn vai trò."
    }

    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const includePassword = formMode === "create" || Boolean(form.password)
    const payload = toUserPayload(form, includePassword)

    setPending(true)
    try {
      if (formMode === "create") {
        await createUser(payload)
      } else if (editingId) {
        await updateUser(editingId, payload)
      } else {
        toast.error("Không lưu được người dùng. Thử lại sau.")
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm người dùng." : "Đã cập nhật người dùng."
      )
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được người dùng. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!deleting) {
      return
    }

    setPending(true)
    try {
      await deleteUser(deleting.id)
      toast.success(`Đã xóa người dùng ${deleting.username}.`)
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được người dùng. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm người dùng"
      : formMode === "edit"
        ? "Sửa người dùng"
        : "Chi tiết người dùng"

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {scope ? (
        <Link
          href="/dashboard/companies"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}
        >
          <ArrowLeftIcon />
          Quay lại danh sách nhà xe
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Người dùng{scopedCompanyName ? ` - ${scopedCompanyName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {scope
              ? "Tạo, xem, sửa và xóa tài khoản thuộc nhà xe."
              : "Tạo, xem, sửa và xóa người dùng hệ thống."}
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={!canCreate}>
          <PlusIcon />
          Thêm người dùng
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên đăng nhập, họ tên, email..."
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Họ tên</TableHead>
                  <TableHead className="hidden md:table-cell">Loại</TableHead>
              <TableHead className="hidden lg:table-cell">Vai trò</TableHead>
              <TableHead className="hidden lg:table-cell">Nhóm quyền</TableHead>
              {scope ? null : (
                <TableHead className="hidden lg:table-cell">Nhà xe</TableHead>
              )}
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden xl:table-cell">Tạo</TableHead>
              <TableHead className="hidden xl:table-cell">Cập nhật</TableHead>
              <TableHead className="w-12 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={scope ? 9 : 10}
                  className="h-24 text-center text-muted-foreground"
                >
                  {query.trim()
                    ? "Không tìm thấy người dùng phù hợp."
                    : "Chưa có người dùng. Hãy thêm người dùng mới."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                  </TableCell>
                  <TableCell>{user.full_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {accountTypeLabel(user.account_type)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {needsStaffRole(user.account_type)
                      ? staffRoleLabel(user.staff_role)
                      : "—"}
                  </TableCell>
                  <TableCell
                    className="hidden max-w-48 truncate lg:table-cell"
                    title={roleNames(user)}
                  >
                    {roleNames(user) || "—"}
                  </TableCell>
                  {scope ? null : (
                    <TableCell className="hidden lg:table-cell">
                      {companyLabel(user.company_uuid)}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={user.status ? "default" : "outline"}>
                      {statusLabel(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <AuditInfo
                      username={user.created_by}
                      timestamp={user.created_at}
                    />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <AuditInfo
                      username={user.updated_by}
                      timestamp={user.updated_at}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">
                          Mở menu {user.username}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openView(user)}>
                          <EyeIcon />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(user)}>
                          <PencilIcon />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(user)}
                        >
                          <Trash2Icon />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>
              {formMode === "view"
                ? "Thông tin chi tiết người dùng."
                : "Nhập thông tin người dùng. Tên đăng nhập là bắt buộc."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-username">Tên đăng nhập</FieldLabel>
                <Input
                  id="user-username"
                  value={form.username}
                  onChange={(event) =>
                    updateField("username", event.target.value.toLowerCase())
                  }
                  placeholder="admin"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.username)}
                />
                {errors.username ? (
                  <FieldError>{errors.username}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="user-full-name">Họ tên</FieldLabel>
                <Input
                  id="user-full-name"
                  value={form.full_name}
                  onChange={(event) =>
                    updateField("full_name", event.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {isReadOnly ? null : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="user-password">Mật khẩu</FieldLabel>
                  <Input
                    id="user-password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    placeholder={
                      formMode === "edit" ? "Để trống nếu không đổi" : "Tối thiểu 8 ký tự"
                    }
                    disabled={isReadOnly}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {formMode === "edit" ? (
                    <FieldDescription>
                      Để trống nếu không đổi mật khẩu.
                    </FieldDescription>
                  ) : null}
                  {errors.password ? (
                    <FieldError>{errors.password}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-confirm-password">
                    Xác nhận mật khẩu
                  </FieldLabel>
                  <Input
                    id="user-confirm-password"
                    type="password"
                    value={form.confirm_password}
                    onChange={(event) =>
                      updateField("confirm_password", event.target.value)
                    }
                    placeholder="Nhập lại mật khẩu"
                    disabled={isReadOnly}
                    aria-invalid={Boolean(errors.confirm_password)}
                  />
                  {errors.confirm_password ? (
                    <FieldError>{errors.confirm_password}</FieldError>
                  ) : null}
                </Field>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-account-type">Loại tài khoản</FieldLabel>
                <Select
                  value={form.account_type}
                  items={Object.fromEntries(
                    accountTypes.map((type) => [type.value, type.label])
                  )}
                  onValueChange={(value) => {
                    if (!isAccountType(value)) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      account_type: value,
                      company_uuid:
                        scope || needsCompany(value)
                          ? current.company_uuid
                          : NONE_COMPANY,
                      role_ids: needsCompany(value) ? current.role_ids : [],
                      staff_role: needsStaffRole(value)
                        ? current.staff_role || "STAFF"
                        : "",
                    }))
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger id="user-account-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {scope ? (
                <Field>
                  <FieldLabel htmlFor="user-company">Nhà xe</FieldLabel>
                  <Input id="user-company" value={scopedCompanyName} disabled />
                </Field>
              ) : needsCompany(form.account_type) ? (
                <Field>
                  <FieldLabel htmlFor="user-company">Nhà xe</FieldLabel>
                  <Select
                    value={form.company_uuid}
                    items={companyItems}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        company_uuid: value ?? NONE_COMPANY,
                        role_ids:
                          value === current.company_uuid ? current.role_ids : [],
                      }))
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger
                      id="user-company"
                      className="w-full"
                      aria-invalid={Boolean(errors.company_uuid)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_COMPANY}>Không gắn nhà xe</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.short_name || company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.company_uuid ? (
                    <FieldError>{errors.company_uuid}</FieldError>
                  ) : null}
                </Field>
              ) : null}
            </div>

            {needsCompany(form.account_type) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {needsStaffRole(form.account_type) ? (
                  <Field>
                    <FieldLabel htmlFor="user-staff-role">Vai trò</FieldLabel>
                    <Select
                      value={form.staff_role || "STAFF"}
                      items={Object.fromEntries(
                        STAFF_ROLES.map((role) => [role.value, role.label])
                      )}
                      onValueChange={(value) => {
                        if (isStaffRole(value)) {
                          updateField("staff_role", value)
                        }
                      }}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger
                        id="user-staff-role"
                        className="w-full"
                        aria-invalid={Boolean(errors.staff_role)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.staff_role ? (
                      <FieldError>{errors.staff_role}</FieldError>
                    ) : null}
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="user-roles">Nhóm quyền</FieldLabel>
                  <Select
                    multiple
                    value={form.role_ids}
                    onValueChange={(value) => updateField("role_ids", value)}
                    disabled={isReadOnly || roleOptions.length === 0}
                  >
                    <SelectTrigger id="user-roles" className="w-full">
                      <SelectValue>
                        {(value: string[]) =>
                          value.length > 0 ? (
                            <span className="truncate">
                              {value
                                .map((id) => roleNameById.get(id) ?? id)
                                .join(", ")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {roleOptions.length > 0
                                ? "Chọn nhóm quyền"
                                : "Không có nhóm quyền"}
                            </span>
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                          {role.is_active ? null : (
                            <span className="text-muted-foreground">(ngưng)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {roleOptions.length === 0 &&
                  form.company_uuid &&
                  form.company_uuid !== NONE_COMPANY ? (
                    <FieldDescription>
                      Nhà xe chưa có vai trò. Tạo trong mục Vai trò của nhà xe.
                    </FieldDescription>
                  ) : null}
                </Field>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-email">Email</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="admin@busnet.vn"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? <FieldError>{errors.email}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="user-phone">Số điện thoại</FieldLabel>
                <Input
                  id="user-phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="0901 234 567"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="user-status">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="user-status"
                  checked={form.status}
                  onCheckedChange={(checked) => updateField("status", checked)}
                  disabled={isReadOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {statusLabel(form.status)}
                </span>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            {isReadOnly ? (
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Đóng
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={pending}
                >
                  Hủy
                </Button>
                <Button onClick={() => void handleSave()} disabled={pending}>
                  {pending
                    ? "Đang lưu..."
                    : formMode === "create"
                      ? "Thêm người dùng"
                      : "Lưu thay đổi"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription>
              Người dùng {deleting?.username} sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={pending}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
