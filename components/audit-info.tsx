import { formatDateTime } from "@/lib/utils"

/** Table cell content for the "Tạo" / "Cập nhật" columns: username above, time below. */
export function AuditInfo({
  username,
  timestamp,
}: {
  username?: string | null
  timestamp?: string
}) {
  return (
    <div className="flex flex-col">
      <span>{username || "—"}</span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatDateTime(timestamp)}
      </span>
    </div>
  )
}
