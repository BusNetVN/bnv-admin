"use client"

import { useMemo, useState } from "react"
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleOffIcon,
  EyeIcon,
  KeyRoundIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { AuditInfo } from "@/components/audit-info"
import { formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  emptyPermissionGroupInput,
  emptyPermissionInput,
  PERMISSION_CODE_PATTERN,
  parseSortOrder,
  STANDARD_PERMISSIONS,
  statusLabel,
  toPermissionGroupInput,
  toPermissionGroupPayload,
  toPermissionInput,
  toPermissionPayload,
} from "@/lib/permissions"
import type {
  Permission,
  PermissionGroup,
  PermissionGroupInput,
  PermissionInput,
} from "@/types/permissions"
import {
  createPermission,
  createPermissionGroup,
  deletePermission,
  deletePermissionGroup,
  updatePermission,
  updatePermissionGroup,
} from "@/service/permissions"
import { apiErrorMessage } from "@/service/core-api"

type FormMode = "create" | "edit" | "view"

type PermissionsCrudProps = {
  groups: PermissionGroup[]
  loadError?: string
  onRefresh?: () => Promise<void>
}

type DeletingTarget =
  | { type: "group"; item: PermissionGroup }
  | { type: "permission"; item: Permission; group: PermissionGroup }

export function PermissionsCrud({
  groups,
  loadError,
  onRefresh,
}: PermissionsCrudProps) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupMode, setGroupMode] = useState<FormMode>("create")
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupForm, setGroupForm] = useState<PermissionGroupInput>(
    emptyPermissionGroupInput()
  )
  const [groupErrors, setGroupErrors] = useState<
    Partial<Record<keyof PermissionGroupInput, string>>
  >({})
  const [permissionOpen, setPermissionOpen] = useState(false)
  const [permissionMode, setPermissionMode] = useState<FormMode>("create")
  const [activeGroup, setActiveGroup] = useState<PermissionGroup | null>(null)
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null)
  const [permissionForm, setPermissionForm] = useState<PermissionInput>(
    emptyPermissionInput()
  )
  const [permissionErrors, setPermissionErrors] = useState<
    Partial<Record<keyof PermissionInput, string>>
  >({})
  const [deleting, setDeleting] = useState<DeletingTarget | null>(null)
  const [pending, setPending] = useState(false)

  const filteredGroups = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return groups
    }

    return groups.filter((group) =>
      [
        group.name,
        group.code,
        group.description,
        ...group.permissions.flatMap((item) => [item.name, item.code]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [groups, query])

  const stats = useMemo(() => {
    const all = groups.flatMap((group) => group.permissions)
    const active = all.filter((item) => item.is_active).length
    return {
      groups: groups.length,
      permissions: all.length,
      active,
      inactive: all.length - active,
    }
  }, [groups])

  const isGroupReadOnly = groupMode === "view"
  const isPermissionReadOnly = permissionMode === "view"

  function toggleGroup(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function updateGroupField<K extends keyof PermissionGroupInput>(
    key: K,
    value: PermissionGroupInput[K]
  ) {
    setGroupForm((current) => ({ ...current, [key]: value }))
  }

  function updatePermissionField<K extends keyof PermissionInput>(
    key: K,
    value: PermissionInput[K]
  ) {
    setPermissionForm((current) => ({ ...current, [key]: value }))
  }

  function openCreateGroup() {
    setGroupMode("create")
    setEditingGroupId(null)
    setGroupForm(emptyPermissionGroupInput())
    setGroupErrors({})
    setGroupOpen(true)
  }

  function openEditGroup(group: PermissionGroup) {
    setGroupMode("edit")
    setEditingGroupId(group.id)
    setGroupForm(toPermissionGroupInput(group))
    setGroupErrors({})
    setGroupOpen(true)
  }

  function openViewGroup(group: PermissionGroup) {
    setGroupMode("view")
    setEditingGroupId(group.id)
    setGroupForm(toPermissionGroupInput(group))
    setGroupErrors({})
    setGroupOpen(true)
  }

  function openCreatePermission(group: PermissionGroup) {
    setPermissionMode("create")
    setActiveGroup(group)
    setEditingPermissionId(null)
    setPermissionForm(emptyPermissionInput(group.code))
    setPermissionErrors({})
    setPermissionOpen(true)
  }

  function openEditPermission(group: PermissionGroup, item: Permission) {
    setPermissionMode("edit")
    setActiveGroup(group)
    setEditingPermissionId(item.id)
    setPermissionForm(toPermissionInput(item))
    setPermissionErrors({})
    setPermissionOpen(true)
  }

  function openViewPermission(group: PermissionGroup, item: Permission) {
    setPermissionMode("view")
    setActiveGroup(group)
    setEditingPermissionId(item.id)
    setPermissionForm(toPermissionInput(item))
    setPermissionErrors({})
    setPermissionOpen(true)
  }

  function validateGroup(values: PermissionGroupInput) {
    const nextErrors: Partial<Record<keyof PermissionGroupInput, string>> = {}
    const code = values.code.trim().toUpperCase()
    const name = values.name.trim()
    const sortOrder = parseSortOrder(values.sort_order)

    if (!name) {
      nextErrors.name = "Vui lòng nhập tên nhóm chức năng."
    }

    if (!code) {
      nextErrors.code = "Vui lòng nhập mã nhóm."
    } else if (!PERMISSION_CODE_PATTERN.test(code)) {
      nextErrors.code =
        "Mã nhóm chỉ gồm chữ hoa, số, gạch ngang hoặc gạch dưới."
    } else {
      const duplicated = groups.some(
        (group) => group.code === code && group.id !== editingGroupId
      )
      if (duplicated) {
        nextErrors.code = "Mã nhóm chức năng đã tồn tại."
      }
    }

    if (!sortOrder.ok) {
      nextErrors.sort_order = "Thứ tự phải là số từ 0 đến 9999."
    }

    return nextErrors
  }

  function validatePermission(values: PermissionInput) {
    const nextErrors: Partial<Record<keyof PermissionInput, string>> = {}
    const code = values.code.trim().toUpperCase()
    const name = values.name.trim()
    const sortOrder = parseSortOrder(values.sort_order)

    if (!name) {
      nextErrors.name = "Vui lòng nhập tên chức năng."
    } else if (activeGroup) {
      const duplicated = activeGroup.permissions.some(
        (item) =>
          item.name.toLowerCase() === name.toLowerCase() &&
          item.id !== editingPermissionId
      )
      if (duplicated) {
        nextErrors.name = "Tên chức năng đã tồn tại trong nhóm này."
      }
    }

    if (!code) {
      nextErrors.code = "Vui lòng nhập mã chức năng."
    } else if (!PERMISSION_CODE_PATTERN.test(code)) {
      nextErrors.code =
        "Mã chức năng chỉ gồm chữ hoa, số, gạch ngang hoặc gạch dưới."
    } else {
      const duplicated = groups.some((group) =>
        group.permissions.some(
          (item) => item.code === code && item.id !== editingPermissionId
        )
      )
      if (duplicated) {
        nextErrors.code = "Mã chức năng đã tồn tại."
      }
    }

    if (!sortOrder.ok) {
      nextErrors.sort_order = "Thứ tự phải là số từ 0 đến 9999."
    }

    return nextErrors
  }

  async function handleSaveGroup() {
    const nextErrors = validateGroup(groupForm)
    setGroupErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = toPermissionGroupPayload(groupForm, groupMode === "create")
    setPending(true)
    try {
      if (groupMode === "create") {
        await createPermissionGroup(payload)
      } else if (editingGroupId) {
        await updatePermissionGroup(editingGroupId, payload)
      } else {
        toast.error("Không lưu được nhóm chức năng.")
        return
      }

      toast.success(
        groupMode === "create"
          ? "Đã thêm nhóm chức năng."
          : "Đã cập nhật nhóm chức năng."
      )
      setGroupOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "Không lưu được nhóm chức năng. Thử lại sau.")
      )
    } finally {
      setPending(false)
    }
  }

  async function handleSavePermission() {
    if (!activeGroup) {
      return
    }

    const nextErrors = validatePermission(permissionForm)
    setPermissionErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = toPermissionPayload(permissionForm)
    setPending(true)
    try {
      if (permissionMode === "create") {
        await createPermission(activeGroup.id, payload)
      } else if (editingPermissionId) {
        await updatePermission(editingPermissionId, payload)
      } else {
        toast.error("Không lưu được chức năng.")
        return
      }

      toast.success(
        permissionMode === "create" ? "Đã thêm chức năng." : "Đã cập nhật chức năng."
      )
      setPermissionOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được chức năng. Thử lại sau."))
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
      if (deleting.type === "group") {
        await deletePermissionGroup(deleting.item.id)
      } else {
        await deletePermission(deleting.item.id)
      }

      toast.success(
        deleting.type === "group"
          ? `Đã xóa nhóm ${deleting.item.name}.`
          : `Đã xóa chức năng ${deleting.item.name}.`
      )
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được mục. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const groupTitle =
    groupMode === "create"
      ? "Thêm nhóm chức năng"
      : groupMode === "edit"
        ? "Sửa nhóm chức năng"
        : "Chi tiết nhóm chức năng"

  const permissionTitle =
    permissionMode === "create"
      ? `Thêm chức năng${activeGroup ? ` · ${activeGroup.name}` : ""}`
      : permissionMode === "edit"
        ? `Sửa chức năng${activeGroup ? ` · ${activeGroup.name}` : ""}`
        : `Chi tiết chức năng${activeGroup ? ` · ${activeGroup.name}` : ""}`

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Chức năng
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhóm chức năng và các thao tác như Tạo, Cập nhật, Xóa, Lấy danh
            sách.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreateGroup} disabled={Boolean(loadError)}>
          <PlusIcon />
          Thêm nhóm
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo nhóm hoặc chức năng..."
            className="pl-8"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Nhóm",
              value: stats.groups,
              icon: LayersIcon,
              tone: "bg-primary/10 text-primary",
            },
            {
              label: "Chức năng",
              value: stats.permissions,
              icon: KeyRoundIcon,
              tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            },
            {
              label: "Hoạt động",
              value: stats.active,
              icon: CircleCheckIcon,
              tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "Ngưng hoạt động",
              value: stats.inactive,
              icon: CircleOffIcon,
              tone: "bg-muted text-muted-foreground",
            },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border px-3 py-2"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="text-lg font-semibold tabular-nums">{value}</p>
                <p className="truncate text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-xl border px-6 py-16 text-center text-sm text-muted-foreground">
          {query.trim()
            ? "Không tìm thấy nhóm hoặc chức năng phù hợp."
            : "Chưa có nhóm chức năng. Hãy thêm nhóm mới, ví dụ Tài khoản."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const isCollapsed = !expanded.has(group.id)
            return (
              <div key={group.id} className="overflow-hidden rounded-xl border">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? "Mở nhóm" : "Thu nhóm"}
                  >
                    <ChevronDownIcon
                      className={`size-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{group.name}</p>
                      <Badge variant="outline">{group.code}</Badge>
                      <Badge variant={group.is_active ? "default" : "outline"}>
                        {statusLabel(group.is_active)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.permissions.length} chức năng
                      </span>
                    </div>
                    {group.description ? (
                      <p className="truncate text-sm text-muted-foreground">
                        {group.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Tạo: {group.created_by || "—"} ·{" "}
                      {formatDateTime(group.created_at)}
                      <span className="mx-2">—</span>
                      Cập nhật: {group.updated_by || "—"} ·{" "}
                      {formatDateTime(group.updated_at)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreatePermission(group)}
                  >
                    <PlusIcon />
                    Thêm chức năng
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Mở menu {group.name}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewGroup(group)}>
                        <EyeIcon />
                        Xem nhóm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditGroup(group)}>
                        <PencilIcon />
                        Sửa nhóm
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting({ type: "group", item: group })}
                      >
                        <Trash2Icon />
                        Xóa nhóm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isCollapsed ? null : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chức năng</TableHead>
                        <TableHead>Mã</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Mô tả
                        </TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="hidden lg:table-cell">Tạo</TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Cập nhật
                        </TableHead>
                        <TableHead className="w-12 text-right"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.permissions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="h-16 text-center text-muted-foreground"
                          >
                            Nhóm chưa có chức năng.
                          </TableCell>
                        </TableRow>
                      ) : (
                        group.permissions.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.code}
                            </TableCell>
                            <TableCell className="hidden max-w-xs truncate md:table-cell">
                              {item.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={item.is_active ? "default" : "outline"}
                              >
                                {statusLabel(item.is_active)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <AuditInfo
                                username={item.created_by}
                                timestamp={item.created_at}
                              />
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <AuditInfo
                                username={item.updated_by}
                                timestamp={item.updated_at}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button variant="ghost" size="icon-sm" />
                                  }
                                >
                                  <MoreHorizontalIcon />
                                  <span className="sr-only">
                                    Mở menu {item.name}
                                  </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openViewPermission(group, item)}
                                  >
                                    <EyeIcon />
                                    Xem
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openEditPermission(group, item)}
                                  >
                                    <PencilIcon />
                                    Sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      setDeleting({
                                        type: "permission",
                                        item,
                                        group,
                                      })
                                    }
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
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{groupTitle}</DialogTitle>
            <DialogDescription>
              {groupMode === "view"
                ? "Thông tin chi tiết nhóm chức năng."
                : "Nhóm chứa các thao tác, ví dụ Tài khoản gồm Tạo, Cập nhật, Xóa, Lấy danh sách."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="group-name">Tên nhóm</FieldLabel>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(event) => updateGroupField("name", event.target.value)}
                placeholder="Tài khoản"
                disabled={isGroupReadOnly}
                aria-invalid={Boolean(groupErrors.name)}
              />
              {groupErrors.name ? (
                <FieldError>{groupErrors.name}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="group-code">Mã nhóm</FieldLabel>
                <Input
                  id="group-code"
                  value={groupForm.code}
                  onChange={(event) =>
                    updateGroupField("code", event.target.value.toUpperCase())
                  }
                  placeholder="ACCOUNTS"
                  disabled={isGroupReadOnly}
                  aria-invalid={Boolean(groupErrors.code)}
                />
                {groupMode === "edit" ? (
                  <FieldDescription>
                    Đổi mã nhóm sẽ cập nhật tiền tố mã các chức năng trong nhóm.
                  </FieldDescription>
                ) : null}
                {groupErrors.code ? (
                  <FieldError>{groupErrors.code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="group-sort">Thứ tự</FieldLabel>
                <Input
                  id="group-sort"
                  inputMode="numeric"
                  value={groupForm.sort_order}
                  onChange={(event) =>
                    updateGroupField("sort_order", event.target.value)
                  }
                  placeholder="Tự tăng"
                  disabled={isGroupReadOnly}
                  aria-invalid={Boolean(groupErrors.sort_order)}
                />
                {groupErrors.sort_order ? (
                  <FieldError>{groupErrors.sort_order}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="group-description">Mô tả</FieldLabel>
              <Textarea
                id="group-description"
                value={groupForm.description}
                onChange={(event) =>
                  updateGroupField("description", event.target.value)
                }
                placeholder="Quản lý tài khoản đăng nhập"
                disabled={isGroupReadOnly}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="group-is-active">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="group-is-active"
                  checked={groupForm.is_active}
                  onCheckedChange={(checked) =>
                    updateGroupField("is_active", checked)
                  }
                  disabled={isGroupReadOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {statusLabel(groupForm.is_active)}
                </span>
              </div>
            </Field>

            {groupMode === "create" ? (
              <Field orientation="horizontal" className="items-start gap-2">
                <Checkbox
                  id="group-seed"
                  checked={groupForm.seed_standard_permissions}
                  onCheckedChange={(checked) =>
                    updateGroupField("seed_standard_permissions", checked === true)
                  }
                />
                <div className="space-y-1">
                  <FieldLabel htmlFor="group-seed" className="font-normal">
                    Tạo các chức năng chuẩn
                  </FieldLabel>
                  <FieldDescription>
                    {STANDARD_PERMISSIONS.map((item) => item.name).join(", ")}.
                  </FieldDescription>
                </div>
              </Field>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>
              {isGroupReadOnly ? "Đóng" : "Hủy"}
            </Button>
            {isGroupReadOnly ? null : (
              <Button onClick={handleSaveGroup} disabled={pending}>
                {pending ? "Đang lưu..." : "Lưu"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionOpen} onOpenChange={setPermissionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{permissionTitle}</DialogTitle>
            <DialogDescription>
              {permissionMode === "view"
                ? "Thông tin chi tiết chức năng."
                : "Mỗi chức năng là một thao tác trong nhóm, ví dụ Tạo hoặc Lấy danh sách."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="permission-name">Tên chức năng</FieldLabel>
              <Input
                id="permission-name"
                value={permissionForm.name}
                onChange={(event) =>
                  updatePermissionField("name", event.target.value)
                }
                placeholder="Tạo"
                disabled={isPermissionReadOnly}
                aria-invalid={Boolean(permissionErrors.name)}
              />
              {permissionErrors.name ? (
                <FieldError>{permissionErrors.name}</FieldError>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="permission-code">Mã chức năng</FieldLabel>
                <Input
                  id="permission-code"
                  value={permissionForm.code}
                  onChange={(event) =>
                    updatePermissionField("code", event.target.value.toUpperCase())
                  }
                  placeholder={
                    activeGroup ? `${activeGroup.code}_CREATE` : "USER_CREATE"
                  }
                  disabled={isPermissionReadOnly}
                  aria-invalid={Boolean(permissionErrors.code)}
                />
                {permissionErrors.code ? (
                  <FieldError>{permissionErrors.code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="permission-sort">Thứ tự</FieldLabel>
                <Input
                  id="permission-sort"
                  inputMode="numeric"
                  value={permissionForm.sort_order}
                  onChange={(event) =>
                    updatePermissionField("sort_order", event.target.value)
                  }
                  placeholder="Tự tăng"
                  disabled={isPermissionReadOnly}
                  aria-invalid={Boolean(permissionErrors.sort_order)}
                />
                {permissionErrors.sort_order ? (
                  <FieldError>{permissionErrors.sort_order}</FieldError>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="permission-description">Mô tả</FieldLabel>
              <Textarea
                id="permission-description"
                value={permissionForm.description}
                onChange={(event) =>
                  updatePermissionField("description", event.target.value)
                }
                placeholder="Tạo tài khoản mới"
                disabled={isPermissionReadOnly}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="permission-is-active">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="permission-is-active"
                  checked={permissionForm.is_active}
                  onCheckedChange={(checked) =>
                    updatePermissionField("is_active", checked)
                  }
                  disabled={isPermissionReadOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {statusLabel(permissionForm.is_active)}
                </span>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionOpen(false)}>
              {isPermissionReadOnly ? "Đóng" : "Hủy"}
            </Button>
            {isPermissionReadOnly ? null : (
              <Button onClick={handleSavePermission} disabled={pending}>
                {pending ? "Đang lưu..." : "Lưu"}
              </Button>
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
            <AlertDialogTitle>
              {deleting?.type === "group" ? "Xóa nhóm chức năng?" : "Xóa chức năng?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.type === "group"
                ? `Xóa nhóm ${deleting.item.name} sẽ xóa luôn ${deleting.item.permissions.length} chức năng bên trong.`
                : deleting
                  ? `Xóa chức năng ${deleting.item.name} khỏi nhóm ${deleting.group.name}.`
                  : null}
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
