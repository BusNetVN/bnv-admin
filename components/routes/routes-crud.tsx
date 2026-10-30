"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeftIcon,
  EyeIcon,
  GripVerticalIcon,
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
import { cn } from "@/lib/utils"
import {
  MAX_DISTANCE_KM,
  MAX_DURATION_MINUTES,
  emptyRouteInput,
  formatDistance,
  formatDuration,
  itineraryLabel,
  optionalIntError,
  routeNameFromEndpoints,
  statusLabel,
  toRouteInput,
  toRoutePayload,
} from "@/lib/routes"
import type { Company } from "@/types/companies"
import type { Route, RouteInput } from "@/types/routes"
import {
  createRoute,
  deleteRoute,
  reorderRoutes,
  updateRoute,
} from "@/service/routes"
import { apiErrorMessage } from "@/service/core-api"

type FormMode = "create" | "edit" | "view"

type RoutesCrudProps = {
  /** Every route shown and created belongs to this company; missing when it failed to load. */
  company?: Company
  routes: Route[]
  loadError?: string
  onRefresh?: () => Promise<void>
}

type FormErrors = Partial<Record<keyof RouteInput, string>>

export function RoutesCrud({
  company,
  routes,
  loadError,
  onRefresh,
}: RoutesCrudProps) {
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>("create")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RouteInput>(emptyRouteInput())
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleting, setDeleting] = useState<Route | null>(null)
  const [pending, setPending] = useState(false)
  /** New order shown right after a drop, until the refreshed list arrives. */
  const [reorderedRoutes, setReorderedRoutes] = useState<Route[] | null>(null)
  const displayedRoutes = reorderedRoutes ?? routes
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const filteredRoutes = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) {
      return displayedRoutes
    }

    return displayedRoutes.filter((route) =>
      [
        route.route_code,
        route.name,
        route.origin,
        route.destination,
        route.note,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    )
  }, [displayedRoutes, query])

  const isReadOnly = formMode === "view"
  const canCreate = Boolean(company) && !loadError
  const companyName = company ? company.short_name || company.name : ""
  // The API needs every route of the company in the new order, so a search (which hides
  // some of them) disables reordering.
  const canReorder =
    Boolean(company) &&
    !query.trim() &&
    !reorderedRoutes &&
    !loadError &&
    filteredRoutes.length > 1

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!company || !over || !canReorder || active.id === over.id) {
      return
    }

    const oldIndex = displayedRoutes.findIndex((route) => route.id === active.id)
    const newIndex = displayedRoutes.findIndex((route) => route.id === over.id)
    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const nextRoutes = arrayMove(displayedRoutes, oldIndex, newIndex)
    setReorderedRoutes(nextRoutes)

    try {
      await reorderRoutes(
        company.id,
        nextRoutes.map((route) => route.id)
      )
      toast.success("Đã lưu thứ tự tuyến.")
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được thứ tự tuyến. Thử lại sau."))
    } finally {
      setReorderedRoutes(null)
    }
  }
  const autoName = routeNameFromEndpoints(form.origin, form.destination)

  function updateField<K extends keyof RouteInput>(
    key: K,
    value: RouteInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function openCreate() {
    if (!company) {
      return
    }
    setFormMode("create")
    setEditingId(null)
    setForm(emptyRouteInput(company.id))
    setErrors({})
    setFormOpen(true)
  }

  function openForm(route: Route, mode: Exclude<FormMode, "create">) {
    setFormMode(mode)
    setEditingId(route.id)
    setForm(toRouteInput(route))
    setErrors({})
    setFormOpen(true)
  }

  function validate(values: RouteInput) {
    const nextErrors: FormErrors = {}
    const routeCode = values.route_code.trim().toUpperCase()

    if (!routeCode) {
      nextErrors.route_code = "Vui lòng nhập mã tuyến."
    } else if (
      routes.some(
        (route) =>
          route.id !== editingId &&
          route.route_code.toUpperCase() === routeCode
      )
    ) {
      nextErrors.route_code = "Mã tuyến đã tồn tại trong nhà xe."
    }

    if (!values.origin.trim()) {
      nextErrors.origin = "Vui lòng nhập điểm đi."
    }

    if (!values.destination.trim()) {
      nextErrors.destination = "Vui lòng nhập điểm đến."
    }

    const distanceError = optionalIntError(
      values.distance_km,
      MAX_DISTANCE_KM,
      "Khoảng cách"
    )
    if (distanceError) {
      nextErrors.distance_km = distanceError
    }

    const durationError = optionalIntError(
      values.duration_minutes,
      MAX_DURATION_MINUTES,
      "Thời gian chạy"
    )
    if (durationError) {
      nextErrors.duration_minutes = durationError
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
        await createRoute(form)
      } else if (editingId) {
        await updateRoute(editingId, toRoutePayload(form))
      } else {
        toast.error("Không lưu được tuyến xe. Thử lại sau.")
        return
      }

      toast.success(
        formMode === "create" ? "Đã thêm tuyến xe." : "Đã cập nhật tuyến xe."
      )
      setFormOpen(false)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được tuyến xe. Thử lại sau."))
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
      await deleteRoute(deleting.id)
      toast.success(`Đã xóa tuyến ${deleting.name}.`)
      setDeleting(null)
      await onRefresh?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được tuyến xe. Thử lại sau."))
    } finally {
      setPending(false)
    }
  }

  const formTitle =
    formMode === "create"
      ? "Thêm tuyến xe"
      : formMode === "edit"
        ? "Sửa tuyến xe"
        : "Chi tiết tuyến xe"

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
            Tuyến xe{companyName ? ` - ${companyName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, xem, sửa và xóa tuyến xe của nhà xe.
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} disabled={!canCreate}>
          <PlusIcon />
          Thêm tuyến xe
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm mã, tên tuyến, điểm đi, điểm đến..."
          className="pl-8"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {query.trim()
          ? "Xóa từ khóa tìm kiếm để kéo thả sắp xếp thứ tự tuyến."
          : "Giữ và kéo biểu tượng ⋮⋮ ở đầu dòng để sắp xếp thứ tự các tuyến."}
      </p>

      <div className="rounded-xl border">
        <DndContext
          id="admin-routes-order"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Mã tuyến</TableHead>
                <TableHead>Tên tuyến</TableHead>
                <TableHead className="hidden md:table-cell">Hành trình</TableHead>
                <TableHead className="hidden xl:table-cell">Khoảng cách</TableHead>
                <TableHead className="hidden xl:table-cell">Thời gian chạy</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden lg:table-cell">Tạo</TableHead>
                <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                <TableHead className="w-12 text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={filteredRoutes.map((route) => route.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {filteredRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {routes.length === 0
                        ? "Chưa có tuyến xe. Hãy thêm tuyến xe mới."
                        : "Không tìm thấy tuyến xe phù hợp."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoutes.map((route) => (
                    <SortableRouteRow
                      key={route.id}
                      route={route}
                      sortable={canReorder}
                      onView={() => openForm(route, "view")}
                      onEdit={() => openForm(route, "edit")}
                      onDelete={() => setDeleting(route)}
                    />
                  ))
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formTitle}</DialogTitle>
            <DialogDescription>
              {formMode === "view"
                ? "Thông tin chi tiết tuyến xe."
                : "Mã tuyến tự viết hoa. Tên tuyến bỏ trống sẽ tự đặt theo điểm đi - điểm đến."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="route-company">Nhà xe</FieldLabel>
              <Input id="route-company" value={companyName} disabled />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="route-code">Mã tuyến</FieldLabel>
                <Input
                  id="route-code"
                  value={form.route_code}
                  onChange={(event) =>
                    updateField("route_code", event.target.value.toUpperCase())
                  }
                  placeholder="SG-ĐL"
                  className="uppercase"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.route_code)}
                />
                {errors.route_code ? (
                  <FieldError>{errors.route_code}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="route-name">Tên tuyến</FieldLabel>
                <Input
                  id="route-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder={autoName || "Sài Gòn - Đăk Lăk"}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="route-origin">Điểm đi</FieldLabel>
                <Input
                  id="route-origin"
                  value={form.origin}
                  onChange={(event) => updateField("origin", event.target.value)}
                  placeholder="Bến xe Miền Đông"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.origin)}
                />
                {errors.origin ? <FieldError>{errors.origin}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="route-destination">Điểm đến</FieldLabel>
                <Input
                  id="route-destination"
                  value={form.destination}
                  onChange={(event) =>
                    updateField("destination", event.target.value)
                  }
                  placeholder="Bến xe Phía nam Buôn Ma Thuột"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.destination)}
                />
                {errors.destination ? (
                  <FieldError>{errors.destination}</FieldError>
                ) : null}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="route-distance">Khoảng cách (km)</FieldLabel>
                <Input
                  id="route-distance"
                  inputMode="numeric"
                  value={form.distance_km}
                  onChange={(event) =>
                    updateField("distance_km", event.target.value)
                  }
                  placeholder="350"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.distance_km)}
                />
                {errors.distance_km ? (
                  <FieldError>{errors.distance_km}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="route-duration">
                  Thời gian chạy (phút)
                </FieldLabel>
                <Input
                  id="route-duration"
                  inputMode="numeric"
                  value={form.duration_minutes}
                  onChange={(event) =>
                    updateField("duration_minutes", event.target.value)
                  }
                  placeholder="480"
                  disabled={isReadOnly}
                  aria-invalid={Boolean(errors.duration_minutes)}
                />
                {errors.duration_minutes ? (
                  <FieldError>{errors.duration_minutes}</FieldError>
                ) : form.duration_minutes.trim() ? (
                  <FieldDescription>
                    {formatDuration(Number(form.duration_minutes) || null)}
                  </FieldDescription>
                ) : null}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="route-note">Ghi chú</FieldLabel>
              <Textarea
                id="route-note"
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="Ghi chú nội bộ về tuyến..."
                disabled={isReadOnly}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="route-status">Trạng thái</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                <Switch
                  id="route-status"
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
                      ? "Thêm tuyến xe"
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
            <AlertDialogTitle>Xóa tuyến xe?</AlertDialogTitle>
            <AlertDialogDescription>
              Tuyến {deleting?.name} và các điểm dừng của tuyến sẽ bị xóa khỏi hệ
              thống. Không xóa được tuyến đang có lịch chạy hoặc giá vé.
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

function SortableRouteRow({
  route,
  sortable,
  onView,
  onEdit,
  onDelete,
}: {
  route: Route
  sortable: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: route.id, disabled: !sortable })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 bg-card shadow-sm" : undefined}
    >
      <TableCell className="w-10 pr-0">
        <button
          type="button"
          className={cn(
            "inline-flex size-7 touch-none items-center justify-center rounded-md text-muted-foreground",
            sortable
              ? "cursor-grab hover:bg-muted active:cursor-grabbing"
              : "cursor-not-allowed opacity-40"
          )}
          aria-label={`Kéo để sắp xếp ${route.name}`}
          disabled={!sortable}
          {...(sortable ? { ...attributes, ...listeners } : {})}
        >
          <GripVerticalIcon className="size-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium uppercase">{route.route_code}</TableCell>
      <TableCell>{route.name}</TableCell>
      <TableCell
        className="hidden max-w-72 truncate md:table-cell"
        title={itineraryLabel(route)}
      >
        {itineraryLabel(route) || "—"}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap xl:table-cell">
        {formatDistance(route.distance_km)}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap xl:table-cell">
        {formatDuration(route.duration_minutes)}
      </TableCell>
      <TableCell>
        <Badge variant={route.status ? "default" : "outline"}>
          {statusLabel(route.status)}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <AuditInfo username={route.created_by} timestamp={route.created_at} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <AuditInfo username={route.updated_by} timestamp={route.updated_at} />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <MoreHorizontalIcon />
            <span className="sr-only">Mở menu {route.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <EyeIcon />
              Xem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              Sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
