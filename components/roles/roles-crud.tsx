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
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyRoleInput,
  statusLabel,
  toRoleInput,
  toRolePayload,
} from "@/lib/roles"
import type { Company } from "@/types/companies"
import type { PermissionGroup } from "@/types/permissions"
import type { Role, RoleInput } from "@/types/roles"
import { apiErrorMessage } from "@/service/core-api"
import { createRole, deleteRole, updateRole } from "@/service/roles"

type FormMode = "create" | "edit" | "view"

type RolesCrudProps = {
  /** Every role shown and created belongs to this company; missing when it failed to load. */
  company?: Company
  roles: Role[]
  permissionGroups: PermissionGroup[]
  loadError?: string
  onRefresh?: () => Promise<void>
}

type FormErrors = Partial<Record<keyof RoleInput, string>>

export function RolesCrud({
  company,
  roles,
  permissionGroups,
  loadError,
  onRefresh,
}: RolesCrudProps) {
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RoleInput>(emptyRoleInput())
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [pending, setPending] = useState(false)

  const filteredRoles = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return roles
    }

    return roles.filter((role) =>
      [role.name, role.description]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [roles, query])

  const selectedPermissions = useMemo(
    () => new Set(form.permission_ids),
    [form.permission_ids]
  )

  const isReadOnly = formMode === "view"
  const canCreate = Boolean(company) && !loadError
  const companyName = company ? company.short_name || company.name : ""

  function updateField<K extends keyof RoleInput>(key: K, value: RoleInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setPermissions(ids: string[], checked: boolean) {
    setForm((current) => {
      const next = new Set(current.permission_ids)
      for (const id of ids) {
        if (checked) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }
      return { ...current, permission_ids: [...next] }
    })
  }

  function openCreate() {
    if (!company) {
      return
    }
    setFormMode("create")
    setEditingId(null)
    setForm(emptyRoleInput(company.id))
    setErrors({})
    setFormOpen(true)
  }

  function openForm(role: Role, mode: Exclude<FormMode, "create">) {
    setFormMode(mode)
    setEditingId(role.id)
    setForm(toRoleInput(role))
    setErrors({})
    setFormOpen(true)
  }

  function validate(values: RoleInput) {
    const nextErrors: FormErrors = {}
    const name = values.name.trim().toLowerCase()

    if (!name) {
      nextErrors.name = "Vui lòng nhập tên vai trò."
    } else if (
      roles.some(
        (role) => role.id !== editingId && role.name.toLowerCase() === name
      )
    ) {
      nextErrors.name = "Tên vai trò đã tồn tại trong nhà xe."
    }

    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setPending(true)
    try {
      if (formMode === "create") {
        await createRole(form)
      } else if (editingId) {
        await updateRole(editingId, toRolePayload(form))
      } else {
        toast.error("Không lưu được vai trò. Thử lại sau.")
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm vai trò." : "Đã cập nhật vai trò."
      )
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được vai trò. Thử lại sau."))
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
      await deleteRole(deleting.id)
      toast.success(`Đã xóa vai trò ${deleting.name}.`)
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được vai trò. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm vai trò"
      : formMode === "edit"
        ? "Sửa vai trò"
        : "Chi tiết vai trò"

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Link
        href="/dashboard/companies"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "w-fit" })}
      >
        <ArrowLeftIcon />
        Quay lại danh sách nhà xe
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Vai trò{companyName ? ` - ${companyName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, xem, sửa, xóa vai trò của nhà xe và gán chức năng cho từng vai trò.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={!canCreate}>
          <PlusIcon />
          Thêm vai trò
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm tên, mô tả vai trò..."
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên vai trò</TableHead>
              <TableHead className="hidden md:table-cell">Mô tả</TableHead>
              <TableHead>Chức năng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Tạo</TableHead>
              <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
              <TableHead className="w-12 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {roles.length === 0
                    ? "Chưa có vai trò. Hãy thêm vai trò mới."
                    : "Không tìm thấy vai trò phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="hidden max-w-72 truncate text-muted-foreground md:table-cell">
                    {role.description || "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-56 truncate"
                    title={role.permissions.map((item) => item.name).join(", ")}
                  >
                    {role.permissions.length
                      ? `${role.permissions.length} chức năng`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? "default" : "outline"}>
                      {statusLabel(role.is_active)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={role.created_by}
                      timestamp={role.created_at}
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={role.updated_by}
                      timestamp={role.updated_at}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">Mở menu {role.name}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openForm(role, "view")}>
                          <EyeIcon />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openForm(role, "edit")}>
                          <PencilIcon />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(role)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>
              {formMode === "view"
                ? "Thông tin chi tiết vai trò."
                : "Tên vai trò không được trùng trong nhà xe. Chọn các chức năng mà vai trò được phép dùng."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="role-company">Nhà xe</FieldLabel>
              <Input id="role-company" value={companyName} disabled />
            </Field>

            <Field>
              <FieldLabel htmlFor="role-name">Tên vai trò</FieldLabel>
              <Input
                id="role-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Kế toán"
                disabled={isReadOnly}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="role-description">Mô tả</FieldLabel>
              <Textarea
                id="role-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Phạm vi công việc của vai trò..."
                disabled={isReadOnly}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="role-status">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="role-status"
                  checked={form.is_active}
                  onCheckedChange={(checked) => updateField("is_active", checked)}
                  disabled={isReadOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {statusLabel(form.is_active)}
                </span>
              </div>
            </Field>

            <Field>
              <FieldLabel>Chức năng được phép</FieldLabel>
              <FieldDescription>
                Đã chọn {form.permission_ids.length} chức năng.
              </FieldDescription>
              {permissionGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có chức năng nào. Hãy tạo trong mục Hệ thống → Chức năng.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {permissionGroups.map((group) => (
                    <PermissionGroupChecklist
                      key={group.id}
                      group={group}
                      selected={selectedPermissions}
                      disabled={isReadOnly}
                      onChange={setPermissions}
                    />
                  ))}
                </div>
              )}
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
                      ? "Thêm vai trò"
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
            <AlertDialogTitle>Xóa vai trò?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai trò {deleting?.name} sẽ bị xóa khỏi hệ thống, đồng thời bị gỡ
              khỏi các người dùng đang được gán.
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

function PermissionGroupChecklist({
  group,
  selected,
  disabled,
  onChange,
}: {
  group: PermissionGroup
  selected: Set<string>
  disabled: boolean
  onChange: (ids: string[], checked: boolean) => void
}) {
  const ids = group.permissions.map((permission) => permission.id)
  const selectedCount = ids.filter((id) => selected.has(id)).length
  const allSelected = ids.length > 0 && selectedCount === ids.length
  const groupCheckboxId = `role-group-${group.id}`

  return (
    <div className="rounded-lg border p-3">
      <Field orientation="horizontal" className="items-center gap-2">
        <Checkbox
          id={groupCheckboxId}
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          onCheckedChange={(checked) => onChange(ids, checked === true)}
          disabled={disabled || ids.length === 0}
        />
        <FieldLabel htmlFor={groupCheckboxId} className="flex-1">
          {group.name}
          <span className="font-normal text-muted-foreground">
            {" "}
            · {group.code}
          </span>
        </FieldLabel>
        <span className="text-xs text-muted-foreground">
          {selectedCount}/{ids.length}
        </span>
      </Field>

      {ids.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Nhóm chưa có chức năng.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 pl-6 sm:grid-cols-2">
          {group.permissions.map((permission) => {
            const checkboxId = `role-permission-${permission.id}`
            return (
              <Field
                key={permission.id}
                orientation="horizontal"
                className="items-start gap-2"
              >
                <Checkbox
                  id={checkboxId}
                  checked={selected.has(permission.id)}
                  onCheckedChange={(checked) =>
                    onChange([permission.id], checked === true)
                  }
                  disabled={disabled}
                />
                <FieldLabel
                  htmlFor={checkboxId}
                  className="flex flex-col items-start gap-0 font-normal"
                >
                  <span>
                    {permission.name}
                    {permission.is_active ? null : (
                      <span className="text-muted-foreground"> (ngưng)</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {permission.code}
                  </span>
                </FieldLabel>
              </Field>
            )
          })}
        </div>
      )}
    </div>
  )
}
