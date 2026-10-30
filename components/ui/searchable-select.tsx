"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "cn"

export type SearchableSelectItem = {
  value: string
  label: string
  description?: string
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function SearchableSelect({
  id,
  value,
  items,
  onValueChange,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm...",
  emptyText = "Không tìm thấy.",
  disabled,
  invalid,
  className,
}: {
  id?: string
  value: string
  items: SearchableSelectItem[]
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selected = items.find((item) => item.value === value)

  const filtered = useMemo(() => {
    const keyword = normalizeSearch(query)
    if (!keyword) {
      return items
    }
    return items.filter((item) =>
      normalizeSearch(`${item.label} ${item.description ?? ""}`).includes(keyword)
    )
  }, [items, query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("keydown", handleKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm outline-none transition-colors select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
      >
        <span
          className={cn(
            "line-clamp-1 flex-1 text-left",
            selected ? "" : "text-muted-foreground"
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <div className="relative border-b p-1.5">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-7"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-sm text-muted-foreground">
                {emptyText}
              </li>
            ) : (
              filtered.map((item) => {
                const isSelected = item.value === value
                return (
                  <li key={item.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onValueChange(item.value)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/70"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block">{item.label}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <CheckIcon className="mt-0.5 size-4 shrink-0" />
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
