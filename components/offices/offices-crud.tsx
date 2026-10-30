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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  emptyOfficeInput,
  toOfficeInput,
  toOfficePayload,
} from "@/lib/offices"
import type { Office, OfficeInput } from "@/types/offices"
import type { Company } from "@/types/companies"
import {
  createOffice,
  deleteOffice,
  updateOffice,
} from "@/service/offices"
import { apiErrorMessage } from "@/service/core-api"

type FormMode = "create" | "edit" | "view"

type OfficesCrudProps = {
  /** Every office shown and created belongs to this company; missing when it failed to load. */
  company?: Company
  offices: Office[]
  loadError?: string
  onRefresh?: () => Promise<void>
}

type FormErrors = Partial<Record<keyof OfficeInput, string>>

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 15
}

export function OfficesCrud({
  company,
  offices,
  loadError,
  onRefresh,
}: OfficesCrudProps) {
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<OfficeInput>(emptyOfficeInput())
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleting, setDeleting] = useState<Office | null>(null)
  const [pending, setPending] = useState(false)

  const filteredOffices = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return offices
    }

    return offices.filter((office) =>
      [
        office.office_code,
        office.name,
        office.address,
        office.note,
        ...office.phones,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [offices, query])

  const isReadOnly = formMode === "view"
  const canCreate = Boolean(company) && !loadError
  const companyName = company ? company.short_name || company.name : ""

  function updateField<K extends keyof OfficeInput>(
    key: K,
    value: OfficeInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    if (!company) {
      return
    }
    setFormMode("create")
    setEditingId(null)
    setForm(emptyOfficeInput(company.id))
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(office: Office) {
    setFormMode("edit")
    setEditingId(office.id)
    setForm(toOfficeInput(office))
    setErrors({})
    setFormOpen(true)
  }

  function openView(office: Office) {
    setFormMode("view")
    setEditingId(office.id)
    setForm(toOfficeInput(office))
    setErrors({})
    setFormOpen(true)
  }

  function validate(values: OfficeInput) {
    const nextErrors: FormErrors = {}
    const officeCode = values.office_code.trim().toUpperCase()
    const phones = values.phones.map((phone) => phone.trim()).filter(Boolean)

    if (!officeCode) {
      nextErrors.office_code = "Vui lòng nhập mã văn phòng."
    }

    if (!values.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên văn phòng."
    }

    if (!values.address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ văn phòng."
    }

    if (!phones.length) {
      nextErrors.phones = "Vui lòng nhập ít nhất một số điện thoại."
    } else if (phones.some((phone) => !isPhone(phone))) {
      nextErrors.phones = "Số điện thoại không hợp lệ."
    }

    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = toOfficePayload(form)

    setPending(true)
    try {
      if (formMode === "create") {
        await createOffice({
          ...form,
          ...payload,
        })
      } else if (editingId) {
        await updateOffice(editingId, payload)
      } else {
        toast.error("Không lưu được văn phòng. Thử lại sau.")
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm văn phòng." : "Đã cập nhật văn phòng."
      )
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được văn phòng. Thử lại sau."))
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
      await deleteOffice(deleting.id)
      toast.success(`Đã xóa văn phòng ${deleting.name}.`)
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được văn phòng. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm văn phòng"
      : formMode === "edit"
        ? "Sửa văn phòng"
        : "Chi tiết văn phòng"

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
            Văn phòng{companyName ? ` - ${companyName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, xem, sửa và xóa văn phòng của nhà xe.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={!canCreate}>
          <PlusIcon />
          Thêm văn phòng
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã, tên, địa chỉ, số điện thoại..."
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã văn phòng</TableHead>
              <TableHead>Tên văn phòng</TableHead>
              <TableHead className="hidden md:table-cell">Địa chỉ</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead className="hidden xl:table-cell">Ghi chú</TableHead>
              <TableHead className="hidden lg:table-cell">Tạo</TableHead>
              <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
              <TableHead className="w-12 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {offices.length === 0
                    ? "Chưa có văn phòng. Hãy thêm văn phòng mới."
                    : "Không tìm thấy văn phòng phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredOffices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-medium uppercase">
                    {office.office_code}
                  </TableCell>
                  <TableCell>{office.name}</TableCell>
                  <TableCell
                    className="hidden max-w-72 truncate md:table-cell"
                    title={office.address}
                  >
                    {office.address}
                  </TableCell>
                  <TableCell
                    className="max-w-56 truncate"
                    title={office.phones.join(", ")}
                  >
                    {office.phones.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground xl:table-cell">
                    {office.note || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={office.created_by}
                      timestamp={office.created_at}
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={office.updated_by}
                      timestamp={office.updated_at}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">Mở menu {office.name}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openView(office)}>
                          <EyeIcon />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(office)}>
                          <PencilIcon />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(office)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>
              {formMode === "view"
                ? "Thông tin chi tiết văn phòng."
                : "Mã văn phòng tự viết hoa. Có thể thêm nhiều số điện thoại."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="office-company">Nhà xe</FieldLabel>
              <Input id="office-company" value={companyName} disabled />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="office-code">Mã văn phòng</FieldLabel>
                <Input
                  id="office-code"
                  value={form.office_code}
                  onChange={(event) =>
                    updateField("office_code", event.target.value.toUpperCase())
                  }
                  placeholder="VP-HCM"
                  className="uppercase"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.office_code)}
                />
                {errors.office_code ? (
                  <FieldError>{errors.office_code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="office-name">Tên văn phòng</FieldLabel>
                <Input
                  id="office-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Văn phòng Hồ Chí Minh"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="office-address">Địa chỉ</FieldLabel>
              <Textarea
                id="office-address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="265 Cô Giang, Quận 1, TP. Hồ Chí Minh"
                disabled={isReadOnly}
                aria-invalid={Boolean(errors.address)}
              />
              {errors.address ? <FieldError>{errors.address}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel>Số điện thoại</FieldLabel>
              <FieldDescription>
                Nhập một hoặc nhiều số điện thoại của văn phòng.
              </FieldDescription>
              <div className="flex flex-col gap-2">
                {form.phones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={phone}
                      onChange={(event) => {
                        const next = [...form.phones]
                        next[index] = event.target.value
                        updateField("phones", next)
                      }}
                      placeholder="028 3838 6868"
                      disabled={isReadOnly}
                      aria-invalid={Boolean(errors.phones)}
                    />
                    {!isReadOnly && form.phones.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          updateField(
                            "phones",
                            form.phones.filter(
                              (_, phoneIndex) => phoneIndex !== index
                            )
                          )
                        }
                      >
                        Xóa
                      </Button>
                    ) : null}
                  </div>
                ))}
                {!isReadOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => updateField("phones", [...form.phones, ""])}
                  >
                    Thêm số điện thoại
                  </Button>
                ) : null}
              </div>
              {errors.phones ? <FieldError>{errors.phones}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="office-note">Ghi chú</FieldLabel>
              <Textarea
                id="office-note"
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="Giờ làm việc, ghi chú nội bộ..."
                disabled={isReadOnly}
              />
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
                      ? "Thêm văn phòng"
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
            <AlertDialogTitle>Xóa văn phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Văn phòng {deleting?.name} sẽ bị xóa khỏi hệ thống.
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
