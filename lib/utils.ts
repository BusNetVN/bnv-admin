export { cn } from "cn"

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/** "29/10/2026 06:49" in the browser's time zone, or "—" when missing. */
export function formatDateTime(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME_FORMAT.format(date)
}
