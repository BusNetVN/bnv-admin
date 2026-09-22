"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
} from "@/actions/accounts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  emptyAccountInput,
  needsCompany,
  needsStaffRole,
  NONE_COMPANY,
  STAFF_ROLES,
  staffRoleLabel,
  statusLabel,
  toAccountInput,
  toAccountPayload,
  type Account,
  type AccountInput,
  type AccountType,
  type StaffRole,
} from "@/lib/accounts"
import type { Operator } from "@/lib/operators"

type FormMode = "create" | "edit" | "view"

type AccountsCrudProps = {
  accounts: Account[]
  companies: Operator[]
  loadError?: string
}

const USERNAME_PATTERN = /^[a-z0-9]+(?:[._-]?[a-z0-9]+)*$/

function isAccountType(value: string | null): value is AccountType {
  return typeof value === "string" && ACCOUNT_TYPES.some((item) => item.value === value)
}

function isStaffRole(value: string | null): value is StaffRole {
  return typeof value === "string" && STAFF_ROLES.some((item) => item.value === value)
}

export function AccountsCrud({
  accounts,
  companies,
  loadError,
}: AccountsCrudProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AccountInput>(emptyAccountInput)
  const [errors, setErrors] = useState<Partial<Record<keyof AccountInput, string>>>(
    {}
  )
  const [deleting, setDeleting] = useState<Account | null>(null)
  const [pending, setPending] = useState(false)

  const companyNameById = useMemo(() => {
    return new Map(
      companies.map((company) => [
        company.id,
        company.short_name || company.name,
      ])
    )
  }, [companies])

  const filteredAccounts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return accounts
    }

    return accounts.filter((account) =>
      [
        account.username,
        account.full_name,
        account.email,
        account.phone,
        accountTypeLabel(account.account_type),
        staffRoleLabel(account.staff_role),
        account.company_uuid
          ? companyNameById.get(account.company_uuid)
          : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [accounts, companyNameById, query])

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

  function updateField<K extends keyof AccountInput>(
    key: K,
    value: AccountInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setFormMode("create")
    setEditingId(null)
    setForm(emptyAccountInput)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(account: Account) {
    setFormMode("edit")
    setEditingId(account.id)
    setForm(toAccountInput(account))
    setErrors({})
    setFormOpen(true)
  }

  function openView(account: Account) {
    setFormMode("view")
    setEditingId(account.id)
    setForm(toAccountInput(account))
    setErrors({})
    setFormOpen(true)
  }

  function validate(values: AccountInput) {
    const nextErrors: Partial<Record<keyof AccountInput, string>> = {}
    const username = values.username.trim().toLowerCase()

    if (!username) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập."
    } else if (!USERNAME_PATTERN.test(username)) {
      nextErrors.username =
        "Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới."
    } else {
      const duplicated = accounts.some(
        (account) =>
          account.username.toLowerCase() === username && account.id !== editingId
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
      const duplicated = accounts.some(
        (account) =>
          account.email.toLowerCase() === values.email.trim().toLowerCase() &&
          account.id !== editingId
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
    const payload = toAccountPayload(form, includePassword)

    setPending(true)
    try {
      const result =
        formMode === "create"
          ? await createAccountAction(payload)
          : editingId
            ? await updateAccountAction(editingId, payload)
            : { ok: false as const, message: "Không lưu được tài khoản. Thử lại sau." }

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm tài khoản." : "Đã cập nhật tài khoản."
      )
      setFormOpen(false)
      router.refresh()
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
      const result = await deleteAccountAction(deleting.id)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(`Đã xóa tài khoản ${deleting.username}.`)
      setDeleting(null)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm tài khoản"
      : formMode === "edit"
        ? "Sửa tài khoản"
        : "Chi tiết tài khoản"

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, xem, sửa và xóa tài khoản đăng nhập.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={Boolean(loadError)}>
          <PlusIcon />
          Thêm tài khoản
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
              <TableHead className="hidden lg:table-cell">Nhà xe</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-12 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {query.trim()
                    ? "Không tìm thấy tài khoản phù hợp."
                    : "Chưa có tài khoản. Hãy thêm tài khoản mới."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    {account.username}
                  </TableCell>
                  <TableCell>{account.full_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {accountTypeLabel(account.account_type)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {needsStaffRole(account.account_type)
                      ? staffRoleLabel(account.staff_role)
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {companyLabel(account.company_uuid)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {account.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.status ? "default" : "outline"}>
                      {statusLabel(account.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">
                          Mở menu {account.username}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openView(account)}>
                          <EyeIcon />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(account)}>
                          <PencilIcon />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(account)}
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
                ? "Thông tin chi tiết tài khoản."
                : "Nhập thông tin tài khoản. Tên đăng nhập là bắt buộc."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="account-username">Tên đăng nhập</FieldLabel>
                <Input
                  id="account-username"
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
                <FieldLabel htmlFor="account-full-name">Họ tên</FieldLabel>
                <Input
                  id="account-full-name"
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
                  <FieldLabel htmlFor="account-password">Mật khẩu</FieldLabel>
                  <Input
                    id="account-password"
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
                  <FieldLabel htmlFor="account-confirm-password">
                    Xác nhận mật khẩu
                  </FieldLabel>
                  <Input
                    id="account-confirm-password"
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
                <FieldLabel htmlFor="account-type">Loại tài khoản</FieldLabel>
                <Select
                  value={form.account_type}
                  items={Object.fromEntries(
                    ACCOUNT_TYPES.map((type) => [type.value, type.label])
                  )}
                  onValueChange={(value) => {
                    if (!isAccountType(value)) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      account_type: value,
                      staff_role: needsStaffRole(value)
                        ? current.staff_role || "STAFF"
                        : "",
                    }))
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger id="account-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="account-company">Nhà xe</FieldLabel>
                <Select
                  value={form.company_uuid}
                  items={companyItems}
                  onValueChange={(value) =>
                    updateField("company_uuid", value ?? NONE_COMPANY)
                  }
                  disabled={isReadOnly}
                >
                  <SelectTrigger
                    id="account-company"
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
            </div>

            {needsStaffRole(form.account_type) ? (
              <Field>
                <FieldLabel htmlFor="account-staff-role">Vai trò</FieldLabel>
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
                    id="account-staff-role"
                    className="w-full sm:max-w-xs"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="account-email">Email</FieldLabel>
                <Input
                  id="account-email"
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
                <FieldLabel htmlFor="account-phone">Số điện thoại</FieldLabel>
                <Input
                  id="account-phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="0901 234 567"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="account-status">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="account-status"
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
                      ? "Thêm tài khoản"
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
            <AlertDialogTitle>Xóa tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản {deleting?.username} sẽ bị xóa khỏi hệ thống.
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
