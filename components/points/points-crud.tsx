"use client"

import { useEffect, useMemo, useState } from "react"
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { locationAddress } from "@/lib/locations"
import type { Province, Ward } from "@/types/locations"
import type { Company } from "@/types/companies"
import {
  companyAccessLabel,
  emptyPointInput,
  POINT_TYPES,
  pointTypeLabel,
  toPointInput,
  toPointPayload,
} from "@/lib/points"
import type { Point, PointInput } from "@/types/points"
import {
  createSharedPoint,
  deletePoint,
  updatePoint,
} from "@/service/points"
import { listWards } from "@/service/locations"
import { apiErrorMessage } from "@/service/core-api"

type FormErrors = Partial<Record<keyof PointInput, string>>

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
}

export function PointsCrud({
  points,
  provinces,
  companies,
  loadError,
  onRefresh,
}: {
  points: Point[]
  provinces: Province[]
  companies: Company[]
  loadError?: string
  onRefresh?: () => Promise<void>
}) {
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Point | null>(null)
  const [form, setForm] = useState<PointInput>(emptyPointInput())
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleting, setDeleting] = useState<Point | null>(null)
  const [pending, setPending] = useState(false)
  const [wards, setWards] = useState<Ward[]>([])
  const [wardsLoading, setWardsLoading] = useState(false)
  const [companyQuery, setCompanyQuery] = useState("")

  const provinceItems = useMemo(
    () => provinces.map((province) => ({ value: province.id, label: province.name })),
    [provinces]
  )
  const wardItems = useMemo(
    () => wards.map((ward) => ({ value: ward.id, label: ward.name })),
    [wards]
  )
  const companyItems = useMemo(() => {
    const keyword = normalizeSearch(companyQuery)
    return [...companies]
      .sort((left, right) => left.name.localeCompare(right.name, "vi"))
      .filter((company) => {
        if (!keyword) {
          return true
        }
        return normalizeSearch(
          `${company.name} ${company.short_name} ${company.company_code}`
        ).includes(keyword)
      })
  }, [companies, companyQuery])

  useEffect(() => {
    if (!formOpen || !form.province_uuid) {
      return
    }

    let cancelled = false
    void listWards(form.province_uuid)
      .then((result) => {
        if (!cancelled) {
          setWards(result)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            apiErrorMessage(error, "Không tải được danh sách xã/phường.")
          )
          setWards([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setWardsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [form.province_uuid, formOpen])

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return points
    }
    return points.filter((point) =>
      [
        point.point_code,
        point.name,
        pointTypeLabel(point.point_type),
        point.address,
        point.ward_name,
        point.province_name,
        point.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [points, query])

  function updateField<K extends keyof PointInput>(
    key: K,
    value: PointInput[K]
  ) {
    if (key === "province_uuid") {
      setWards([])
      setWardsLoading(Boolean(value))
    }

    setForm((current) => {
      if (key === "province_uuid" && current.province_uuid !== value) {
        return { ...current, province_uuid: String(value), ward_uuid: "" }
      }
      return { ...current, [key]: value }
    })
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyPointInput())
    setErrors({})
    setWards([])
    setWardsLoading(false)
    setCompanyQuery("")
    setFormOpen(true)
  }

  function openEdit(point: Point) {
    setEditing(point)
    setForm(toPointInput(point))
    setErrors({})
    setWards([])
    setWardsLoading(Boolean(point.province_uuid))
    setCompanyQuery("")
    setFormOpen(true)
  }

  function toggleCompany(id: string, checked: boolean) {
    setForm((current) => {
      const selected = new Set(current.allowed_company_uuids)
      if (checked) {
        selected.add(id)
      } else {
        selected.delete(id)
      }
      return { ...current, allowed_company_uuids: [...selected] }
    })
  }

  function validate(values: PointInput) {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) {
      nextErrors.name = "Vui lòng nhập tên điểm dừng."
    }
    if (!values.point_type) {
      nextErrors.point_type = "Vui lòng chọn loại điểm."
    }
    if (!values.open_to_all && values.allowed_company_uuids.length === 0) {
      nextErrors.allowed_company_uuids = "Chọn ít nhất một nhà xe."
    }
    return nextErrors
  }

  async function handleSave() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = toPointPayload(form)
    setPending(true)
    try {
      if (editing) {
        await updatePoint(editing.id, payload)
      } else {
        await createSharedPoint(payload)
      }
      toast.success(editing ? "Đã cập nhật điểm dừng." : "Đã thêm điểm dừng.")
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được điểm dừng. Thử lại sau."))
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
      await deletePoint(deleting.id)
      toast.success("Đã xóa điểm dừng.")
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được điểm dừng. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Điểm dừng
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Điểm dừng hệ thống. Có thể giới hạn nhà xe được phép sử dụng từng điểm.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 max-w-sm flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã, tên, địa chỉ..."
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Thêm điểm dừng
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên điểm dừng</TableHead>
              <TableHead>Loại điểm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Nhà xe</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="hidden lg:table-cell">Tạo</TableHead>
              <TableHead className="hidden lg:table-cell">Sửa</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  {points.length === 0
                    ? "Chưa có điểm dừng dùng chung."
                    : "Không tìm thấy điểm dừng phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((point) => (
                <TableRow key={point.id}>
                  <TableCell className="font-medium uppercase">
                    {point.point_code}
                  </TableCell>
                  <TableCell>{point.name}</TableCell>
                  <TableCell>{pointTypeLabel(point.point_type)}</TableCell>
                  <TableCell
                    className="max-w-72 truncate"
                    title={locationAddress(
                      point.address,
                      point.ward_name,
                      point.province_name
                    )}
                  >
                    {locationAddress(
                      point.address,
                      point.ward_name,
                      point.province_name
                    ) || "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-48 truncate"
                    title={(point.allowed_companies ?? [])
                      .map((company) => company.short_name || company.name)
                      .join(", ")}
                  >
                    {companyAccessLabel(point.allowed_companies)}
                  </TableCell>
                  <TableCell>
                    {point.status ? "Hoạt động" : "Ngưng"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={point.created_by}
                      timestamp={point.created_at}
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <AuditInfo
                      username={point.updated_by}
                      timestamp={point.updated_at}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(point)}
                      >
                        <PencilIcon />
                        <span className="sr-only">Sửa {point.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(point)}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Xóa {point.name}</span>
                      </Button>
                    </div>
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
            <DialogTitle>
              {editing ? "Sửa điểm dừng" : "Thêm điểm dừng"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập thông tin điểm dừng và nhà xe được phép sử dụng.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="admin-point-code">Mã điểm dừng</FieldLabel>
                <Input
                  id="admin-point-code"
                  value={form.point_code}
                  onChange={(event) =>
                    updateField("point_code", event.target.value.toUpperCase())
                  }
                  className="uppercase"
                />
                {errors.point_code ? (
                  <FieldError>{errors.point_code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-point-name">Tên điểm dừng</FieldLabel>
                <Input
                  id="admin-point-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="admin-point-type">Loại điểm</FieldLabel>
              <SearchableSelect
                id="admin-point-type"
                value={form.point_type}
                items={POINT_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                  description: item.description,
                }))}
                onValueChange={(value) =>
                  updateField("point_type", value as PointInput["point_type"])
                }
                placeholder="Chọn loại điểm"
                searchPlaceholder="Tìm loại điểm..."
                invalid={Boolean(errors.point_type)}
              />
              {errors.point_type ? (
                <FieldError>{errors.point_type}</FieldError>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="admin-point-province">Tỉnh/thành</FieldLabel>
                <SearchableSelect
                  id="admin-point-province"
                  value={form.province_uuid}
                  items={provinceItems}
                  onValueChange={(value) => updateField("province_uuid", value)}
                  placeholder="Chọn tỉnh/thành"
                  searchPlaceholder="Tìm tỉnh/thành..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-point-ward">Xã/phường</FieldLabel>
                <SearchableSelect
                  id="admin-point-ward"
                  value={form.ward_uuid}
                  items={wardItems}
                  onValueChange={(value) => updateField("ward_uuid", value)}
                  disabled={!form.province_uuid || wardsLoading}
                  placeholder={
                    !form.province_uuid
                      ? "Chọn tỉnh trước"
                      : wardsLoading
                        ? "Đang tải..."
                        : "Chọn xã/phường"
                  }
                  searchPlaceholder="Tìm xã/phường..."
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="admin-point-address">
                Địa chỉ chi tiết
              </FieldLabel>
              <Textarea
                id="admin-point-address"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="Số nhà, đường..."
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-point-note">Ghi chú</FieldLabel>
              <Textarea
                id="admin-point-note"
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
              />
            </Field>
            <Field orientation="horizontal" className="items-center gap-2">
              <Checkbox
                id="admin-point-status"
                checked={form.status}
                onCheckedChange={(checked) =>
                  updateField("status", checked === true)
                }
              />
              <FieldLabel htmlFor="admin-point-status" className="font-normal">
                Đang hoạt động
              </FieldLabel>
            </Field>
            <Field>
              <FieldLabel>Nhà xe được sử dụng</FieldLabel>
              <Field orientation="horizontal" className="items-center gap-2">
                <Checkbox
                  id="admin-point-open"
                  checked={form.open_to_all}
                  onCheckedChange={(checked) =>
                    updateField("open_to_all", checked === true)
                  }
                />
                <FieldLabel htmlFor="admin-point-open" className="font-normal">
                  Tất cả nhà xe
                </FieldLabel>
              </Field>
              {form.open_to_all ? (
                <p className="text-xs text-muted-foreground">
                  Mọi nhà xe đều dùng được điểm dừng này.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Chỉ những nhà xe được chọn mới dùng được điểm dừng này.
                    {form.allowed_company_uuids.length > 0
                      ? ` Đã chọn ${form.allowed_company_uuids.length}.`
                      : ""}
                  </p>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={companyQuery}
                      onChange={(event) => setCompanyQuery(event.target.value)}
                      placeholder="Tìm nhà xe..."
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-lg border">
                    {companyItems.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        {companies.length === 0
                          ? "Chưa có nhà xe."
                          : "Không tìm thấy nhà xe phù hợp."}
                      </p>
                    ) : (
                      companyItems.map((company) => {
                        const checked = form.allowed_company_uuids.includes(
                          company.id
                        )
                        return (
                          <div
                            key={company.id}
                            role="checkbox"
                            aria-checked={checked}
                            tabIndex={0}
                            className="flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                            onClick={() => toggleCompany(company.id, !checked)}
                            onKeyDown={(event) => {
                              if (event.key === " " || event.key === "Enter") {
                                event.preventDefault()
                                toggleCompany(company.id, !checked)
                              }
                            }}
                          >
                            <Checkbox
                              checked={checked}
                              tabIndex={-1}
                              aria-hidden
                              className="pointer-events-none"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">
                                {company.short_name || company.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {company.company_code}
                                {company.short_name ? ` · ${company.name}` : ""}
                                {company.is_active ? "" : " · Ngưng"}
                              </span>
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {errors.allowed_company_uuids ? (
                    <FieldError>{errors.allowed_company_uuids}</FieldError>
                  ) : null}
                </div>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={pending}>
              {pending ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </Button>
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
            <AlertDialogTitle>Xóa điểm dừng?</AlertDialogTitle>
            <AlertDialogDescription>
              Điểm dừng {deleting?.name} sẽ bị xóa khỏi danh sách dùng chung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
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
