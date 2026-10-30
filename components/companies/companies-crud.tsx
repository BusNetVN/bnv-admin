"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2Icon,
  EyeIcon,
  MapIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AuditInfo } from "@/components/audit-info"
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
import { Separator } from "@/components/ui/separator"
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
  BUSINESS_TYPES,
  businessTypeLabel,
  emptyCompanyInput,
  isBusinessType,
  slugify,
  statusLabel,
  toCompanyInput,
} from "@/lib/companies"
import type { Company, CompanyInput } from "@/types/companies"
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/service/companies"
import { apiErrorMessage } from "@/service/core-api"

type FormMode = "create" | "edit" | "view"

type CompaniesCrudProps = {
  companies: Company[]
  loadError?: string
  onRefresh?: () => Promise<void>
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function CompaniesCrud({
  companies,
  loadError,
  onRefresh,
}: CompaniesCrudProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyInput>(emptyCompanyInput)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyInput, string>>>(
    {}
  )
  const [deleting, setDeleting] = useState<Company | null>(null)
  const [pending, setPending] = useState(false)

  const filteredCompanies = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return companies
    }

    return companies.filter((company) =>
      [
        company.name,
        company.short_name,
        company.company_code,
        company.slug,
        company.phone,
        company.email,
        company.tax_code,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [companies, query])

  const isReadOnly = formMode === "view"

  function updateField<K extends keyof CompanyInput>(
    key: K,
    value: CompanyInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    setFormMode("create")
    setEditingId(null)
    setForm(emptyCompanyInput)
    setSlugTouched(false)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(company: Company) {
    setFormMode("edit")
    setEditingId(company.id)
    setForm(toCompanyInput(company))
    setSlugTouched(true)
    setErrors({})
    setFormOpen(true)
  }

  function openView(company: Company) {
    setFormMode("view")
    setEditingId(company.id)
    setForm(toCompanyInput(company))
    setSlugTouched(true)
    setErrors({})
    setFormOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }))
  }

  function validate(values: CompanyInput) {
    const nextErrors: Partial<Record<keyof CompanyInput, string>> = {}
    const name = values.name.trim()
    const slug = values.slug.trim()
    const companyCode = values.company_code.trim().toLowerCase()

    if (!name) {
      nextErrors.name = "Vui lòng nhập tên nhà xe."
    }

    if (!companyCode) {
      nextErrors.company_code = "Vui lòng nhập mã công ty."
    } else {
      const duplicated = companies.some(
        (company) =>
          company.company_code.toLowerCase() === companyCode.toLowerCase() &&
          company.id !== editingId
      )
      if (duplicated) {
        nextErrors.company_code = "Mã công ty đã tồn tại."
      }
    }

    if (!slug) {
      nextErrors.slug = "Vui lòng nhập slug."
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang."
    } else {
      const duplicated = companies.some(
        (company) =>
          company.slug.toLowerCase() === slug.toLowerCase() &&
          company.id !== editingId
      )
      if (duplicated) {
        nextErrors.slug = "Slug đã tồn tại."
      }
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Email không hợp lệ."
    }

    if (values.website.trim() && !isHttpUrl(values.website.trim())) {
      nextErrors.website = "Website phải bắt đầu bằng http:// hoặc https://."
    }

    if (values.logo_url.trim() && !isHttpUrl(values.logo_url.trim())) {
      nextErrors.logo_url = "URL logo không hợp lệ."
    }

    if (values.cover_image_url.trim() && !isHttpUrl(values.cover_image_url.trim())) {
      nextErrors.cover_image_url = "URL ảnh bìa không hợp lệ."
    }

    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload: CompanyInput = {
      name: form.name.trim(),
      short_name: form.short_name.trim(),
      company_code: form.company_code.trim().toLowerCase(),
      slug: form.slug.trim() || slugify(form.name),
      logo_url: form.logo_url.trim(),
      cover_image_url: form.cover_image_url.trim(),
      description: form.description.trim(),
      business_type: form.business_type,
      tax_code: form.tax_code.trim(),
      business_license_no: form.business_license_no.trim(),
      legal_representative: form.legal_representative.trim(),
      representative_phone: form.representative_phone.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      website: form.website.trim(),
      is_active: form.is_active,
    }

    setPending(true)
    try {
      if (formMode === "create") {
        await createCompany(payload)
      } else if (editingId) {
        await updateCompany(editingId, payload)
      } else {
        toast.error("Không lưu được nhà xe. Thử lại sau.")
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm nhà xe." : "Đã cập nhật nhà xe."
      )
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được nhà xe. Thử lại sau."))
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
      await deleteCompany(deleting.id)
      toast.success(`Đã xóa nhà xe ${deleting.short_name || deleting.name}.`)
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được nhà xe. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm nhà xe"
      : formMode === "edit"
        ? "Sửa nhà xe"
        : "Chi tiết nhà xe"

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Nhà xe
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, xem, sửa và xóa thông tin nhà xe.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={Boolean(loadError)}>
          <PlusIcon />
          Thêm nhà xe
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên, mã công ty, điện thoại..."
          className="pl-8"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã công ty</TableHead>
              <TableHead>Nhà xe</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead className="hidden lg:table-cell">Loại hình</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden md:table-cell">Tạo</TableHead>
              <TableHead className="hidden md:table-cell">Cập nhật</TableHead>
              <TableHead className="w-12 text-right"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  {query.trim()
                    ? "Không tìm thấy nhà xe phù hợp."
                    : "Chưa có nhà xe. Hãy thêm nhà xe mới."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    {company.company_code}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {company.short_name || company.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {company.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{company.phone || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {businessTypeLabel(company.business_type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.is_active ? "default" : "outline"}>
                      {statusLabel(company.is_active)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <AuditInfo
                      username={company.created_by}
                      timestamp={company.created_at}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <AuditInfo
                      username={company.updated_by}
                      timestamp={company.updated_at}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <MoreHorizontalIcon />
                        <span className="sr-only">
                          Mở menu {company.short_name || company.name}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/companies/${company.id}/offices`)
                          }
                        >
                          <Building2Icon />
                          Văn phòng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/companies/${company.id}/routes`)
                          }
                        >
                          <MapIcon />
                          Tuyến xe
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/companies/${company.id}/users`)
                          }
                        >
                          <UsersIcon />
                          Người dùng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/companies/${company.id}/roles`)
                          }
                        >
                          <ShieldCheckIcon />
                          Vai trò
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openView(company)}>
                          <EyeIcon />
                          Xem
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(company)}>
                          <PencilIcon />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(company)}
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
                ? "Thông tin chi tiết nhà xe."
                : "Nhập đầy đủ thông tin nhà xe. Tên, mã công ty và slug là bắt buộc."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <p className="text-sm font-medium">Thông tin chung</p>
            <Field>
              <FieldLabel htmlFor="company-name">Tên nhà xe</FieldLabel>
              <Input
                id="company-name"
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Công ty Cổ phần Xe khách Phương Trang"
                disabled={isReadOnly}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-company-code">Mã công ty</FieldLabel>
                <Input
                  id="company-company-code"
                  value={form.company_code}
                  onChange={(event) =>
                    updateField("company_code", event.target.value.toLowerCase())
                  }
                  placeholder="futa"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.company_code)}
                />
                {errors.company_code ? (
                  <FieldError>{errors.company_code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="company-short-name">Tên viết tắt</FieldLabel>
                <Input
                  id="company-short-name"
                  value={form.short_name}
                  onChange={(event) =>
                    updateField("short_name", event.target.value)
                  }
                  placeholder="Phương Trang"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="company-status">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="company-status"
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
              <FieldLabel htmlFor="company-slug">Slug</FieldLabel>
              <Input
                id="company-slug"
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  updateField("slug", event.target.value)
                }}
                placeholder="phuong-trang"
                disabled={isReadOnly}
                aria-invalid={Boolean(errors.slug)}
              />
              <FieldDescription>
                Dùng trên URL. Tự tạo từ tên nhà xe nếu để trống.
              </FieldDescription>
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="company-description">Mô tả</FieldLabel>
              <Textarea
                id="company-description"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Giới thiệu ngắn về nhà xe"
                disabled={isReadOnly}
              />
            </Field>

            <Separator />
            <p className="text-sm font-medium">Hình ảnh</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-logo">Logo URL</FieldLabel>
                <Input
                  id="company-logo"
                  value={form.logo_url}
                  onChange={(event) =>
                    updateField("logo_url", event.target.value)
                  }
                  placeholder="https://..."
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.logo_url)}
                />
                {errors.logo_url ? (
                  <FieldError>{errors.logo_url}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="company-cover">Ảnh bìa URL</FieldLabel>
                <Input
                  id="company-cover"
                  value={form.cover_image_url}
                  onChange={(event) =>
                    updateField("cover_image_url", event.target.value)
                  }
                  placeholder="https://..."
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.cover_image_url)}
                />
                {errors.cover_image_url ? (
                  <FieldError>{errors.cover_image_url}</FieldError>
                ) : null}
              </Field>
            </div>

            <Separator />
            <p className="text-sm font-medium">Pháp lý</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-business-type">
                  Loại hình
                </FieldLabel>
                <Select
                  value={form.business_type}
                  items={Object.fromEntries(
                    BUSINESS_TYPES.map((type) => [type.value, type.label])
                  )}
                  onValueChange={(value) => {
                    if (isBusinessType(value)) {
                      updateField("business_type", value)
                    }
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger id="company-business-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="company-tax">Mã số thuế</FieldLabel>
                <Input
                  id="company-tax"
                  value={form.tax_code}
                  onChange={(event) =>
                    updateField("tax_code", event.target.value)
                  }
                  placeholder="1800156805"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="company-license">
                Số giấy phép kinh doanh
              </FieldLabel>
              <Input
                id="company-license"
                value={form.business_license_no}
                onChange={(event) =>
                  updateField("business_license_no", event.target.value)
                }
                placeholder="1800156805-001"
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-representative">
                  Người đại diện
                </FieldLabel>
                <Input
                  id="company-representative"
                  value={form.legal_representative}
                  onChange={(event) =>
                    updateField("legal_representative", event.target.value)
                  }
                  placeholder="Nguyễn Văn A"
                  disabled={isReadOnly}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-representative-phone">
                  SĐT người đại diện
                </FieldLabel>
                <Input
                  id="company-representative-phone"
                  value={form.representative_phone}
                  onChange={(event) =>
                    updateField("representative_phone", event.target.value)
                  }
                  placeholder="0901 234 567"
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Separator />
            <p className="text-sm font-medium">Liên hệ</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-phone">Số điện thoại</FieldLabel>
                <Input
                  id="company-phone"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="1900 6067"
                  disabled={isReadOnly}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-email">Email</FieldLabel>
                <Input
                  id="company-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="cskh@nhaxe.vn"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? <FieldError>{errors.email}</FieldError> : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="company-website">Website</FieldLabel>
              <Input
                id="company-website"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://nhaxe.vn"
                disabled={isReadOnly}
                aria-invalid={Boolean(errors.website)}
              />
              {errors.website ? <FieldError>{errors.website}</FieldError> : null}
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
                      ? "Thêm nhà xe"
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
            <AlertDialogTitle>Xóa nhà xe?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhà xe {deleting?.short_name || deleting?.name} sẽ bị xóa khỏi
              hệ thống.
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
